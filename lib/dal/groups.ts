import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma, SplitType } from "@/generated/prisma/client"

// Helper to convert Decimal to number
function decimalToNumber(value: { toNumber: () => number } | null | undefined): number | null {
  return value ? value.toNumber() : null
}

// Serialize expense for Client Components
function serializeExpense<T extends {
  amount: { toNumber: () => number }
  amountInGroupCurrency?: { toNumber: () => number } | null
  midMarketRate?: { toNumber: () => number } | null
  actualRate?: { toNumber: () => number } | null
  estimatedFxFee?: { toNumber: () => number } | null
}>(expense: T) {
  return {
    ...expense,
    amount: expense.amount.toNumber(),
    amountInGroupCurrency: decimalToNumber(expense.amountInGroupCurrency),
    midMarketRate: decimalToNumber(expense.midMarketRate),
    actualRate: decimalToNumber(expense.actualRate),
    estimatedFxFee: decimalToNumber(expense.estimatedFxFee),
  }
}

// Serialize split for Client Components
function serializeSplit<T extends {
  amount: { toNumber: () => number }
  percentage?: { toNumber: () => number } | null
  amountInMemberCurrency?: { toNumber: () => number } | null
  fxFeeOnSplit?: { toNumber: () => number } | null
}>(split: T) {
  return {
    ...split,
    amount: split.amount.toNumber(),
    percentage: decimalToNumber(split.percentage),
    amountInMemberCurrency: decimalToNumber(split.amountInMemberCurrency),
    fxFeeOnSplit: decimalToNumber(split.fxFeeOnSplit),
  }
}

// Serialize settlement for Client Components
function serializeSettlement<T extends {
  amount: { toNumber: () => number }
  amountInGroupCurrency?: { toNumber: () => number } | null
  midMarketRate?: { toNumber: () => number } | null
  actualRate?: { toNumber: () => number } | null
  estimatedFxFee?: { toNumber: () => number } | null
  wiseSavings?: { toNumber: () => number } | null
}>(settlement: T) {
  return {
    ...settlement,
    amount: settlement.amount.toNumber(),
    amountInGroupCurrency: decimalToNumber(settlement.amountInGroupCurrency),
    midMarketRate: decimalToNumber(settlement.midMarketRate),
    actualRate: decimalToNumber(settlement.actualRate),
    estimatedFxFee: decimalToNumber(settlement.estimatedFxFee),
    wiseSavings: decimalToNumber(settlement.wiseSavings),
  }
}

