"use client"

interface AccountBalance {
  id: string
  displayName: string
  institutionName: string
  currency: string
  balance: number | null
  balanceUpdatedAt: Date | null
}

interface Props {
  total: {
    total: number
    currency: string
  }
  balances: AccountBalance[]
}

export function BalanceOverview({ total, balances }: Props) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
    }).format(amount)
  }

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <span className="card__subtitle">Total Balance</span>
          <div style={{
            fontSize: "2.25rem",
            fontWeight: 700,
            color: "#111827",
            marginTop: 4
          }}>
            {formatCurrency(total.total, total.currency)}
          </div>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          backgroundColor: "#f3f4f6",
          borderRadius: 8,
          fontSize: "0.875rem",
          fontWeight: 500
        }}>
          <span>🇬🇧</span>
          {total.currency}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      <div className="card__body">
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button className="btn btn--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            Transfer
          </button>
          <button className="btn btn--secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            Request
          </button>
        </div>

        {balances.length > 0 && (
          <>
            <div style={{
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e5e7eb"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem"
              }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}>
                  Wallets
                </span>
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  Total {balances.length} wallets
                </span>
              </div>

              <div className="wallets-row">
                {balances.map((account) => (
                  <div key={account.id} className="wallet-card">
                    <div className="wallet-card__content">
                      <div className="wallet-card__currency">
                        <span>{getCurrencyFlag(account.currency)}</span>
                        <span>{account.currency}</span>
                      </div>
                      <div className="wallet-card__balance">
                        {account.balance !== null
                          ? formatCurrency(account.balance, account.currency)
                          : "—"}
                      </div>
                      <div className="wallet-card__limit">
                        {account.institutionName}
                      </div>
                    </div>
                    <span className="wallet-card__status wallet-card__status--active">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function getCurrencyFlag(currency: string): string {
  const flags: Record<string, string> = {
    GBP: "🇬🇧",
    USD: "🇺🇸",
    EUR: "🇪🇺",
    JPY: "🇯🇵",
    CHF: "🇨🇭",
    AUD: "🇦🇺",
    CAD: "🇨🇦",
    NZD: "🇳🇿",
    SGD: "🇸🇬",
    HKD: "🇭🇰",
  }
  return flags[currency] ?? "💱"
}
