import type {
  PropertyType,
  PropertyStatus,
  InvestmentStatus,
  DistributionType,
  DistributionStatus,
} from "@/generated/prisma/client"

// Serialized types for client components (Decimals converted to numbers)
export interface SerializedProperty {
  id: string
  name: string
  propertyType: PropertyType
  location: string
  description: string | null
  imageUrl: string | null
  targetReturn: number | null
  totalRaised: number | null
  totalUnits: number | null
  acquisitionDate: Date | null
  status: PropertyStatus
}

export interface SerializedInvestment {
  id: string
  portfolioId: string
  propertyId: string
  investedAmount: number
  currentValue: number
  shareCount: number | null
  investmentDate: Date
  status: InvestmentStatus
  property: SerializedProperty
  totalDistributions: number
  returnPercentage: number
}

export interface SerializedDistribution {
  id: string
  investmentId: string
  amount: number
  distributionType: DistributionType
  distributionDate: Date
  status: DistributionStatus
  description: string | null
  investment?: {
    property: Pick<SerializedProperty, "id" | "name">
  }
}

export interface SerializedPortfolio {
  id: string
  name: string
  description: string | null
  totalValue: number
  totalInvested: number
  totalDistributions: number
  totalReturn: number
  returnPercentage: number
  investmentCount: number
}

export interface PortfolioOverviewStats {
  totalValue: number
  totalInvested: number
  totalDistributions: number
  unrealizedGain: number
  unrealizedGainPercent: number
  ytdDistributions: number
  portfolioCount: number
  investmentCount: number
}

export interface PerformanceDataPoint {
  date: string // ISO date string (YYYY-MM)
  value: number
  invested: number
}

export interface AllocationDataPoint {
  name: string
  value: number
  percentage: number
  color: string
}

// Zustand store types
export interface PortfolioFilters {
  portfolioId: string | null
  dateRange: {
    start: Date | null
    end: Date | null
  }
  propertyType: PropertyType | null
}

export interface PortfolioUIState {
  isLoading: boolean
  selectedInvestmentId: string | null
  chartView: "performance" | "allocation"
  tableSort: {
    column: string
    direction: "asc" | "desc"
  }
}
