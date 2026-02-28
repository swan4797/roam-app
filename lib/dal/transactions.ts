import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"

// Helper to convert Decimal to number for serialization to Client Components
function decimalToNumber(value: { toNumber: () => number } | null | undefined): number | null {
  return value ? value.toNumber() : null
}

// Serialize transaction for Client Components
function serializeTransaction<T extends {
  amount: { toNumber: () => number }
  amountInBase?: { toNumber: () => number } | null
  midMarketRate?: { toNumber: () => number } | null
  bankRate?: { toNumber: () => number } | null
  estimatedFxFee?: { toNumber: () => number } | null
  estimatedFxFeePercent?: { toNumber: () => number } | null
  wiseRate?: { toNumber: () => number } | null
  wiseSavings?: { toNumber: () => number } | null
}>(tx: T) {
  return {
    ...tx,
    amount: tx.amount.toNumber(),
    amountInBase: decimalToNumber(tx.amountInBase),
    midMarketRate: decimalToNumber(tx.midMarketRate),
    bankRate: decimalToNumber(tx.bankRate),
    estimatedFxFee: decimalToNumber(tx.estimatedFxFee),
    estimatedFxFeePercent: decimalToNumber(tx.estimatedFxFeePercent),
    wiseRate: decimalToNumber(tx.wiseRate),
    wiseSavings: decimalToNumber(tx.wiseSavings),
  }
}

export async function getTransactions(options?: {
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
  categoryId?: string
  bankAccountId?: string
  excludeInternalTransfers?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    categoryId,
    bankAccountId,
    excludeInternalTransfers = true,
  } = options ?? {}

  const where: Prisma.TransactionWhereInput = {
    bankAccount: {
      bankConnection: { userId: session.user.id },
    },
    ...(startDate && { transactionDate: { gte: startDate } }),
    ...(endDate && { transactionDate: { lte: endDate } }),
    ...(categoryId && { categoryId }),
    ...(bankAccountId && { bankAccountId }),
    ...(excludeInternalTransfers && { isInternalTransfer: false }),
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      bankAccount: {
        select: {
          displayName: true,
          currency: true,
          bankConnection: {
            select: { institutionName: true },
          },
        },
      },
      category: true,
    },
    orderBy: { transactionDate: "desc" },
    take: limit,
    skip: offset,
  })

  return transactions.map(serializeTransaction)
}

export async function getTransaction(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
    },
    include: {
      bankAccount: {
        select: {
          displayName: true,
          currency: true,
          bankConnection: {
            select: { institutionName: true },
          },
        },
      },
      category: true,
      invoicePayments: {
        include: { invoice: true },
      },
    },
  })

  if (!transaction) throw new Error("Transaction not found")
  return transaction
}

export async function getTotalFxFees(options?: {
  startDate?: Date
  endDate?: Date
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { startDate, endDate } = options ?? {}

  const result = await prisma.transaction.aggregate({
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      estimatedFxFee: { not: null },
      isInternalTransfer: false,
      ...(startDate && { transactionDate: { gte: startDate } }),
      ...(endDate && { transactionDate: { lte: endDate } }),
    },
    _sum: {
      estimatedFxFee: true,
      wiseSavings: true,
    },
  })

  return {
    totalFxFees: result._sum.estimatedFxFee?.toNumber() ?? 0,
    totalWiseSavings: result._sum.wiseSavings?.toNumber() ?? 0,
  }
}

export async function getFxTransactions(options?: {
  limit?: number
  startDate?: Date
  endDate?: Date
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { limit = 20, startDate, endDate } = options ?? {}

  const transactions = await prisma.transaction.findMany({
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      estimatedFxFee: { not: null },
      isInternalTransfer: false,
      ...(startDate && { transactionDate: { gte: startDate } }),
      ...(endDate && { transactionDate: { lte: endDate } }),
    },
    include: {
      bankAccount: {
        select: {
          displayName: true,
          currency: true,
        },
      },
    },
    orderBy: { estimatedFxFee: "desc" },
    take: limit,
  })

  return transactions.map(serializeTransaction)
}

