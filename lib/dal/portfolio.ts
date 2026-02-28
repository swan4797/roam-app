import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { PropertyType } from "@/generated/prisma/client"
import type {
  SerializedPortfolio,
  SerializedInvestment,
  SerializedDistribution,
  PortfolioOverviewStats,
  PerformanceDataPoint,
  AllocationDataPoint,
} from "@/types/portfolio"

// Helper to convert Decimal to number
function decimalToNumber(
  value: { toNumber: () => number } | null | undefined
): number {
  return value ? value.toNumber() : 0
}

// ============================================================================
// Portfolio Overview
// ============================================================================

export async function getPortfolioOverview(): Promise<PortfolioOverviewStats> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ytdStart = new Date(new Date().getFullYear(), 0, 1)

  const [portfolios, totals, ytdDistributions, totalDistributions] =
    await Promise.all([
      prisma.portfolio.count({
        where: { userId: session.user.id },
      }),
      prisma.investment.aggregate({
        where: {
          portfolio: { userId: session.user.id },
          status: "ACTIVE",
        },
        _sum: {
          investedAmount: true,
          currentValue: true,
        },
        _count: true,
      }),
      prisma.distribution.aggregate({
        where: {
          investment: {
            portfolio: { userId: session.user.id },
          },
          distributionDate: { gte: ytdStart },
          status: "PAID",
        },
        _sum: { amount: true },
      }),
      prisma.distribution.aggregate({
        where: {
          investment: {
            portfolio: { userId: session.user.id },
          },
          status: "PAID",
        },
        _sum: { amount: true },
      }),
    ])

  const totalInvested = decimalToNumber(totals._sum.investedAmount)
  const totalValue = decimalToNumber(totals._sum.currentValue)

  return {
    totalValue,
    totalInvested,
    totalDistributions: decimalToNumber(totalDistributions._sum.amount),
    unrealizedGain: totalValue - totalInvested,
    unrealizedGainPercent:
      totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
    ytdDistributions: decimalToNumber(ytdDistributions._sum.amount),
    portfolioCount: portfolios,
    investmentCount: totals._count,
  }
}

// ============================================================================
// Portfolios List
// ============================================================================

export async function getPortfolios(): Promise<SerializedPortfolio[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: session.user.id },
    include: {
      investments: {
        where: { status: "ACTIVE" },
        include: {
          distributions: {
            where: { status: "PAID" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return portfolios.map((portfolio) => {
    const totalInvested = portfolio.investments.reduce(
      (sum, inv) => sum + decimalToNumber(inv.investedAmount),
      0
    )
    const totalValue = portfolio.investments.reduce(
      (sum, inv) => sum + decimalToNumber(inv.currentValue),
      0
    )
    const totalDistributions = portfolio.investments.reduce(
      (sum, inv) =>
        sum +
        inv.distributions.reduce((s, d) => s + decimalToNumber(d.amount), 0),
      0
    )
    const totalReturn = totalValue - totalInvested + totalDistributions

    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      totalValue,
      totalInvested,
      totalDistributions,
      totalReturn,
      returnPercentage:
        totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0,
      investmentCount: portfolio.investments.length,
    }
  })
}

export async function getPortfolio(id: string): Promise<SerializedPortfolio> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
    include: {
      investments: {
        where: { status: "ACTIVE" },
        include: {
          distributions: {
            where: { status: "PAID" },
          },
        },
      },
    },
  })

  if (!portfolio) throw new Error("Portfolio not found")

  const totalInvested = portfolio.investments.reduce(
    (sum, inv) => sum + decimalToNumber(inv.investedAmount),
    0
  )
  const totalValue = portfolio.investments.reduce(
    (sum, inv) => sum + decimalToNumber(inv.currentValue),
    0
  )
  const totalDistributions = portfolio.investments.reduce(
    (sum, inv) =>
      sum + inv.distributions.reduce((s, d) => s + decimalToNumber(d.amount), 0),
    0
  )
  const totalReturn = totalValue - totalInvested + totalDistributions

  return {
    id: portfolio.id,
    name: portfolio.name,
    description: portfolio.description,
    totalValue,
    totalInvested,
    totalDistributions,
    totalReturn,
    returnPercentage:
      totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0,
    investmentCount: portfolio.investments.length,
  }
}

// ============================================================================
// Investments
// ============================================================================

