"use client"

interface CurrencyBalance {
  currency: string
  balance: number
  accountCount: number
  monthlySpending: number
  fxFees: number
}

interface Props {
  currencies: CurrencyBalance[]
  baseCurrency: string
}

// Currency flags/symbols mapping
const currencyInfo: Record<string, { flag: string; name: string }> = {
  GBP: { flag: "🇬🇧", name: "British Pound" },
  EUR: { flag: "🇪🇺", name: "Euro" },
  USD: { flag: "🇺🇸", name: "US Dollar" },
  CAD: { flag: "🇨🇦", name: "Canadian Dollar" },
  AUD: { flag: "🇦🇺", name: "Australian Dollar" },
  JPY: { flag: "🇯🇵", name: "Japanese Yen" },
  CHF: { flag: "🇨🇭", name: "Swiss Franc" },
  SEK: { flag: "🇸🇪", name: "Swedish Krona" },
  NOK: { flag: "🇳🇴", name: "Norwegian Krone" },
  DKK: { flag: "🇩🇰", name: "Danish Krone" },
  PLN: { flag: "🇵🇱", name: "Polish Zloty" },
  CZK: { flag: "🇨🇿", name: "Czech Koruna" },
  HUF: { flag: "🇭🇺", name: "Hungarian Forint" },
  THB: { flag: "🇹🇭", name: "Thai Baht" },
  SGD: { flag: "🇸🇬", name: "Singapore Dollar" },
  HKD: { flag: "🇭🇰", name: "Hong Kong Dollar" },
  MXN: { flag: "🇲🇽", name: "Mexican Peso" },
  BRL: { flag: "🇧🇷", name: "Brazilian Real" },
  INR: { flag: "🇮🇳", name: "Indian Rupee" },
  ZAR: { flag: "🇿🇦", name: "South African Rand" },
}

export function CurrencyOverview({ currencies, baseCurrency }: Props) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Sort by spending (most active currencies first)
  const sortedCurrencies = [...currencies].sort(
    (a, b) => Math.abs(b.monthlySpending) - Math.abs(a.monthlySpending)
  )

  // Calculate total spending and fees
  const totalSpending = currencies.reduce((sum, c) => sum + Math.abs(c.monthlySpending), 0)
  const totalFees = currencies.reduce((sum, c) => sum + c.fxFees, 0)

  if (currencies.length === 0) {
    return (
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Multi-Currency Overview</h3>
        </div>
        <div className="card__body">
          <div className="card__body--empty">
            <div className="card__body--empty__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p>No multi-currency transactions yet</p>
            <p className="text-muted">Sync your transactions to see currency breakdown</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bento-card">
      <div className="bento-card__header">
        <h3 className="bento-card__title">Your currencies</h3>
      </div>

      {/* Currency Bubbles - Lumin style */}
      <div className="currency-bubbles">
        {sortedCurrencies.slice(0, 3).map((curr, index) => {
          const info = currencyInfo[curr.currency] || { flag: "💱", name: curr.currency }
          const spendingPercent = totalSpending > 0
            ? Math.round((Math.abs(curr.monthlySpending) / totalSpending) * 100)
            : 0

          // Larger bubble for first currency
          const isMain = index === 0

          return (
            <div
              key={curr.currency}
              className={`currency-bubble ${isMain ? "currency-bubble--main" : ""}`}
              style={{
                backgroundColor: isMain ? "#CDFE00" : index === 1 ? "#1A1A1F" : "#F5F5F5",
                color: isMain || index === 1 ? (isMain ? "#0D0D0D" : "#FFFFFF") : "#0D0D0D",
              }}
            >
              <span className="currency-bubble__symbol">$</span>
              <div className="currency-bubble__content">
                <span className="currency-bubble__code">{curr.currency}</span>
                <span className="currency-bubble__percent">{spendingPercent}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Currency List */}
      <div className="currency-list">
        {sortedCurrencies.slice(0, 4).map((curr) => {
          const info = currencyInfo[curr.currency] || { flag: "💱", name: curr.currency }
          const spendingPercent = totalSpending > 0
            ? Math.round((Math.abs(curr.monthlySpending) / totalSpending) * 100)
            : 0

          return (
            <div key={curr.currency} className="currency-list__item">
              <span className="currency-list__flag">{info.flag}</span>
              <span className="currency-list__code">{curr.currency}</span>
              <span className="currency-list__percent">{spendingPercent}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
