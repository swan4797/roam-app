"use client"

import Link from "next/link"

interface Props {
  unpaidTotal: {
    total: number
    count: number
  }
}

export function InvoiceSummary({ unpaidTotal }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount)
  }

  if (unpaidTotal.count === 0) {
    return null
  }

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Outstanding Invoices</h3>
          <p className="card__subtitle">
            You have {unpaidTotal.count} unpaid invoice{unpaidTotal.count !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/invoices" className="btn btn--primary btn--sm">
          View Invoices
        </Link>
      </div>

      <div className="card__body">
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem",
          backgroundColor: "#FEF3C7",
          borderRadius: 12,
          border: "1px solid #FDE68A"
        }}>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#92400E", marginBottom: 4 }}>
              Total Outstanding
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#78350F" }}>
              {formatCurrency(unpaidTotal.total)}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              backgroundColor: "#FDE68A",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#92400E"
              strokeWidth="2"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
