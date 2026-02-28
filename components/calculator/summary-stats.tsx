"use client"

import { memo } from "react"
import type { ProjectionSummary, ComparisonSummary } from "@/types/calculator"
import { formatCurrency, formatPercent } from "@/lib/utils/calculator"

interface Props {
  summary: ProjectionSummary
  comparison: ComparisonSummary
  showComparison: boolean
}

export const SummaryStats = memo(function SummaryStats({ summary, comparison, showComparison }: Props) {
  return (
    <div className="calculator-summary-section">
      <div className="calculator-summary">
        <div className="stat-card">
          <span className="stat-card__label">Final Value</span>
          <span className="stat-card__value">
            {formatCurrency(summary.finalValue, true)}
          </span>
          <span className="stat-card__trend stat-card__trend--positive">
            {formatPercent(summary.totalReturnPercent)}
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">Total Return</span>
          <span className="stat-card__value">
            {formatCurrency(summary.totalReturn, true)}
          </span>
          <span className="stat-card__subtitle">
            on {formatCurrency(summary.totalContributions, true)} invested
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">Total Distributions</span>
          <span className="stat-card__value">
            {formatCurrency(summary.totalDistributions, true)}
          </span>
          <span className="stat-card__subtitle">
            cumulative
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-card__label">Avg Annual Return</span>
          <span className="stat-card__value">
            {summary.averageAnnualReturn.toFixed(1)}%
          </span>
          <span className="stat-card__subtitle">CAGR</span>
        </div>
      </div>

      {showComparison && comparison.differenceValue > 0 && (
        <div className="comparison-banner">
          <div className="comparison-banner__content">
            <div>
              <span className="comparison-banner__label">
                Reinvestment Advantage
              </span>
              <span className="comparison-banner__value">
                +{formatCurrency(comparison.differenceValue)}
              </span>
            </div>
            <p className="comparison-banner__description">
              By reinvesting distributions, you could earn{" "}
              <strong>{formatPercent(comparison.differencePercent)}</strong> more
              over the investment period
            </p>
          </div>
        </div>
      )}
    </div>
  )
})
