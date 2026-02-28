"use client"

interface SerializedFxTransaction {
  id: string
  amount: number
  currency: string
  transactionDate: Date
  description: string
  merchantName: string | null
  normalisedMerchant: string | null
  midMarketRate: number | null
  bankRate: number | null
  estimatedFxFee: number | null
  estimatedFxFeePercent: number | null
  bankAccount: {
    displayName: string
    currency: string
  }
}

interface Props {
  transactions: SerializedFxTransaction[]
}

export function FxTransactionTable({ transactions }: Props) {
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
      year: "numeric",
    }).format(new Date(date))
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  if (transactions.length === 0) {
    return null
  }

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <div className="table-toolbar__left">
          <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>All Foreign Transactions</h3>
        </div>
      </div>

      <table className="table">
        <thead className="table__header">
          <tr>
            <th className="table__head-cell">Merchant</th>
            <th className="table__head-cell">Account</th>
            <th className="table__head-cell">Date</th>
            <th className="table__head-cell table__head-cell--right">Original</th>
            <th className="table__head-cell table__head-cell--right">Mid-Market</th>
            <th className="table__head-cell table__head-cell--right">Bank Rate</th>
            <th className="table__head-cell table__head-cell--right">Est. FX Fee</th>
            <th className="table__head-cell table__head-cell--right">Markup</th>
          </tr>
        </thead>
        <tbody className="table__body">
          {transactions.map((tx) => (
            <tr key={tx.id} className="table__row">
              <td className="table__cell">
                <div style={{ fontWeight: 500 }}>
                  {tx.normalisedMerchant ?? tx.merchantName ?? tx.description.slice(0, 25)}
                </div>
              </td>
              <td className="table__cell table__cell--muted">
                {tx.bankAccount.displayName}
              </td>
              <td className="table__cell table__cell--nowrap">
                {formatDate(tx.transactionDate)}
              </td>
              <td className="table__cell table__cell--right table__cell--nowrap">
                {formatCurrency(Math.abs(tx.amount), tx.currency)}
              </td>
              <td className="table__cell table__cell--right table__cell--muted">
                {tx.midMarketRate?.toFixed(4) ?? "—"}
              </td>
              <td className="table__cell table__cell--right table__cell--muted">
                {tx.bankRate?.toFixed(4) ?? "—"}
              </td>
              <td className="table__cell table__cell--right" style={{ color: "#EF4444", fontWeight: 600 }}>
                {tx.estimatedFxFee ? formatCurrency(tx.estimatedFxFee) : "—"}
              </td>
              <td className="table__cell table__cell--right">
                {tx.estimatedFxFeePercent ? (
                  <span className="badge badge--error">
                    +{formatPercent(tx.estimatedFxFeePercent)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
