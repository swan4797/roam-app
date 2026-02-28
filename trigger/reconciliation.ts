import { task, schedules } from "@trigger.dev/sdk/v3"
import { prisma } from "@/lib/prisma"

// Helper to convert Decimal to number
function decimalToNumber(
  value: { toNumber: () => number } | null | undefined
): number {
  return value ? value.toNumber() : 0
}

// ============================================================================
// Reconciliation Types
// ============================================================================

interface ReconciliationResult {
  userId: string
  accountId: string
  accountName: string
  expectedBalance: number
  actualBalance: number
  discrepancy: number
  discrepancyPercent: number
  status: "OK" | "WARNING" | "CRITICAL"
  transactionCount: number
}

interface ReconciliationReport {
  runAt: Date
  accountsChecked: number
  discrepanciesFound: number
  criticalDiscrepancies: number
  results: ReconciliationResult[]
}

// ============================================================================
// Scheduled Reconciliation Job
// Runs nightly at 2 AM to check all account balances
// ============================================================================

export const nightlyReconciliation = schedules.task({
  id: "nightly-reconciliation",
  cron: "0 2 * * *", // Every day at 2 AM
  run: async () => {
    console.log("Starting nightly reconciliation...")

    const report = await runReconciliation()

    // Log results
    console.log(`Reconciliation complete:`)
    console.log(`  Accounts checked: ${report.accountsChecked}`)
    console.log(`  Discrepancies found: ${report.discrepanciesFound}`)
    console.log(`  Critical discrepancies: ${report.criticalDiscrepancies}`)

    // If critical discrepancies found, trigger alert
    if (report.criticalDiscrepancies > 0) {
      await alertOnCriticalDiscrepancy.trigger({
        report,
      })
    }

    return report
  },
})

// ============================================================================
// Manual Reconciliation Task
// Can be triggered on-demand for specific user or all users
// ============================================================================

export const manualReconciliation = task({
  id: "manual-reconciliation",
  run: async (payload: { userId?: string }) => {
    const { userId } = payload

    const report = await runReconciliation(userId)

    return report
  },
})

// ============================================================================
// Core Reconciliation Logic
// ============================================================================

