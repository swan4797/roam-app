"use client"

interface MemberBalance {
  member: {
    id: string
    name: string
    userId: string | null
  }
  balance: number
}

interface Debt {
  from: { id: string; name: string }
  to: { id: string; name: string }
  amount: number
  currency: string
}

interface Balances {
  balances: MemberBalance[]
  debts: Debt[]
  currency: string
}

interface Props {
  balances: Balances
}

export function GroupBalances({ balances }: Props) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const sortedBalances = [...balances.balances].sort((a, b) => b.balance - a.balance)

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Balances</h3>
      </div>
      <div className="card__body">
        {/* Member Balances */}
        <div className="balance-list">
          {sortedBalances.map((item) => (
            <div key={item.member.id} className="balance-item">
              <div className="balance-item__member">
                <div className="balance-item__avatar">
                  {item.member.name.charAt(0).toUpperCase()}
                </div>
                <span className="balance-item__name">{item.member.name}</span>
              </div>
              <div
                className={`balance-item__amount ${
                  item.balance > 0
                    ? "balance-item__amount--positive"
                    : item.balance < 0
                    ? "balance-item__amount--negative"
                    : ""
                }`}
              >
                {item.balance > 0 && "+"}
                {formatCurrency(item.balance, balances.currency)}
              </div>
            </div>
          ))}
        </div>

        {/* Simplified Debts */}
        {balances.debts.length > 0 && (
          <>
            <div className="balance-divider">
              <span>Who owes whom</span>
            </div>
            <div className="debt-list">
              {balances.debts.map((debt, idx) => (
                <div key={idx} className="debt-item">
                  <div className="debt-item__from">
                    <div className="debt-item__avatar">
                      {debt.from.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{debt.from.name}</span>
                  </div>
                  <div className="debt-item__arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                  <div className="debt-item__to">
                    <div className="debt-item__avatar">
                      {debt.to.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{debt.to.name}</span>
                  </div>
                  <div className="debt-item__amount">
                    {formatCurrency(debt.amount, debt.currency)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {balances.debts.length === 0 && balances.balances.every((b) => Math.abs(b.balance) < 0.01) && (
          <div className="balance-settled">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>All settled up!</span>
          </div>
        )}
      </div>
    </div>
  )
}
