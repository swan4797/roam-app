"use client"

import Link from "next/link"

interface SerializedFxTransaction {
  id: string
  amount: number
  currency: string
  transactionDate: Date
  description: string
  merchantName: string | null
  normalisedMerchant: string | null
  estimatedFxFee: number | null
  bankAccount: {
    displayName: string
    currency: string
  }
}

interface Props {
  totals: {
    totalFxFees: number
    totalWiseSavings: number
  }
  topTransactions: SerializedFxTransaction[]
}

export function FxFeeSummary({ totals, topTransactions }: Props) {
  const formatCurrency = (amount: number, currency = "GBP") => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(new Date(date))
  }

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">FX Fees This Month</h3>
          <p className="card__subtitle">
            Your costliest foreign transactions
          </p>
        </div>
        <Link href="/dashboard/fx-analysis" className="btn btn--ghost btn--sm">
          View all
        </Link>
      </div>

      <div className="card__body">
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#EF4444" }}>
            {formatCurrency(totals.totalFxFees)}
          </div>
          <div style={{ fontSize: "0.875rem", color: "#6B7280" }}>
            approximately paid above mid-market rates
          </div>
        </div>

        {topTransactions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {topTransactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="activity-row" style={{ padding: "0.75rem 0", borderBottom: "1px solid #f3f4f6" }}>
                <div className="activity-row__left">
                  <div
                    className="activity-row__icon"
                    style={{
                      width: 36,
                      height: 36,
                      backgroundColor: "#FEE2E2",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="activity-row__content">
                    <div className="activity-row__title">
                      {tx.normalisedMerchant ?? tx.merchantName ?? tx.description.slice(0, 30)}
                    </div>
                    <div className="activity-row__id">
                      {tx.currency} {formatCurrency(Math.abs(tx.amount), tx.currency).replace(/[^0-9.,]/g, '')}
                    </div>
                  </div>
                </div>
                <div className="activity-row__right">
                  <div className="activity-row__amount activity-row__amount--negative">
                    +{formatCurrency(tx.estimatedFxFee ?? 0)}
                  </div>
                  <div className="activity-row__date">{formatDate(tx.transactionDate)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table__empty">
            <p>No foreign currency transactions yet</p>
          </div>
        )}

        {totals.totalWiseSavings > 0 && (
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1rem",
              backgroundColor: "#F0FDF4",
              borderRadius: 12,
              border: "1px solid #BBF7D0"
            }}
          >
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#15803D", marginBottom: 4 }}>
              Potential Wise Savings
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#166534" }}>
              {formatCurrency(totals.totalWiseSavings)}
            </div>
            <a
              href="https://wise.com/invite/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#15803D"
              }}
            >
              Try Wise →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