export async function getInvestments(options?: {
  portfolioId?: string
  propertyType?: PropertyType
  limit?: number
  offset?: number
}): Promise<SerializedInvestment[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { portfolioId, propertyType, limit = 50, offset = 0 } = options ?? {}

  const investments = await prisma.investment.findMany({
    where: {
      portfolio: { userId: session.user.id },
      ...(portfolioId && { portfolioId }),
      ...(propertyType && { property: { propertyType } }),
      status: "ACTIVE",
    },
    include: {
      property: true,
      distributions: {
        where: { status: "PAID" },
      },
    },
    orderBy: { currentValue: "desc" },
    take: limit,
    skip: offset,
  })

  return investments.map((inv) => {
    const investedAmount = decimalToNumber(inv.investedAmount)
    const currentValue = decimalToNumber(inv.currentValue)
    const totalDistributions = inv.distributions.reduce(
      (sum, d) => sum + decimalToNumber(d.amount),
      0
    )

    return {
      id: inv.id,
      portfolioId: inv.portfolioId,
      propertyId: inv.propertyId,
      investedAmount,
      currentValue,
      shareCount: decimalToNumber(inv.shareCount),
      investmentDate: inv.investmentDate,
      status: inv.status,
      property: {
        id: inv.property.id,
        name: inv.property.name,
        propertyType: inv.property.propertyType,
        location: inv.property.location,
        description: inv.property.description,
        imageUrl: inv.property.imageUrl,
        targetReturn: decimalToNumber(inv.property.targetReturn),
        totalRaised: decimalToNumber(inv.property.totalRaised),
        totalUnits: inv.property.totalUnits,
        acquisitionDate: inv.property.acquisitionDate,
        status: inv.property.status,
      },
      totalDistributions,
      returnPercentage:
        investedAmount > 0
          ? ((currentValue - investedAmount + totalDistributions) /
              investedAmount) *
            100
          : 0,
    }
  })
}

export async function getInvestment(id: string): Promise<SerializedInvestment> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const investment = await prisma.investment.findFirst({
    where: {
      id,
      portfolio: { userId: session.user.id },
    },
    include: {
      property: true,
      distributions: {
        where: { status: "PAID" },
        orderBy: { distributionDate: "desc" },
      },
    },
  })

  if (!investment) throw new Error("Investment not found")

  const investedAmount = decimalToNumber(investment.investedAmount)
  const currentValue = decimalToNumber(investment.currentValue)
  const totalDistributions = investment.distributions.reduce(
    (sum, d) => sum + decimalToNumber(d.amount),
    0
  )

  return {
    id: investment.id,
    portfolioId: investment.portfolioId,
    propertyId: investment.propertyId,
    investedAmount,
    currentValue,
    shareCount: decimalToNumber(investment.shareCount),
    investmentDate: investment.investmentDate,
    status: investment.status,
    property: {
      id: investment.property.id,
      name: investment.property.name,
      propertyType: investment.property.propertyType,
      location: investment.property.location,
      description: investment.property.description,
      imageUrl: investment.property.imageUrl,
      targetReturn: decimalToNumber(investment.property.targetReturn),
      totalRaised: decimalToNumber(investment.property.totalRaised),
      totalUnits: investment.property.totalUnits,
      acquisitionDate: investment.property.acquisitionDate,
      status: investment.property.status,
    },
    totalDistributions,
    returnPercentage:
      investedAmount > 0
        ? ((currentValue - investedAmount + totalDistributions) /
            investedAmount) *
          100
        : 0,
  }
}

// ============================================================================
// Distributions
// ============================================================================

export async function getDistributions(options?: {
  portfolioId?: string
  investmentId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}): Promise<SerializedDistribution[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const {
    portfolioId,
    investmentId,
    startDate,
    endDate,
    limit = 20,
  } = options ?? {}

  const distributions = await prisma.distribution.findMany({
    where: {
      investment: {
        portfolio: { userId: session.user.id },
        ...(portfolioId && { portfolioId }),
      },
      ...(investmentId && { investmentId }),
      ...(startDate && { distributionDate: { gte: startDate } }),
      ...(endDate && { distributionDate: { lte: endDate } }),
    },
    include: {
      investment: {
        select: {
          property: {
            select: { id: true, name: true },
          },
        },
      },
    },
    orderBy: { distributionDate: "desc" },
    take: limit,
  })

  return distributions.map((d) => ({
    id: d.id,
    investmentId: d.investmentId,
    amount: decimalToNumber(d.amount),
    distributionType: d.distributionType,
    distributionDate: d.distributionDate,
    status: d.status,
    description: d.description,
    investment: {
      property: d.investment.property,
    },
  }))
}

// ============================================================================
// Performance Data (for charts)
// ============================================================================

