"use client"

interface Props {
  stats: {
    connectedAccounts: number
    transactionsThisMonth: number
    totalSpentThisMonth: number
    fxFeesThisMonth: number
    potentialWiseSavings: number
    unpaidInvoicesTotal: number
    unpaidInvoicesCount: number
  }
}

export function DashboardOverview({ stats }: Props) {
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
          <span className="stat-card__label">Total Spent</span>
          <div className="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>
        <div className="stat-card__value">{formatCurrency(stats.totalSpentThisMonth)}</div>
        <div className="stat-card__change">
          <span className="stat-card__period">This month</span>
        </div>
      </div>

      <div className="highlight-card">
        <div className="highlight-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <span className="highlight-card__label">FX Fees Paid</span>
        <div className="highlight-card__value">{formatCurrency(stats.fxFeesThisMonth)}</div>
        <div className="highlight-card__change">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Approximately above mid-market
        </div>
      </div>

      <div className="highlight-card">
        <div className="highlight-card__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <span className="highlight-card__label">Wise Savings</span>
        <div className="highlight-card__value">{formatCurrency(stats.potentialWiseSavings)}</div>
        <div className="highlight-card__change">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Potential savings with Wise
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">Unpaid Invoices</span>
          <div className="stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        </div>
        <div className="stat-card__value">{formatCurrency(stats.unpaidInvoicesTotal)}</div>
        <div className="stat-card__change">
          <span className="stat-card__period">{stats.unpaidInvoicesCount} outstanding</span>
        </div>
      </div>
    </div>
  )
}
