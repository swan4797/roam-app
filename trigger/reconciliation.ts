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

    console.error("CRITICAL RECONCILIATION DISCREPANCIES DETECTED")
    console.error(`Found ${criticalItems.length} critical issues:`)

    for (const item of criticalItems) {
      console.error(`
        Account: ${item.accountName}
        Expected: ${item.expectedBalance.toFixed(2)}
        Actual: ${item.actualBalance.toFixed(2)}
        Discrepancy: ${item.discrepancy.toFixed(2)} (${item.discrepancyPercent.toFixed(2)}%)
      `)
    }

    return {
      alertsSent: criticalItems.length,
      timestamp: new Date(),
    }
  },
})