async function runReconciliation(
  specificUserId?: string
): Promise<ReconciliationReport> {
  const results: ReconciliationResult[] = []

  // Get all bank accounts (or specific user's accounts)
  const accounts = await prisma.bankAccount.findMany({
    where: specificUserId
      ? {
          bankConnection: { userId: specificUserId },
        }
      : undefined,
    include: {
      bankConnection: {
        select: {
          userId: true,
          institutionName: true,
        },
      },
    },
  })

  for (const account of accounts) {
    // Calculate expected balance from transactions
    const transactionSum = await prisma.transaction.aggregate({
      where: {
        bankAccountId: account.id,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    const expectedBalance = transactionSum._sum.amount
      ? transactionSum._sum.amount.toNumber()
      : 0

    const actualBalance = account.balance
      ? decimalToNumber(account.balance)
      : 0

    const discrepancy = Math.abs(actualBalance - expectedBalance)
    const discrepancyPercent =
      actualBalance !== 0 ? (discrepancy / Math.abs(actualBalance)) * 100 : 0

    // Determine status based on discrepancy threshold
    let status: "OK" | "WARNING" | "CRITICAL" = "OK"
    if (discrepancyPercent > 5 || discrepancy > 100) {
      status = "CRITICAL"
    } else if (discrepancyPercent > 1 || discrepancy > 10) {
      status = "WARNING"
    }

    results.push({
      userId: account.bankConnection.userId,
      accountId: account.id,
      accountName: `${account.bankConnection.institutionName} - ${account.displayName}`,
      expectedBalance,
      actualBalance,
      discrepancy,
      discrepancyPercent,
      status,
      transactionCount: transactionSum._count,
    })
  }

  const discrepancies = results.filter((r) => r.status !== "OK")
  const criticalDiscrepancies = results.filter((r) => r.status === "CRITICAL")

  return {
    runAt: new Date(),
    accountsChecked: results.length,
    discrepanciesFound: discrepancies.length,
    criticalDiscrepancies: criticalDiscrepancies.length,
    results,
  }
}

// ============================================================================
// Portfolio Reconciliation
// Verify investment values match transaction history
// ============================================================================

export const portfolioReconciliation = schedules.task({
  id: "portfolio-reconciliation",
  cron: "0 3 * * 0", // Every Sunday at 3 AM
  run: async () => {
    console.log("Starting portfolio reconciliation...")

    const results: {
      portfolioId: string
      portfolioName: string
      sumOfInvestments: number
      recordedTotal: number
      discrepancy: number
      status: "OK" | "WARNING" | "CRITICAL"
    }[] = []

    // Get all portfolios with their investments
    const portfolios = await prisma.portfolio.findMany({
      include: {
        investments: {
          where: { status: "ACTIVE" },
          select: {
            investedAmount: true,
            currentValue: true,
          },
        },
      },
    })

    for (const portfolio of portfolios) {
      const sumOfInvestments = portfolio.investments.reduce(
        (sum, inv) => sum + decimalToNumber(inv.currentValue),
        0
      )

      const recordedTotal = portfolio.investments.reduce(
        (sum, inv) => sum + decimalToNumber(inv.investedAmount),
        0
      )

      // For portfolio, we check if current values seem reasonable
      // (within expected growth bounds)
      const discrepancy = Math.abs(sumOfInvestments - recordedTotal)
      const growthPercent =
        recordedTotal > 0
          ? ((sumOfInvestments - recordedTotal) / recordedTotal) * 100
          : 0

      // Flag unusual growth (> 50% gain or > 30% loss)
      let status: "OK" | "WARNING" | "CRITICAL" = "OK"
      if (growthPercent > 50 || growthPercent < -30) {
        status = "CRITICAL"
      } else if (growthPercent > 25 || growthPercent < -15) {
        status = "WARNING"
      }

      results.push({
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        sumOfInvestments,
        recordedTotal,
        discrepancy,
        status,
      })
    }

    const issues = results.filter((r) => r.status !== "OK")

    console.log(`Portfolio reconciliation complete:`)
    console.log(`  Portfolios checked: ${results.length}`)
    console.log(`  Issues found: ${issues.length}`)

    return {
      runAt: new Date(),
      portfoliosChecked: results.length,
      issuesFound: issues.length,
      results,
    }
  },
})

// ============================================================================
// Distribution Reconciliation
// Verify all paid distributions are accounted for
// ============================================================================

export const distributionReconciliation = task({
  id: "distribution-reconciliation",
  run: async (payload: { startDate?: Date; endDate?: Date }) => {
    const { startDate, endDate } = payload

    const dateFilter: { distributionDate?: { gte?: Date; lte?: Date } } = {}
    if (startDate || endDate) {
      dateFilter.distributionDate = {}
      if (startDate) dateFilter.distributionDate.gte = startDate
      if (endDate) dateFilter.distributionDate.lte = endDate
    }

    // Get all paid distributions grouped by investment
    const distributions = await prisma.distribution.groupBy({
      by: ["investmentId"],
      where: {
        status: "PAID",
        ...dateFilter,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // Get investment details
    const investmentIds = distributions.map((d) => d.investmentId)
    const investments = await prisma.investment.findMany({
      where: { id: { in: investmentIds } },
      include: {
        portfolio: {
          select: { name: true, userId: true },
        },
        property: {
          select: { name: true },
        },
      },
    })

    const investmentMap = new Map(investments.map((i) => [i.id, i]))

    const results = distributions.map((d) => {
      const investment = investmentMap.get(d.investmentId)
      return {
        investmentId: d.investmentId,
        portfolioName: investment?.portfolio.name || "Unknown",
        propertyName: investment?.property.name || "Unknown",
        totalDistributed: d._sum.amount
          ? decimalToNumber(d._sum.amount)
          : 0,
        distributionCount: d._count,
      }
    })

    const totalDistributed = results.reduce(
      (sum, r) => sum + r.totalDistributed,
      0
    )

    return {
      runAt: new Date(),
      period: {
        startDate: startDate || "all time",
        endDate: endDate || "now",
      },
      investmentsWithDistributions: results.length,
      totalDistributed,
      results,
    }
  },
})

// ============================================================================
// Alert Task
// Called when critical discrepancies are found
// ============================================================================

export const alertOnCriticalDiscrepancy = task({
  id: "alert-critical-discrepancy",
  run: async (payload: { report: ReconciliationReport }) => {
    const { report } = payload

    const criticalItems = report.results.filter((r) => r.status === "CRITICAL")

    // In production, this would:
    // - Send email to finance team
    // - Post to Slack channel
    // - Create ticket in issue tracker
    // - Log to monitoring system

    console.error("⚠️ CRITICAL RECONCILIATION DISCREPANCIES DETECTED")
    console.error(`Found ${criticalItems.length} critical issues:`)

    for (const item of criticalItems) {
      console.error(`
        Account: ${item.accountName}
        Expected: ${item.expectedBalance.toFixed(2)}
        Actual: ${item.actualBalance.toFixed(2)}
        Discrepancy: ${item.discrepancy.toFixed(2)} (${item.discrepancyPercent.toFixed(2)}%)
      `)
    }

    // Store alert in database for audit trail
    // In a real app, you'd have an alerts table
    // await prisma.alert.create({ ... })

    return {
      alertsSent: criticalItems.length,
      timestamp: new Date(),
    }
  },
})