export async function getGroups() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const groups = await prisma.expenseGroup.findMany({
    where: {
      OR: [
        { createdById: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
      _count: {
        select: { expenses: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return groups
}

export async function getGroup(groupId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      OR: [
        { createdById: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  })

  if (!group) throw new Error("Group not found")
  return group
}

export async function getGroupExpenses(groupId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify user has access to the group
  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      OR: [
        { createdById: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  })

  if (!group) throw new Error("Group not found")

  const expenses = await prisma.groupExpense.findMany({
    where: { groupId },
    include: {
      paidBy: {
        select: { id: true, name: true, userId: true },
      },
      splits: {
        include: {
          member: {
            select: { id: true, name: true, userId: true },
          },
        },
      },
    },
    orderBy: { expenseDate: "desc" },
  })

  return expenses.map((expense) => ({
    ...serializeExpense(expense),
    splits: expense.splits.map(serializeSplit),
  }))
}

export async function getGroupBalances(groupId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify user has access to the group
  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      OR: [
        { createdById: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      members: true,
    },
  })

  if (!group) throw new Error("Group not found")

  // Get all expenses with splits
  const expenses = await prisma.groupExpense.findMany({
    where: { groupId },
    include: {
      splits: true,
      paidBy: true,
    },
  })

  // Get all settlements
  const settlements = await prisma.groupSettlement.findMany({
    where: {
      groupId,
      status: "COMPLETED",
    },
  })

  // Calculate balances: positive = owed money, negative = owes money
  const balances: Record<string, number> = {}

  // Initialize balances for all members
  for (const member of group.members) {
    balances[member.id] = 0
  }

  // Process expenses
  for (const expense of expenses) {
    const paidAmount = expense.amount.toNumber()

    // Person who paid gets credit
    balances[expense.paidById] = (balances[expense.paidById] || 0) + paidAmount

    // Each person's split is a debit
    for (const split of expense.splits) {
      const splitAmount = split.amount.toNumber()
      balances[split.memberId] = (balances[split.memberId] || 0) - splitAmount
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    const amount = settlement.amount.toNumber()
    // From member paid, so their balance decreases (less debt)
    balances[settlement.fromMemberId] = (balances[settlement.fromMemberId] || 0) + amount
    // To member received, so their balance decreases (less owed to them)
    balances[settlement.toMemberId] = (balances[settlement.toMemberId] || 0) - amount
  }

  // Build simplified debts (who owes whom)
  const debts: Array<{
    from: { id: string; name: string }
    to: { id: string; name: string }
    amount: number
    currency: string
  }> = []

  const memberMap = new Map(group.members.map((m) => [m.id, m]))

  // Simplify debts using greedy algorithm
  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0.01)
    .map(([id, balance]) => ({ id, balance }))
    .sort((a, b) => b.balance - a.balance)

  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < -0.01)
    .map(([id, balance]) => ({ id, balance: Math.abs(balance) }))
    .sort((a, b) => b.balance - a.balance)

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i]
    const debtor = debtors[j]
    const amount = Math.min(creditor.balance, debtor.balance)

    if (amount > 0.01) {
      const fromMember = memberMap.get(debtor.id)
      const toMember = memberMap.get(creditor.id)

      if (fromMember && toMember) {
        debts.push({
          from: { id: fromMember.id, name: fromMember.name },
          to: { id: toMember.id, name: toMember.name },
          amount: Math.round(amount * 100) / 100,
          currency: group.currency,
        })
      }
    }

    creditor.balance -= amount
    debtor.balance -= amount

    if (creditor.balance < 0.01) i++
    if (debtor.balance < 0.01) j++
  }

  // Build member balances for display
  const memberBalances = group.members.map((member) => ({
    member: {
      id: member.id,
      name: member.name,
      userId: member.userId,
    },
    balance: Math.round((balances[member.id] || 0) * 100) / 100,
  }))

  return {
    balances: memberBalances,
    debts,
    currency: group.currency,
  }
}

export async function createGroup(data: {
  name: string
  description?: string
  currency?: string
  members?: Array<{ name: string; email?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  const group = await prisma.expenseGroup.create({
    data: {
      name: data.name,
      description: data.description,
      currency: data.currency || "GBP",
      createdById: session.user.id,
      members: {
        create: [
          // Add creator as first member
          {
            userId: session.user.id,
            name: user?.name || "Me",
            email: user?.email,
          },
          // Add other members
          ...(data.members || []).map((m) => ({
            name: m.name,
            email: m.email,
          })),
        ],
      },
    },
    include: {
      members: true,
    },
  })

  return group
}

export async function addGroupMember(
  groupId: string,
  data: { name: string; email?: string; userId?: string }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify user owns the group
  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      createdById: session.user.id,
    },
  })

  if (!group) throw new Error("Group not found or you don't have permission")

  const member = await prisma.groupMember.create({
    data: {
      groupId,
      name: data.name,
      email: data.email,
      userId: data.userId,
    },
  })

  return member
}

export async function addExpense(
  groupId: string,
  data: {
    description: string
    amount: number
    currency: string
    paidById: string
    category?: string
    expenseDate?: Date
    splitType: SplitType
    splits: Array<{
      memberId: string
      amount?: number
      percentage?: number
      shares?: number
    }>
    notes?: string
  }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify user has access to the group
  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      OR: [
        { createdById: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  })

  if (!group) throw new Error("Group not found")

  // Calculate FX fee if expense is in different currency than group
  let fxData: {
    amountInGroupCurrency?: number
    midMarketRate?: number
    actualRate?: number
    estimatedFxFee?: number
  } = {}

  if (data.currency !== group.currency) {
    // Fetch exchange rate (simplified - in production, use a real FX API)
    const midMarketRate = await getMidMarketRate(data.currency, group.currency)
    const bankRate = midMarketRate * 1.03 // Assume 3% markup

    fxData = {
      amountInGroupCurrency: data.amount * midMarketRate,
      midMarketRate,
      actualRate: bankRate,
      estimatedFxFee: data.amount * (bankRate - midMarketRate),
    }
  }

  // Calculate split amounts based on split type
  const splitData = calculateSplits(data.amount, data.splitType, data.splits)

  const expense = await prisma.groupExpense.create({
    data: {
      groupId,
      paidById: data.paidById,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      expenseDate: data.expenseDate || new Date(),
      splitType: data.splitType,
      notes: data.notes,
      ...(fxData.amountInGroupCurrency && {
        amountInGroupCurrency: fxData.amountInGroupCurrency,
        midMarketRate: fxData.midMarketRate,
        actualRate: fxData.actualRate,
        estimatedFxFee: fxData.estimatedFxFee,
      }),
      splits: {
        create: splitData.map((split) => ({
          memberId: split.memberId,
          amount: split.amount,
          percentage: split.percentage,
          shares: split.shares,
        })),
      },
    },
    include: {
      splits: {
        include: {
          member: true,
        },
      },
      paidBy: true,
    },
  })

  // Update group's updatedAt
  await prisma.expenseGroup.update({
    where: { id: groupId },
    data: { updatedAt: new Date() },
  })

  return serializeExpense(expense)
}

function calculateSplits(
  totalAmount: number,
  splitType: SplitType,
  splits: Array<{
    memberId: string
    amount?: number
    percentage?: number
    shares?: number
  }>
): Array<{
  memberId: string
  amount: number
  percentage?: number
  shares?: number
}> {
  switch (splitType) {
    case "EQUAL":
      const equalAmount = totalAmount / splits.length
      return splits.map((s) => ({
        memberId: s.memberId,
        amount: Math.round(equalAmount * 100) / 100,
      }))

    case "EXACT":
      return splits.map((s) => ({
        memberId: s.memberId,
        amount: s.amount || 0,
      }))

    case "PERCENTAGE":
      return splits.map((s) => ({
        memberId: s.memberId,
        amount: Math.round(totalAmount * ((s.percentage || 0) / 100) * 100) / 100,
        percentage: s.percentage,
      }))

    case "SHARES":
      const totalShares = splits.reduce((sum, s) => sum + (s.shares || 1), 0)
      return splits.map((s) => ({
        memberId: s.memberId,
        amount: Math.round((totalAmount * ((s.shares || 1) / totalShares)) * 100) / 100,
        shares: s.shares || 1,
      }))

    default:
      return splits.map((s) => ({
        memberId: s.memberId,
        amount: s.amount || totalAmount / splits.length,
      }))
  }
}

export async function recordSettlement(
  groupId: string,
  data: {
    fromMemberId: string
    toMemberId: string
    amount: number
    currency: string
    notes?: string
  }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify user has access to the group
  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      OR: [
        { createdById: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
  })

  if (!group) throw new Error("Group not found")

  // Calculate FX fee if settling in different currency
  let fxData: {
    amountInGroupCurrency?: number
    midMarketRate?: number
    actualRate?: number
    estimatedFxFee?: number
    wiseSavings?: number
  } = {}

  if (data.currency !== group.currency) {
    const midMarketRate = await getMidMarketRate(data.currency, group.currency)
    const bankRate = midMarketRate * 1.03
    const wiseRate = midMarketRate * 1.005

    fxData = {
      amountInGroupCurrency: data.amount * midMarketRate,
      midMarketRate,
      actualRate: bankRate,
      estimatedFxFee: data.amount * (bankRate - midMarketRate),
      wiseSavings: data.amount * (bankRate - wiseRate),
    }
  }

  const settlement = await prisma.groupSettlement.create({
    data: {
      groupId,
      fromMemberId: data.fromMemberId,
      toMemberId: data.toMemberId,
      amount: data.amount,
      currency: data.currency,
      status: "COMPLETED",
      notes: data.notes,
      ...(fxData.amountInGroupCurrency && {
        amountInGroupCurrency: fxData.amountInGroupCurrency,
        midMarketRate: fxData.midMarketRate,
        actualRate: fxData.actualRate,
        estimatedFxFee: fxData.estimatedFxFee,
        wiseSavings: fxData.wiseSavings,
      }),
    },
    include: {
      fromMember: true,
      toMember: true,
    },
  })

  // Update group's updatedAt
  await prisma.expenseGroup.update({
    where: { id: groupId },
    data: { updatedAt: new Date() },
  })

  return serializeSettlement(settlement)
}

// Helper function to get mid-market rate (simplified)
async function getMidMarketRate(from: string, to: string): Promise<number> {
  // In production, fetch from a real FX API
  // For now, use approximate rates
  const rates: Record<string, Record<string, number>> = {
    USD: { GBP: 0.79, EUR: 0.92, JPY: 149.5, AUD: 1.53 },
    GBP: { USD: 1.27, EUR: 1.17, JPY: 189.8, AUD: 1.94 },
    EUR: { GBP: 0.86, USD: 1.09, JPY: 162.5, AUD: 1.66 },
    JPY: { GBP: 0.0053, USD: 0.0067, EUR: 0.0062, AUD: 0.011 },
    AUD: { GBP: 0.52, USD: 0.65, EUR: 0.60, JPY: 97.6 },
  }

  if (from === to) return 1
  return rates[from]?.[to] || 1
}

export async function deleteGroup(groupId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify user owns the group
  const group = await prisma.expenseGroup.findFirst({
    where: {
      id: groupId,
      createdById: session.user.id,
    },
  })

  if (!group) throw new Error("Group not found or you don't have permission")

  await prisma.expenseGroup.delete({
    where: { id: groupId },
  })

  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify user has access to the expense's group
  const expense = await prisma.groupExpense.findFirst({
    where: {
      id: expenseId,
      group: {
        OR: [
          { createdById: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    },
  })

  if (!expense) throw new Error("Expense not found")

  await prisma.groupExpense.delete({
    where: { id: expenseId },
  })

  return { success: true }
}
