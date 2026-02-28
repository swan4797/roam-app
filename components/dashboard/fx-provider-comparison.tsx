"use client"

interface Provider {
  name: string
  logo?: string
  rate: number
  fee: number
  total: number
  savings: number
  isRecommended?: boolean
}

interface Props {
  amount: number
  fromCurrency: string
  toCurrency: string
  midMarketRate: number
  bankRate: number
}

export function FxProviderComparison({
  amount,
  fromCurrency,
  toCurrency,
  midMarketRate,
  bankRate,
}: Props) {
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatRate = (rate: number) => {
    return rate.toFixed(4)
  }

  // Calculate provider rates and fees
  const providers: Provider[] = [
    {
      name: "Your Bank",
      rate: bankRate,
      fee: amount * (bankRate - midMarketRate),
      total: amount * bankRate,
      savings: 0,
    },
    {
      name: "Wise",
      rate: midMarketRate * 1.005, // ~0.5% markup
      fee: amount * 0.005,
      total: amount * midMarketRate * 1.005,
      savings: (amount * bankRate) - (amount * midMarketRate * 1.005),
      isRecommended: true,
    },
    {
      name: "Revolut",
      rate: midMarketRate * 1.01, // ~1% on weekends, free on weekdays
      fee: amount * 0.01,
      total: amount * midMarketRate * 1.01,
      savings: (amount * bankRate) - (amount * midMarketRate * 1.01),
    },
    {
      name: "PayPal",
      rate: midMarketRate * 1.04, // ~4% markup
      fee: amount * 0.04,
      total: amount * midMarketRate * 1.04,
      savings: (amount * bankRate) - (amount * midMarketRate * 1.04),
    },
  ]

  // Sort by savings (best first)
  const sortedProviders = [...providers].sort((a, b) => b.savings - a.savings)

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Provider Comparison</h3>
          <p className="card__subtitle">
            Converting {formatCurrency(amount, fromCurrency)} to {toCurrency}
          </p>
        </div>
      </div>

      <div className="card__body">
        <div className="provider-comparison">
          {sortedProviders.map((provider, index) => (
            <div
              key={provider.name}
              className={`provider-card ${provider.isRecommended ? "provider-card--recommended" : ""}`}
            >
              <div className="provider-card__left">
                <div className="provider-card__logo">
                  {provider.name[0]}
                </div>
                <div className="provider-card__info">
                  <span className="provider-card__name">
                    {provider.name}
                    {provider.isRecommended && (
                      <span className="provider-card__badge">Best Rate</span>
                    )}
                  </span>
                  <span className="provider-card__rate">
                    1 {fromCurrency} = {formatRate(provider.rate)} {toCurrency}
                  </span>
                </div>
              </div>
              <div className="provider-card__right">
                <span className="provider-card__fee">
                  {formatCurrency(provider.fee, toCurrency)} fee
                </span>
                {provider.savings > 0 && (
                  <span className="provider-card__savings">
                    Save {formatCurrency(provider.savings, toCurrency)}
                  </span>
                )}
                {index === sortedProviders.length - 1 && provider.savings <= 0 && (
                  <span style={{ fontSize: "0.75rem", color: "#EF4444" }}>
                    Most expensive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          backgroundColor: "var(--surface-2)",
          borderRadius: "12px",
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
        }}>
          <strong>Mid-market rate:</strong> 1 {fromCurrency} = {formatRate(midMarketRate)} {toCurrency}
          <br />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            This is the real exchange rate with no markup. Compare providers above to see who gets closest.
          </span>
        </div>
      </div>
    </div>
  )
}
