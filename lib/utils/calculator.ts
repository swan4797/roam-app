import type {
  CalculatorInputValues,
  ProjectionResult,
  YearlyBreakdown,
  ProjectionDataPoint,
  ProjectionSummary,
  DistributionFrequency,
} from "@/types/calculator"

/**
 * Get number of distribution periods per year
 */
function getPeriodsPerYear(frequency: DistributionFrequency): number {
  switch (frequency) {
    case "monthly":
      return 12
    case "quarterly":
      return 4
    case "annually":
      return 1
  }
}

/**
 * Calculate projected investment returns with comparison (with vs without reinvestment)
 *
 * The calculation models:
 * 1. Appreciation: The underlying asset value grows at the annual return rate
 * 2. Distributions: Cash payments made at the specified frequency
 * 3. Reinvestment: If DRIP is enabled, distributions are reinvested
 */
export function calculateProjection(
  inputs: CalculatorInputValues
): ProjectionResult {
  const {
    investmentAmount,
    annualReturnRate,
    investmentDuration,
    distributionFrequency,
    reinvestDistributions,
  } = inputs

  const periodsPerYear = getPeriodsPerYear(distributionFrequency)
  const annualRateDecimal = annualReturnRate / 100

  // Split total return into appreciation and distribution components
  // For real estate, typically 60% appreciation, 40% distributions
  const distributionRatio = 0.4
  const appreciationRatio = 0.6

  const appreciationRatePerPeriod =
    (annualRateDecimal * appreciationRatio) / periodsPerYear
  const distributionRatePerPeriod =
    (annualRateDecimal * distributionRatio) / periodsPerYear

  const yearlyBreakdown: YearlyBreakdown[] = []
  const chartData: ProjectionDataPoint[] = []

  // Track both scenarios for comparison
  let valueWithReinvestment = investmentAmount
  let valueWithoutReinvestment = investmentAmount
  let cumulativeDistributionsReinvest = 0
  let cumulativeDistributionsNoReinvest = 0

  // Add initial data point
  chartData.push({
    year: 0,
    date: "Start",
    value: investmentAmount,
    invested: investmentAmount,
    withReinvestment: investmentAmount,
    withoutReinvestment: investmentAmount,
  })

  for (let year = 1; year <= investmentDuration; year++) {
    const yearStartWithReinvest = valueWithReinvestment
    const yearStartNoReinvest = valueWithoutReinvestment

    let yearAppreciationReinvest = 0
    let yearAppreciationNoReinvest = 0
    let yearDistributionsReinvest = 0
    let yearDistributionsNoReinvest = 0
    let yearReinvestedAmount = 0

    for (let period = 1; period <= periodsPerYear; period++) {
      // Calculate appreciation for this period (both scenarios)
      const periodAppreciationReinvest =
        valueWithReinvestment * appreciationRatePerPeriod
      const periodAppreciationNoReinvest =
        valueWithoutReinvestment * appreciationRatePerPeriod

      // Calculate distribution for this period (both scenarios)
      const periodDistributionReinvest =
        valueWithReinvestment * distributionRatePerPeriod
      const periodDistributionNoReinvest =
        valueWithoutReinvestment * distributionRatePerPeriod

      // Apply appreciation
      valueWithReinvestment += periodAppreciationReinvest
      valueWithoutReinvestment += periodAppreciationNoReinvest

      yearAppreciationReinvest += periodAppreciationReinvest
      yearAppreciationNoReinvest += periodAppreciationNoReinvest

      // With reinvestment: add distribution back to principal
      valueWithReinvestment += periodDistributionReinvest
      yearReinvestedAmount += periodDistributionReinvest
      cumulativeDistributionsReinvest += periodDistributionReinvest

      // Without reinvestment: track distributions separately
      yearDistributionsNoReinvest += periodDistributionNoReinvest
      cumulativeDistributionsNoReinvest += periodDistributionNoReinvest
    }

    // Add yearly data point to chart
    chartData.push({
      year,
      date: `Year ${year}`,
      value: reinvestDistributions
        ? valueWithReinvestment
        : valueWithoutReinvestment,
      invested: investmentAmount,
      withReinvestment: valueWithReinvestment,
      withoutReinvestment: valueWithoutReinvestment,
    })

    // Calculate total return percentage for the selected mode
    const currentValue = reinvestDistributions
      ? valueWithReinvestment
      : valueWithoutReinvestment
    const currentDistributions = reinvestDistributions
      ? 0 // With reinvestment, no cash distributions paid out
      : cumulativeDistributionsNoReinvest
    const totalReturnToDate =
      ((currentValue - investmentAmount + currentDistributions) /
        investmentAmount) *
      100

    yearlyBreakdown.push({
      year,
      startingValue: reinvestDistributions
        ? yearStartWithReinvest
        : yearStartNoReinvest,
      appreciation: reinvestDistributions
        ? yearAppreciationReinvest
        : yearAppreciationNoReinvest,
      distributions: reinvestDistributions ? 0 : yearDistributionsNoReinvest,
      reinvestedDistributions: reinvestDistributions ? yearReinvestedAmount : 0,
      endingValue: reinvestDistributions
        ? valueWithReinvestment
        : valueWithoutReinvestment,
      cumulativeDistributions: reinvestDistributions
        ? cumulativeDistributionsReinvest
        : cumulativeDistributionsNoReinvest,
      totalReturn: totalReturnToDate,
    })
  }

  // Calculate summaries for both scenarios
  const summaryWithReinvestment = calculateSummary(
    investmentAmount,
    valueWithReinvestment,
    0, // No cash distributions with DRIP
    cumulativeDistributionsReinvest,
    investmentDuration
  )

  const summaryWithoutReinvestment = calculateSummary(
    investmentAmount,
    valueWithoutReinvestment,
    cumulativeDistributionsNoReinvest,
    0,
    investmentDuration
  )

  // Use the appropriate summary based on user selection
  const summary = reinvestDistributions
    ? summaryWithReinvestment
    : summaryWithoutReinvestment

  return {
    summary,
    chartData,
    yearlyBreakdown,
    comparisonSummary: {
      withReinvestment: summaryWithReinvestment,
      withoutReinvestment: summaryWithoutReinvestment,
      differenceValue: valueWithReinvestment - valueWithoutReinvestment,
      differencePercent:
        ((valueWithReinvestment - valueWithoutReinvestment) /
          valueWithoutReinvestment) *
        100,
    },
  }
}

function calculateSummary(
  investmentAmount: number,
  finalValue: number,
  cashDistributions: number,
  reinvestedDistributions: number,
  years: number
): ProjectionSummary {
  const totalAppreciation = finalValue - investmentAmount - reinvestedDistributions
  const totalDistributions = cashDistributions + reinvestedDistributions
  const totalReturn = finalValue - investmentAmount + cashDistributions
  const totalReturnPercent = (totalReturn / investmentAmount) * 100

  // Calculate CAGR
  const finalValueForCAGR = finalValue + cashDistributions
  const cagr =
    (Math.pow(finalValueForCAGR / investmentAmount, 1 / years) - 1) * 100

  return {
    finalValue,
    totalContributions: investmentAmount,
    totalAppreciation,
    totalDistributions,
    totalReturn,
    totalReturnPercent,
    averageAnnualReturn: cagr,
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, compact = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(amount)
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`
}
