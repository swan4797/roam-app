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

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Spending by Category</h3>
      </div>
      <div className="card__body">
        <div className="category-breakdown">
          {sortedData.slice(0, 6).map((item, index) => {
            const categoryName = item.category?.name ?? "Uncategorised"
            const color = categoryColors[categoryName] ?? "#9CA3AF"
            const percentage = (item.totalSpent / maxSpent) * 100

            return (
              <div key={item.category?.id ?? index} className="category-row">
                <div className="category-row__left">
                  <div
                    className="category-row__icon"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <span
                      className="category-row__dot"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        color: "#fff"
                      }}
                    >
                      {categoryName[0]}
                    </span>
                  </div>
                  <div className="category-row__info">
                    <div className="category-row__name">{categoryName}</div>
                    <div className="category-row__count">
                      {item.transactionCount} transaction{item.transactionCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
                <div className="category-row__bar">
                  <div className="progress">
                    <div
                      className="progress__bar"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color
                      }}
                    />
                  </div>
                </div>
                <div className="category-row__amount">
                  {formatCurrency(item.totalSpent)}
                </div>
              </div>
            )
          })}
        </div>

        {sortedData.length === 0 && (
          <div className="table__empty">
            <p>No spending data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
