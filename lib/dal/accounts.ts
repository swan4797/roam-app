import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function decimalToNumber(value: { toNumber: () => number } | null | undefined): number | null {
  return value ? value.toNumber() : null
}

export async function getBankAccounts() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const accounts = await prisma.bankAccount.findMany({
    where: {
      bankConnection: { userId: session.user.id },
    },
    include: {
      bankConnection: {
        select: {
          institutionName: true,
          lastSyncedAt: true,
          syncStatus: true,
        },
      },
    },
    orderBy: { displayName: "asc" },
  })

  return accounts.map((account) => ({
    ...account,
    balance: decimalToNumber(account.balance),
  }))
}

export async function getBankAccount(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const account = await prisma.bankAccount.findFirst({
    where: {
      id,
      bankConnection: { userId: session.user.id },
    },
    include: {
      bankConnection: {
        select: {
          institutionName: true,
          lastSyncedAt: true,
          syncStatus: true,
        },
      },
    },
  })

  if (!account) throw new Error("Account not found")
  return account
}

export async function getAccountBalances() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const accounts = await prisma.bankAccount.findMany({
    where: {
      bankConnection: { userId: session.user.id },
    },
    select: {
      id: true,
      displayName: true,
      currency: true,
      balance: true,
      balanceUpdatedAt: true,
      bankConnection: {
        select: { institutionName: true },
      },
    },
  })

  return accounts.map((a) => ({
    id: a.id,
    displayName: a.displayName,
    institutionName: a.bankConnection.institutionName,
    currency: a.currency,
    balance: a.balance?.toNumber() ?? null,
    balanceUpdatedAt: a.balanceUpdatedAt,
  }))
}

export async function getTotalBalance() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Get user's base currency
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { baseCurrency: true },
  })
  if (!user) throw new Error("User not found")

  // For MVP, just sum balances in the same currency as base
  // TODO: Convert other currencies using stored exchange rates
  const result = await prisma.bankAccount.aggregate({
    where: {
      bankConnection: { userId: session.user.id },
      currency: user.baseCurrency,
    },
    _sum: {
      balance: true,
    },
  })

  return {
    total: result._sum.balance?.toNumber() ?? 0,
    currency: user.baseCurrency,
  }
}

export async function getAccountTransactionSummary(accountId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      bankConnection: { userId: session.user.id },
    },
  })
  if (!account) throw new Error("Account not found")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [totalIn, totalOut, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        bankAccountId: accountId,
        amount: { gt: 0 },
        transactionDate: { gte: thirtyDaysAgo },
        isInternalTransfer: false,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        bankAccountId: accountId,
        amount: { lt: 0 },
        transactionDate: { gte: thirtyDaysAgo },
        isInternalTransfer: false,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.count({
      where: {
        bankAccountId: accountId,
        transactionDate: { gte: thirtyDaysAgo },
        isInternalTransfer: false,
      },
    }),
  ])

  return {
    totalIn: totalIn._sum.amount?.toNumber() ?? 0,
    totalOut: Math.abs(totalOut._sum.amount?.toNumber() ?? 0),
    transactionCount,
    period: "30d" as const,
  }
}
