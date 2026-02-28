"use client"

interface Props {
  unpaidTotal: {
    total: number
    count: number
  }
  invoiceCount: number
}

export function InvoiceStats({ unpaidTotal, invoiceCount }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount)
  }

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">Total Invoices</span>
        </div>
        <div className="stat-card__value">{invoiceCount}</div>
      </div>

      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">Outstanding</span>
        </div>
        <div className="stat-card__value">{unpaidTotal.count}</div>
        <div className="stat-card__change">
          <span className="stat-card__period">invoices unpaid</span>
        </div>
      </div>

      <div className="highlight-card">
        <span className="highlight-card__label">Amount Due</span>
        <div className="highlight-card__value">
          {formatCurrency(unpaidTotal.total)}
        </div>
        <div className="highlight-card__change">
          Total outstanding balance
        </div>
      </div>
    </div>
  )
}
