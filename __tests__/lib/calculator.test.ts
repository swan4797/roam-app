import { describe, it, expect } from "vitest"
import {
  calculateProjection,
  formatCurrency,
  formatPercent,
} from "@/lib/utils/calculator"
import type { CalculatorInputValues } from "@/types/calculator"

describe("Calculator Utility Functions", () => {
  describe("formatCurrency", () => {
    it("formats currency in standard notation", () => {
      expect(formatCurrency(1000)).toBe("$1,000")
      expect(formatCurrency(50000)).toBe("$50,000")
      expect(formatCurrency(1234567)).toBe("$1,234,567")
    })

    it("formats currency in compact notation", () => {
      // Intl.NumberFormat with compact notation may include decimals
      expect(formatCurrency(1000, true)).toMatch(/\$1(\.0)?K/)
      expect(formatCurrency(50000, true)).toMatch(/\$50(\.0)?K/)
      expect(formatCurrency(1234567, true)).toMatch(/\$1\.2M/)
    })

    it("handles zero and small amounts", () => {
      expect(formatCurrency(0)).toBe("$0")
      expect(formatCurrency(99)).toBe("$99")
    })
  })

  describe("formatPercent", () => {
    it("formats positive percentages with plus sign", () => {
      expect(formatPercent(8)).toBe("+8.0%")
      expect(formatPercent(12.5)).toBe("+12.5%")
    })

    it("formats negative percentages", () => {
      expect(formatPercent(-5)).toBe("-5.0%")
      expect(formatPercent(-10.25)).toBe("-10.3%")
    })

    it("handles zero", () => {
      expect(formatPercent(0)).toBe("+0.0%")
    })

    it("respects custom decimal places", () => {
      expect(formatPercent(8.123, 2)).toBe("+8.12%")
      expect(formatPercent(8.125, 0)).toBe("+8%")
    })
  })

  describe("calculateProjection", () => {
    const baseInputs: CalculatorInputValues = {
      investmentAmount: 50000,
      annualReturnRate: 8,
      investmentDuration: 10,
      distributionFrequency: "quarterly",
      reinvestDistributions: true,
    }

    it("returns correct structure", () => {
      const result = calculateProjection(baseInputs)

      expect(result).toHaveProperty("summary")
      expect(result).toHaveProperty("chartData")
      expect(result).toHaveProperty("yearlyBreakdown")
      expect(result).toHaveProperty("comparisonSummary")
    })

    it("returns correct number of chart data points", () => {
      const result = calculateProjection(baseInputs)

      // Should have initial point (Start) + one for each year
      expect(result.chartData).toHaveLength(baseInputs.investmentDuration + 1)
    })

    it("returns correct number of yearly breakdowns", () => {
      const result = calculateProjection(baseInputs)

      expect(result.yearlyBreakdown).toHaveLength(baseInputs.investmentDuration)
    })

    it("initial investment is preserved in chart data", () => {
      const result = calculateProjection(baseInputs)

      expect(result.chartData[0].invested).toBe(baseInputs.investmentAmount)
      expect(result.chartData[0].value).toBe(baseInputs.investmentAmount)
    })

    it("final value is greater than initial investment with positive returns", () => {
      const result = calculateProjection(baseInputs)

      expect(result.summary.finalValue).toBeGreaterThan(
        baseInputs.investmentAmount
      )
    })

    it("reinvestment produces higher returns than no reinvestment", () => {
      const result = calculateProjection(baseInputs)

      expect(result.comparisonSummary.withReinvestment.finalValue).toBeGreaterThan(
        result.comparisonSummary.withoutReinvestment.finalValue
      )
    })

    it("handles different distribution frequencies", () => {
      const monthlyInputs = { ...baseInputs, distributionFrequency: "monthly" as const }
      const annualInputs = { ...baseInputs, distributionFrequency: "annually" as const }

      const monthlyResult = calculateProjection(monthlyInputs)
      const annualResult = calculateProjection(annualInputs)

      // Monthly compounding should result in slightly higher values
      expect(monthlyResult.summary.finalValue).toBeGreaterThan(
        annualResult.summary.finalValue
      )
    })

    it("calculates positive total return percentage", () => {
      const result = calculateProjection(baseInputs)

      expect(result.summary.totalReturnPercent).toBeGreaterThan(0)
    })

    it("yearly breakdowns have increasing values over time", () => {
      const result = calculateProjection(baseInputs)

      for (let i = 1; i < result.yearlyBreakdown.length; i++) {
        expect(result.yearlyBreakdown[i].endingValue).toBeGreaterThan(
          result.yearlyBreakdown[i - 1].startingValue
        )
      }
    })

    it("handles minimum investment duration", () => {
      const shortTermInputs = { ...baseInputs, investmentDuration: 1 }
      const result = calculateProjection(shortTermInputs)

      expect(result.yearlyBreakdown).toHaveLength(1)
      expect(result.summary.finalValue).toBeGreaterThan(
        shortTermInputs.investmentAmount
      )
    })

    it("handles maximum investment duration", () => {
      const longTermInputs = { ...baseInputs, investmentDuration: 30 }
      const result = calculateProjection(longTermInputs)

      expect(result.yearlyBreakdown).toHaveLength(30)
      // With 8% annual return over 30 years, value should be significantly higher
      expect(result.summary.finalValue).toBeGreaterThan(
        longTermInputs.investmentAmount * 5
      )
    })
  })
})