export async function getPerformanceData(options?: {
  portfolioId?: string
  months?: number
}): Promise<PerformanceDataPoint[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { portfolioId, months = 12 } = options ?? {}
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  // Get all valuations grouped by month
  const valuations = await prisma.valuation.findMany({
    where: {
      investment: {
        portfolio: { userId: session.user.id },
        ...(portfolioId && { portfolioId }),
      },
      valuationDate: { gte: startDate },
    },
    include: {
      investment: {
        select: { investedAmount: true },
      },
    },
    orderBy: { valuationDate: "asc" },
  })

  // Group by month and sum values
  const monthlyData = new Map<string, { value: number; invested: number }>()

  valuations.forEach((v) => {
    const monthKey = v.valuationDate.toISOString().slice(0, 7) // YYYY-MM
    const existing = monthlyData.get(monthKey) || { value: 0, invested: 0 }
    monthlyData.set(monthKey, {
      value: existing.value + decimalToNumber(v.value),
      invested:
        existing.invested + decimalToNumber(v.investment.investedAmount),
    })
  })

  return Array.from(monthlyData.entries()).map(([date, data]) => ({
    date,
    value: data.value,
    invested: data.invested,
  }))
}

// ============================================================================
// Allocation Data (for pie chart)
// ============================================================================

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  MULTIFAMILY: "#F97316", // Primary orange
  COMMERCIAL: "#3B82F6", // Blue
  MIXED_USE: "#10B981", // Green
  INDUSTRIAL: "#8B5CF6", // Purple
  FUND: "#EC4899", // Pink
}

export async function getAllocationData(options?: {
  portfolioId?: string
  groupBy?: "propertyType" | "property"
}): Promise<AllocationDataPoint[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { portfolioId, groupBy = "propertyType" } = options ?? {}

  const investments = await prisma.investment.findMany({
    where: {
      portfolio: { userId: session.user.id },
      ...(portfolioId && { portfolioId }),
      status: "ACTIVE",
    },
    include: {
      property: true,
    },
  })

  const totalValue = investments.reduce(
    (sum, inv) => sum + decimalToNumber(inv.currentValue),
    0
  )

  if (groupBy === "propertyType") {
    const grouped = new Map<string, number>()
    investments.forEach((inv) => {
      const type = inv.property.propertyType
      grouped.set(type, (grouped.get(type) || 0) + decimalToNumber(inv.currentValue))
    })

    return Array.from(grouped.entries()).map(([type, value]) => ({
      name: type.replace("_", " "),
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: PROPERTY_TYPE_COLORS[type] || "#9CA3AF",
    }))
  }

  // Group by individual property
  const grouped = new Map<string, { name: string; value: number }>()
  investments.forEach((inv) => {
    const key = inv.property.id
    const existing = grouped.get(key) || { name: inv.property.name, value: 0 }
    grouped.set(key, {
      name: existing.name,
      value: existing.value + decimalToNumber(inv.currentValue),
    })
  })

  const colors = [
    "#F97316",
    "#3B82F6",
    "#10B981",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
  ]
  return Array.from(grouped.entries()).map(([_, data], index) => ({
    name: data.name,
    value: data.value,
    percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
    color: colors[index % colors.length],
  }))
}

// ============================================================================
// Properties List (available properties to invest in)
// ============================================================================

export async function getProperties() {
  const properties = await prisma.property.findMany({
    where: { status: { in: ["ACTIVE", "DISTRIBUTING", "RAISING"] } },
    orderBy: { createdAt: "desc" },
  })

  return properties.map((p) => ({
    id: p.id,
    name: p.name,
    propertyType: p.propertyType,
    location: p.location,
    description: p.description,
    imageUrl: p.imageUrl,
    targetReturn: decimalToNumber(p.targetReturn),
    totalRaised: decimalToNumber(p.totalRaised),
    totalUnits: p.totalUnits,
    acquisitionDate: p.acquisitionDate,
    status: p.status,
  }))
}

// ============================================================================
// Create Operations
// ============================================================================

export async function createPortfolio(data: {
  name: string
  description?: string
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  return prisma.portfolio.create({
    data: {
      userId: session.user.id,
      name: data.name,
      description: data.description,
    },
  })
}

export async function createInvestment(data: {
  portfolioId: string
  propertyId: string
  investedAmount: number
  shareCount?: number
  investmentDate: Date
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify portfolio ownership
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: data.portfolioId, userId: session.user.id },
  })
  if (!portfolio) throw new Error("Portfolio not found")

  return prisma.investment.create({
    data: {
      portfolioId: data.portfolioId,
      propertyId: data.propertyId,
      investedAmount: data.investedAmount,
      currentValue: data.investedAmount, // Initial value = invested amount
      shareCount: data.shareCount,
      investmentDate: data.investmentDate,
    },
  })
}

// ============================================================================
// Delete Operations
// ============================================================================

export async function deletePortfolio(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!portfolio) throw new Error("Portfolio not found")

  return prisma.portfolio.delete({ where: { id } })
}
