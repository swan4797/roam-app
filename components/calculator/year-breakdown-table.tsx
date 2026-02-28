"use client"

import { memo, useState } from "react"
import type { YearlyBreakdown } from "@/types/calculator"
import { formatCurrency, formatPercent } from "@/lib/utils/calculator"

interface Props {
  data: YearlyBreakdown[]
  reinvestMode: boolean
}

export const YearBreakdownTable = memo(function YearBreakdownTable({ data, reinvestMode }: Props) {
  const [expanded, setExpanded] = useState(false)
  const displayData = expanded ? data : data.slice(0, 5)
  const hasMore = data.length > 5

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Year-by-Year Breakdown</h3>
          <p className="card__subtitle">
            {reinvestMode
              ? "With distribution reinvestment"
              : "Without reinvestment"}
          </p>
        </div>
      </div>

      <div className="card__body card__body--flush">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Year</th>
                <th className="table__cell--right">Start Value</th>
                <th className="table__cell--right">Appreciation</th>
                <th className="table__cell--right">
                  {reinvestMode ? "Reinvested" : "Distributions"}
                </th>
                <th className="table__cell--right">End Value</th>
                <th className="table__cell--right">Total Return</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row) => (
                <tr key={row.year}>
                  <td>Year {row.year}</td>
                  <td className="table__cell--right table__cell--tabular">
                    {formatCurrency(row.startingValue)}
                  </td>
                  <td className="table__cell--right table__cell--tabular table__cell--positive">
                    +{formatCurrency(row.appreciation)}
                  </td>
                  <td className="table__cell--right table__cell--tabular">
                    {reinvestMode
                      ? `+${formatCurrency(row.reinvestedDistributions)}`
                      : formatCurrency(row.distributions)}
                  </td>
                  <td className="table__cell--right table__cell--tabular table__cell--highlight">
                    {formatCurrency(row.endingValue)}
                  </td>
                  <td className="table__cell--right table__cell--tabular">
                    <span
                      className={`return-badge ${
                        row.totalReturn >= 0
                          ? "return-badge--positive"
                          : "return-badge--negative"
                      }`}
                    >
                      {formatPercent(row.totalReturn)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="table-expand">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : `Show all ${data.length} years`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})
