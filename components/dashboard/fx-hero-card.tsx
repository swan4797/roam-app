"use client"

import Link from "next/link"

interface Props {
  totalFxFees: number
  wiseSavings: number
  transactionCount: number
  topCurrency?: string
  weeklyFees?: number
  monthlyChange?: number // percentage change from last month
}

export function FxHeroCard({
  totalFxFees,
  wiseSavings,
  transactionCount,
  topCurrency = "EUR",
  weeklyFees = 0,
  monthlyChange,
}: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount)
  }

  const savingsPercentage = totalFxFees > 0
    ? Math.round((wiseSavings / totalFxFees) * 100)
    : 0

  // Calculate percentage for circular chart (max 100)
  const chartPercentage = Math.min((totalFxFees / 100) * 100, 100)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDashoffset = circumference - (chartPercentage / 100) * circumference

  return (
    <div className="fx-hero">
      {/* Top badge */}
      <div className="fx-hero__badge">
        <span>FX Fees</span>
      </div>

      <div className="fx-hero__main">
        {/* Circular Chart - Lumin style */}
        <div className="fx-hero__chart-container">
          <svg viewBox="0 0 120 120" className="fx-hero__circular-chart">
            {/* Background circle with segments */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="12"
            />
            {/* Progress arc - lime color */}
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#CDFE00"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
            {/* Decorative dots */}
            <circle cx="60" cy="12" r="3" fill="rgba(255,255,255,0.3)" />
          </svg>
          <div className="fx-hero__chart-value">
            <span className="fx-hero__chart-amount">{formatCurrency(totalFxFees)}</span>
          </div>
        </div>

        {/* Description */}
        <p className="fx-hero__description">
          Hidden fees from {transactionCount} foreign currency transactions this month
        </p>
      </div>

      {/* Bottom row with stats */}
      <div className="fx-hero__footer">
        <div className="fx-hero__stat-row">
          <div className="fx-hero__stat-item">
            <span className="fx-hero__stat-label">This Week</span>
            <span className="fx-hero__stat-value">{formatCurrency(weeklyFees)}</span>
          </div>
          <div className="fx-hero__stat-item">
            <span className="fx-hero__stat-label">Top Currency</span>
            <span className="fx-hero__stat-value">{topCurrency}</span>
          </div>
        </div>

        <Link href="/dashboard/fx-analysis" className="fx-hero__link">
          <span>View Analysis</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
