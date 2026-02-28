import "server-only"
import { unstable_cache } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type {
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
// Cached Portfolio Overview
// Cache for 60 seconds, invalidated on investment/distribution changes
// ============================================================================

async function getPortfolioOverviewUncached(
  userId: string
): Promise<PortfolioOverviewStats> {
  const ytdStart = new Date(new Date().getFullYear(), 0, 1)

  const [portfolios, totals, ytdDistributions, totalDistributions] =
    await Promise.all([
      prisma.portfolio.count({
        where: { userId },
      }),
      prisma.investment.aggregate({
        where: {
          portfolio: { userId },
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
            portfolio: { userId },
          },
          distributionDate: { gte: ytdStart },
          status: "PAID",
        },
        _sum: { amount: true },
      }),
      prisma.distribution.aggregate({
        where: {
          investment: {
            portfolio: { userId },
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

// Cached version with 60 second TTL
const getCachedPortfolioOverview = unstable_cache(
  getPortfolioOverviewUncached,
  ["portfolio-overview"],
  {
    revalidate: 60, // 60 second TTL
    tags: ["portfolio", "investments", "distributions"],
  }
)

export async function getPortfolioOverviewCached(): Promise<PortfolioOverviewStats> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  return getCachedPortfolioOverview(session.user.id)
}

// ============================================================================
// Cached Performance Data
// Cache for 5 minutes - historical data changes infrequently
// ============================================================================

async function getPerformanceDataUncached(
  userId: string,
  months: number
): Promise<PerformanceDataPoint[]> {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const valuations = await prisma.valuation.findMany({
    where: {
      investment: {
        portfolio: { userId },
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
    const monthKey = v.valuationDate.toISOString().slice(0, 7)
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

const getCachedPerformanceData = unstable_cache(
  getPerformanceDataUncached,
  ["portfolio-performance"],
  {
    revalidate: 300, // 5 minute TTL
    tags: ["portfolio", "valuations"],
  }
)

export async function getPerformanceDataCached(options?: {
  months?: number
}): Promise<PerformanceDataPoint[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { months = 12 } = options ?? {}
  return getCachedPerformanceData(session.user.id, months)
}

// ============================================================================
// Cached Allocation Data
// Cache for 2 minutes
// ============================================================================

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  MULTIFAMILY: "#F97316",
  COMMERCIAL: "#3B82F6",
  MIXED_USE: "#10B981",
  INDUSTRIAL: "#8B5CF6",
  FUND: "#EC4899",
}

async function getAllocationDataUncached(
  userId: string,
  groupBy: "propertyType" | "property"
): Promise<AllocationDataPoint[]> {
  const investments = await prisma.investment.findMany({
    where: {
      portfolio: { userId },
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

const getCachedAllocationData = unstable_cache(
  getAllocationDataUncached,
  ["portfolio-allocation"],
  {
    revalidate: 120, // 2 minute TTL
    tags: ["portfolio", "investments"],
  }
)

export async function getAllocationDataCached(options?: {
  groupBy?: "propertyType" | "property"
}): Promise<AllocationDataPoint[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { groupBy = "propertyType" } = options ?? {}
  return getCachedAllocationData(session.user.id, groupBy)
}

// ============================================================================
// Cache Invalidation Helpers
// Use revalidatePath in Server Actions to invalidate cached data
// The unstable_cache above uses TTL-based invalidation (60s, 120s, 300s)
// For immediate invalidation, call revalidatePath("/dashboard/portfolio")
// ============================================================================

// Note: To invalidate cache immediately from a Server Action:
// import { revalidatePath } from "next/cache"
// revalidatePath("/dashboard/portfolio")
