import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      baseCurrency: true,
      createdAt: true,
    },
  })

  if (!user) throw new Error("User not found")
  return user
}

export async function updateUserBaseCurrency(currency: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Validate currency code (basic check)
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Invalid currency code")
  }

  return prisma.user.update({
    where: { id: session.user.id },
    data: { baseCurrency: currency },
  })
}

export async function deleteUserAccount() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Cascade delete handles all related data
  return prisma.user.delete({
    where: { id: session.user.id },
  })
}

export async function getUserDashboardStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    accountCount,
    transactionCount,
    totalSpent,
    totalFxFees,
    unpaidInvoices,
  ] = await Promise.all([
    prisma.bankAccount.count({
      where: {
        bankConnection: { userId: session.user.id },
      },
    }),
    prisma.transaction.count({
      where: {
        bankAccount: {
          bankConnection: { userId: session.user.id },
        },
        transactionDate: { gte: thirtyDaysAgo },
        isInternalTransfer: false,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        bankAccount: {
          bankConnection: { userId: session.user.id },
        },
        amount: { lt: 0 },
        transactionDate: { gte: thirtyDaysAgo },
        isInternalTransfer: false,
      },
      _sum: { amountInBase: true },
    }),
    prisma.transaction.aggregate({
      where: {
        bankAccount: {
          bankConnection: { userId: session.user.id },
        },
        estimatedFxFee: { not: null },
        transactionDate: { gte: thirtyDaysAgo },
        isInternalTransfer: false,
      },
      _sum: { estimatedFxFee: true, wiseSavings: true },
    }),
    prisma.invoice.aggregate({
      where: {
        userId: session.user.id,
        status: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] },
      },
      _sum: { amountInBase: true },
      _count: true,
    }),
  ])

  return {
    connectedAccounts: accountCount,
    transactionsThisMonth: transactionCount,
    totalSpentThisMonth: Math.abs(totalSpent._sum.amountInBase?.toNumber() ?? 0),
    fxFeesThisMonth: totalFxFees._sum.estimatedFxFee?.toNumber() ?? 0,
    potentialWiseSavings: totalFxFees._sum.wiseSavings?.toNumber() ?? 0,
    unpaidInvoicesTotal: unpaidInvoices._sum.amountInBase?.toNumber() ?? 0,
    unpaidInvoicesCount: unpaidInvoices._count,
  }
}
