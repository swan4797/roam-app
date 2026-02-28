"use client"

import { useRouter } from "next/navigation"
import { usePortfolioStore } from "@/lib/stores/portfolio-store"
import type { SerializedInvestment } from "@/types/portfolio"

interface Props {
  investments: SerializedInvestment[]
}

export function HoldingsTable({ investments }: Props) {
  const router = useRouter()
  const { ui, setTableSort, setSelectedInvestment } = usePortfolioStore()

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

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const handleSort = (column: string) => {
    const newDirection =
      ui.tableSort.column === column && ui.tableSort.direction === "asc"
        ? "desc"
        : "asc"
    setTableSort(column, newDirection)
  }

  const handleRowClick = (id: string) => {
    setSelectedInvestment(id)
    router.push(`/dashboard/portfolio/${id}`)
  }

  const getSortIndicator = (column: string) => {
    if (ui.tableSort.column !== column) return null
    return ui.tableSort.direction === "asc" ? " ↑" : " ↓"
  }

  // Show empty state if no investments
  if (investments.length === 0) {
    return (
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Holdings</h3>
        </div>
        <div className="card__body card__body--empty">
          <p>No investments yet.</p>
          <p className="text-muted">
            Your investment holdings will appear here once you make your first
            investment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Holdings</h3>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead className="table__header">
            <tr>
              <th
                className="table__head-cell table__head-cell--sortable"
                onClick={() => handleSort("name")}
              >
                Property{getSortIndicator("name")}
              </th>
              <th
                className="table__head-cell table__head-cell--sortable table__head-cell--right"
                onClick={() => handleSort("investedAmount")}
              >
                Invested{getSortIndicator("investedAmount")}
              </th>
              <th
                className="table__head-cell table__head-cell--sortable table__head-cell--right"
                onClick={() => handleSort("currentValue")}
              >
                Current Value{getSortIndicator("currentValue")}
              </th>
              <th
                className="table__head-cell table__head-cell--sortable table__head-cell--right"
                onClick={() => handleSort("returnPercentage")}
              >
                Return{getSortIndicator("returnPercentage")}
              </th>
              <th className="table__head-cell table__head-cell--right">
                Distributions
              </th>
              <th className="table__head-cell">Date</th>
            </tr>
          </thead>
          <tbody className="table__body">
            {investments.map((investment) => (
              <tr
                key={investment.id}
                className={`table__row table__row--clickable ${
                  ui.selectedInvestmentId === investment.id
                    ? "table__row--selected"
                    : ""
                }`}
                onClick={() => handleRowClick(investment.id)}
              >
                <td className="table__cell">
                  <div className="investment-cell">
                    <div className="investment-cell__icon">
                      <PropertyTypeIcon type={investment.property.propertyType} />
                    </div>
                    <div className="investment-cell__info">
                      <div className="investment-cell__name">
                        {investment.property.name}
                      </div>
                      <div className="investment-cell__location">
                        {investment.property.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="table__cell table__cell--right table__cell--nowrap">
                  {formatCurrency(investment.investedAmount)}
                </td>
                <td className="table__cell table__cell--right table__cell--nowrap">
                  {formatCurrency(investment.currentValue)}
                </td>
                <td className="table__cell table__cell--right">
                  <span
                    className={`return-badge ${
                      investment.returnPercentage >= 0
                        ? "return-badge--positive"
                        : "return-badge--negative"
                    }`}
                  >
                    {investment.returnPercentage >= 0 ? "+" : ""}
                    {formatPercent(investment.returnPercentage)}
                  </span>
                </td>
                <td className="table__cell table__cell--right table__cell--nowrap">
                  {formatCurrency(investment.totalDistributions)}
                </td>
                <td className="table__cell table__cell--muted">
                  {formatDate(investment.investmentDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PropertyTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    MULTIFAMILY: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 21h18M3 7v14M21 7v14M6 7V3h12v4M6 21V7M18 21V7M9 10h1M9 14h1M14 10h1M14 14h1" />
      </svg>
    ),
    COMMERCIAL: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 6h6M9 10h6M9 14h6M9 18h6" />
      </svg>
    ),
    MIXED_USE: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 22h20M6 22V8l6-6 6 6v14M10 22v-6h4v6" />
      </svg>
    ),
    INDUSTRIAL: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 22h20M4 22V9l8-7v7l8-4v17" />
      </svg>
    ),
    FUND: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  }

  return <div className="property-type-icon">{icons[type] || icons.FUND}</div>
}
