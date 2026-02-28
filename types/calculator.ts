// =============================================================================
// Investment Calculator Types
// =============================================================================

export type DistributionFrequency = "monthly" | "quarterly" | "annually"

export interface CalculatorInputValues {
  investmentAmount: number
  annualReturnRate: number
  investmentDuration: number
  distributionFrequency: DistributionFrequency
  reinvestDistributions: boolean
}

export interface ProjectionDataPoint {
  year: number
  date: string
  value: number
  invested: number
  withReinvestment: number
  withoutReinvestment: number
}

export interface YearlyBreakdown {
  year: number
  startingValue: number
  appreciation: number
  distributions: number
  reinvestedDistributions: number
  endingValue: number
  cumulativeDistributions: number
  totalReturn: number
}

export interface ProjectionSummary {
  finalValue: number
  totalContributions: number
  totalAppreciation: number
  totalDistributions: number
  totalReturn: number
  totalReturnPercent: number
  averageAnnualReturn: number
}

export interface ComparisonSummary {
  withReinvestment: ProjectionSummary
  withoutReinvestment: ProjectionSummary
  differenceValue: number
  differencePercent: number
}

export interface ProjectionResult {
  summary: ProjectionSummary
  chartData: ProjectionDataPoint[]
  yearlyBreakdown: YearlyBreakdown[]
  comparisonSummary: ComparisonSummary
}

export const DEFAULT_INPUTS: CalculatorInputValues = {
  investmentAmount: 50000,
  annualReturnRate: 8,
  investmentDuration: 10,
  distributionFrequency: "quarterly",
  reinvestDistributions: false,
}

export const DISTRIBUTION_OPTIONS: {
  value: DistributionFrequency
  label: string
}[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
]