export async function getSpendingByCategory(options?: {
  startDate?: Date
  endDate?: Date
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { startDate, endDate } = options ?? {}

  const result = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      isInternalTransfer: false,
      amount: { lt: 0 }, // Only outgoing transactions
      ...(startDate && { transactionDate: { gte: startDate } }),
      ...(endDate && { transactionDate: { lte: endDate } }),
    },
    _sum: {
      amountInBase: true,
    },
    _count: true,
  })

  // Fetch category details
  const categoryIds = result.map((r) => r.categoryId).filter(Boolean) as string[]
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  })
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  return result.map((r) => ({
    category: r.categoryId ? categoryMap.get(r.categoryId) : null,
    totalSpent: Math.abs(r._sum.amountInBase?.toNumber() ?? 0),
    transactionCount: r._count,
  }))
}

export async function markAsInternalTransfer(
  transactionId: string,
  linkedTransactionId?: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
    },
  })
  if (!transaction) throw new Error("Transaction not found")

  return prisma.transaction.update({
    where: { id: transactionId },
    data: {
      isInternalTransfer: true,
      linkedTransactionId,
    },
  })
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
    },
  })
  if (!transaction) throw new Error("Transaction not found")

  return prisma.transaction.update({
    where: { id: transactionId },
    data: { categoryId },
  })
}

export async function getWeeklyFxFees() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const result = await prisma.transaction.aggregate({
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      estimatedFxFee: { not: null },
      isInternalTransfer: false,
      transactionDate: { gte: oneWeekAgo },
    },
    _sum: {
      estimatedFxFee: true,
    },
    _count: true,
  })

  return {
    weeklyFees: result._sum.estimatedFxFee?.toNumber() ?? 0,
    transactionCount: result._count,
  }
}

export async function getCurrencyBreakdown() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Get spending by currency
  const spending = await prisma.transaction.groupBy({
    by: ["currency"],
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      isInternalTransfer: false,
      transactionDate: { gte: thirtyDaysAgo },
    },
    _sum: {
      amount: true,
      estimatedFxFee: true,
    },
    _count: true,
  })

  // Get account counts by currency
  const accounts = await prisma.bankAccount.groupBy({
    by: ["currency"],
    where: {
      bankConnection: { userId: session.user.id },
    },
    _count: true,
    _sum: {
      balance: true,
    },
  })

  const accountMap = new Map(accounts.map(a => [a.currency, a]))

  return spending.map(s => ({
    currency: s.currency,
    monthlySpending: s._sum.amount?.toNumber() ?? 0,
    fxFees: s._sum.estimatedFxFee?.toNumber() ?? 0,
    transactionCount: s._count,
    accountCount: accountMap.get(s.currency)?._count ?? 0,
    balance: accountMap.get(s.currency)?._sum.balance?.toNumber() ?? 0,
  }))
}

export async function getFxStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  // This month's fees
  const thisMonth = await prisma.transaction.aggregate({
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      estimatedFxFee: { not: null },
      isInternalTransfer: false,
      transactionDate: { gte: thirtyDaysAgo },
    },
    _sum: {
      estimatedFxFee: true,
      wiseSavings: true,
    },
    _count: true,
  })

  // Last month's fees (for comparison)
  const lastMonth = await prisma.transaction.aggregate({
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      estimatedFxFee: { not: null },
      isInternalTransfer: false,
      transactionDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
    _sum: {
      estimatedFxFee: true,
    },
  })

  // Top currency
  const topCurrency = await prisma.transaction.groupBy({
    by: ["currency"],
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      isInternalTransfer: false,
      transactionDate: { gte: thirtyDaysAgo },
      currency: { not: "GBP" },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      _sum: {
        amount: "asc", // Most negative = most spending
      },
    },
    take: 1,
  })

  const thisMonthFees = thisMonth._sum.estimatedFxFee?.toNumber() ?? 0
  const lastMonthFees = lastMonth._sum.estimatedFxFee?.toNumber() ?? 0
  const monthlyChange = lastMonthFees > 0
    ? Math.round(((thisMonthFees - lastMonthFees) / lastMonthFees) * 100)
    : 0

  return {
    totalFxFees: thisMonthFees,
    wiseSavings: thisMonth._sum.wiseSavings?.toNumber() ?? 0,
    transactionCount: thisMonth._count,
    topCurrency: topCurrency[0]?.currency ?? "EUR",
    monthlyChange,
  }
}
