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

  return (
    <div className="fx-hero">
      <div className="fx-hero__main">
        <div className="fx-hero__content">
          <span className="fx-hero__label">Hidden FX Fees This Month</span>
          <div className="fx-hero__value">{formatCurrency(totalFxFees)}</div>
          <p className="fx-hero__subtitle">
            From {transactionCount} foreign currency transaction{transactionCount !== 1 ? "s" : ""}
          </p>

          {monthlyChange !== undefined && (
            <div className={`fx-hero__change ${monthlyChange > 0 ? "fx-hero__change--negative" : "fx-hero__change--positive"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {monthlyChange > 0 ? (
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                ) : (
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                )}
              </svg>
              <span>
                {monthlyChange > 0 ? "+" : ""}{monthlyChange}% vs last month
              </span>
            </div>
          )}
        </div>

        <div className="fx-hero__visual">
          <svg viewBox="0 0 120 120" className="fx-hero__chart">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--color-error)"
              strokeWidth="10"
              strokeDasharray={`${(transactionCount / 50) * 314} 314`}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="55" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
              {transactionCount}
            </text>
            <text x="60" y="75" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">
              FX transactions
            </text>
          </svg>
        </div>
      </div>

      <div className="fx-hero__stats">
        <div className="fx-hero__stat">
          <span className="fx-hero__stat-label">This Week</span>
          <span className="fx-hero__stat-value">{formatCurrency(weeklyFees)}</span>
        </div>
        <div className="fx-hero__stat">
          <span className="fx-hero__stat-label">Top Currency</span>
          <span className="fx-hero__stat-value">{topCurrency}</span>
        </div>
        <div className="fx-hero__stat fx-hero__stat--highlight">
          <span className="fx-hero__stat-label">Potential Savings</span>
          <span className="fx-hero__stat-value">{formatCurrency(wiseSavings)}</span>
          <span className="fx-hero__stat-badge">~{savingsPercentage}% with Wise</span>
        </div>
      </div>

      <div className="fx-hero__actions">
        <Link href="/dashboard/fx-analysis" className="btn btn--primary">
          View Full Analysis
        </Link>
        <a
          href="https://wise.com/invite/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--secondary"
        >
          Try Wise
        </a>
      </div>
    </div>
  )
}
