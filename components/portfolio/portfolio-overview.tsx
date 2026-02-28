"use client"

import type { PortfolioOverviewStats } from "@/types/portfolio"

interface Props {
  stats: PortfolioOverviewStats
}

export function PortfolioOverview({ stats }: Props) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)

  const formatPercent = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100)

  return (
    <div className="stats-grid">
      {/* Total Portfolio Value - Highlight Card */}
      <div className="highlight-card">
        <div className="highlight-card__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <span className="highlight-card__label">Total Portfolio Value</span>
        <div className="highlight-card__value">
          {formatCurrency(stats.totalValue)}
        </div>
        <div className="highlight-card__change">
          {stats.unrealizedGainPercent >= 0 ? "+" : ""}
          {formatPercent(stats.unrealizedGainPercent)} all time
        </div>
      </div>

      {/* Total Invested */}
      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">Total Invested</span>
        </div>
        <div className="stat-card__value">
          {formatCurrency(stats.totalInvested)}
        </div>
        <div className="stat-card__change">
          <span className="stat-card__period">
            {stats.investmentCount} investment
            {stats.investmentCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Total Distributions - Highlight Card */}
      <div className="highlight-card">
        <div className="highlight-card__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <span className="highlight-card__label">Total Distributions</span>
        <div className="highlight-card__value">
          {formatCurrency(stats.totalDistributions)}
        </div>
        <div className="highlight-card__change">
          {formatCurrency(stats.ytdDistributions)} YTD
        </div>
      </div>

      {/* Unrealized Gain */}
      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">Unrealized Gain</span>
        </div>
        <div className="stat-card__value">
          {stats.unrealizedGain >= 0 ? "+" : ""}
          {formatCurrency(stats.unrealizedGain)}
        </div>
        <div
          className={`stat-card__change ${
            stats.unrealizedGainPercent >= 0
              ? "stat-card__change--positive"
              : "stat-card__change--negative"
          }`}
        >
          {stats.unrealizedGainPercent >= 0 ? "+" : ""}
          {formatPercent(stats.unrealizedGainPercent)}
        </div>
      </div>
    </div>
  )
}
