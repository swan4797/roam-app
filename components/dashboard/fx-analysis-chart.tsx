"use client"

interface SerializedFxTransaction {
  id: string
  currency: string
  estimatedFxFee: number | null
}

interface Props {
  transactions: SerializedFxTransaction[]
}

export function FxAnalysisChart({ transactions }: Props) {
  // Group transactions by currency
  const byCurrency = transactions.reduce((acc, tx) => {
    const currency = tx.currency
    if (!acc[currency]) {
      acc[currency] = { total: 0, count: 0 }
    }
    acc[currency].total += tx.estimatedFxFee ?? 0
    acc[currency].count += 1
    return acc
  }, {} as Record<string, { total: number; count: number }>)

  type CurrencyData = { total: number; count: number }
  const currencies: [string, CurrencyData][] = Object.entries(byCurrency)
    .sort((a, b) => (b[1] as CurrencyData).total - (a[1] as CurrencyData).total)
    .slice(0, 6) as [string, CurrencyData][]

  const maxFee = Math.max(...currencies.map(([, data]: [string, CurrencyData]) => data.total), 1)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount)
  }

  if (currencies.length === 0) {
    return (
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">FX Fees by Currency</h3>
        </div>
        <div className="table__empty">
          <p>No foreign currency transactions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">FX Fees by Currency</h3>
        <div className="chart__legend">
          <span className="chart__legend-item chart__legend-item--profit">
            Fees paid
          </span>
        </div>
      </div>

      <div className="card__body">
        <div className="bar-chart">
          {currencies.map(([currency, data]) => {
            const heightPercent = (data.total / maxFee) * 100
            return (
              <div key={currency} className="bar-chart__bar-group">
                <div className="bar-chart__bars">
                  <div
                    className="bar-chart__bar bar-chart__bar--primary"
                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                    title={`${formatCurrency(data.total)} in fees`}
                  />
                </div>
                <span className="bar-chart__label">{currency}</span>
              </div>
            )
          })}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #e5e7eb"
          }}
        >
          {currencies.map(([currency, data]) => (
            <div key={currency}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: 2 }}>
                {currency}
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 600, color: "#111827" }}>
                {formatCurrency(data.total)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                {data.count} transaction{data.count !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
