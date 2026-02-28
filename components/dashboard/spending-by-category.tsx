"use client"

import type { Category } from "@/generated/prisma/client"

interface CategorySpending {
  category: Category | null | undefined
  totalSpent: number
  transactionCount: number
}

interface Props {
  data: CategorySpending[]
}

const categoryColors: Record<string, string> = {
  Shopping: "#8B5CF6",
  "Food & Drink": "#F59E0B",
  Transport: "#3B82F6",
  Travel: "#10B981",
  Entertainment: "#EC4899",
  "Bills & Utilities": "#6B7280",
  Health: "#EF4444",
  Groceries: "#22C55E",
  Subscriptions: "#8B5CF6",
  Income: "#10B981",
  Transfer: "#6B7280",
  Cash: "#F59E0B",
  Other: "#9CA3AF",
}

export function SpendingByCategory({ data }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount)
  }

  const maxSpent = Math.max(...data.map((d) => d.totalSpent), 1)

  // Sort by total spent descending
  const sortedData = [...data].sort((a, b) => b.totalSpent - a.totalSpent)

  // Calculate total for percentages
  const total = sortedData.reduce((sum, item) => sum + item.totalSpent, 0)

  return (
    <div className="bento-card">
      <div className="bento-card__header">
        <h3 className="bento-card__title">Spending categories</h3>
        <button className="icon-btn icon-btn--sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>

      {/* Horizontal progress bar with all categories */}
      <div className="category-progress-bar">
        {sortedData.slice(0, 4).map((item, index) => {
          const categoryName = item.category?.name ?? "Uncategorised"
          const color = categoryColors[categoryName] ?? "#9CA3AF"
          const percentage = total > 0 ? (item.totalSpent / total) * 100 : 0

          return (
            <div
              key={item.category?.id ?? index}
              className="category-progress-bar__segment"
              style={{
                width: `${Math.max(percentage, 5)}%`,
                backgroundColor: color
              }}
            />
          )
        })}
      </div>

      {/* Category list */}
      <div className="category-list">
        {sortedData.slice(0, 5).map((item, index) => {
          const categoryName = item.category?.name ?? "Uncategorised"
          const color = categoryColors[categoryName] ?? "#9CA3AF"

          return (
            <div key={item.category?.id ?? index} className="category-item">
              <div className="category-item__left">
                <div
                  className="category-item__icon"
                  style={{ backgroundColor: color }}
                >
                  {categoryName[0]}
                </div>
                <div className="category-item__info">
                  <span className="category-item__name">{categoryName}</span>
                  <span className="category-item__count">
                    {item.transactionCount} transaction{item.transactionCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <span className="category-item__amount">
                {formatCurrency(item.totalSpent)}
              </span>
            </div>
          )
        })}
      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__text">No spending data available</p>
        </div>
      )}
    </div>
  )
}
