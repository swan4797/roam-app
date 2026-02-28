"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { recordSettlementAction } from "@/actions/groups"

const currencies = [
  { code: "GBP", symbol: "£" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "JPY", symbol: "¥" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
  { code: "CHF", symbol: "Fr" },
  { code: "THB", symbol: "฿" },
  { code: "MXN", symbol: "$" },
]

interface Debt {
  from: { id: string; name: string }
  to: { id: string; name: string }
  amount: number
  currency: string
}

interface Group {
  id: string
  currency: string
}

interface Props {
  group: Group
  debts: Debt[]
}

export function SettleUpButton({ group, debts }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const [settlementCurrency, setSettlementCurrency] = useState(group.currency)
  const [isLoading, setIsLoading] = useState(false)
  const [fxResult, setFxResult] = useState<{
    fee: number
    wiseSavings: number | null
    currency: string
  } | null>(null)

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleSelectDebt = (debt: Debt) => {
    setSelectedDebt(debt)
    setSettlementCurrency(debt.currency)
    setFxResult(null)
  }

  const handleSettle = async () => {
    if (!selectedDebt) return

    setIsLoading(true)

    const formData = new FormData()
    formData.set("groupId", group.id)
    formData.set("fromMemberId", selectedDebt.from.id)
    formData.set("toMemberId", selectedDebt.to.id)
    formData.set("amount", selectedDebt.amount.toString())
    formData.set("currency", settlementCurrency)

    const result = await recordSettlementAction(formData)

    if (result.success) {
      if (result.fxWarning) {
        setFxResult(result.fxWarning)
      } else {
        setIsOpen(false)
        setSelectedDebt(null)
        router.refresh()
      }
    } else {
      alert(result.error)
    }

    setIsLoading(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setSelectedDebt(null)
    setFxResult(null)
    if (fxResult) {
      router.refresh()
    }
  }

  const isForeignCurrency = settlementCurrency !== group.currency

  return (
    <>
      <button className="btn btn--secondary" onClick={() => setIsOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
        Settle Up
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">
                {fxResult ? "Settlement Complete" : selectedDebt ? "Confirm Settlement" : "Settle Up"}
              </h2>
              <button className="modal__close" onClick={handleClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal__body">
              {/* FX Result */}
              {fxResult && (
                <div className="settle-fx-result">
                  <div className="settle-fx-result__icon">✅</div>
                  <h3>Settlement Recorded!</h3>

                  <div className="settle-fx-warning">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <div>
                      <strong>FX Fee Alert</strong>
                      <p>
                        This settlement involved a currency conversion. You may have paid approximately{" "}
                        <strong>{formatCurrency(fxResult.fee, group.currency)}</strong> in hidden FX fees.
                      </p>
                      {fxResult.wiseSavings && fxResult.wiseSavings > 0 && (
                        <p className="settle-fx-tip">
                          💡 Tip: Using Wise could have saved you{" "}
                          <strong>{formatCurrency(fxResult.wiseSavings, group.currency)}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Debt Selection */}
              {!selectedDebt && !fxResult && (
                <>
                  <p style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}>
                    Select a payment to settle:
                  </p>
                  <div className="settle-debt-list">
                    {debts.map((debt, idx) => (
                      <button
                        key={idx}
                        className="settle-debt-item"
                        onClick={() => handleSelectDebt(debt)}
                      >
                        <div className="settle-debt-item__info">
                          <div className="settle-debt-item__avatars">
                            <div className="settle-debt-item__avatar">
                              {debt.from.name.charAt(0)}
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                            <div className="settle-debt-item__avatar">
                              {debt.to.name.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <strong>{debt.from.name}</strong> pays <strong>{debt.to.name}</strong>
                          </div>
                        </div>
                        <div className="settle-debt-item__amount">
                          {formatCurrency(debt.amount, debt.currency)}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Settlement Confirmation */}
              {selectedDebt && !fxResult && (
                <div className="settle-confirm">
                  <div className="settle-confirm__summary">
                    <div className="settle-confirm__person">
                      <div className="settle-confirm__avatar">
                        {selectedDebt.from.name.charAt(0)}
                      </div>
                      <span>{selectedDebt.from.name}</span>
                    </div>
                    <div className="settle-confirm__arrow">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span className="settle-confirm__amount">
                        {formatCurrency(selectedDebt.amount, selectedDebt.currency)}
                      </span>
                    </div>
                    <div className="settle-confirm__person">
                      <div className="settle-confirm__avatar">
                        {selectedDebt.to.name.charAt(0)}
                      </div>
                      <span>{selectedDebt.to.name}</span>
                    </div>
                  </div>

                  <div className="form__group" style={{ marginTop: "1.5rem" }}>
                    <label className="form__label">Settlement Currency</label>
                    <select
                      className="select"
                      value={settlementCurrency}
                      onChange={(e) => setSettlementCurrency(e.target.value)}
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isForeignCurrency && (
                    <div className="fx-notice fx-notice--warning">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <div>
                        <strong>FX Warning</strong>
                        <p>
                          Settling in {settlementCurrency} instead of {group.currency} may incur FX fees.
                          We'll show you the estimated fee after recording.
                        </p>
                        <p style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>
                          💡 Consider using Wise or Revolut for better rates
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal__footer">
              {selectedDebt && !fxResult ? (
                <>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setSelectedDebt(null)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={handleSettle}
                    disabled={isLoading}
                  >
                    {isLoading ? "Recording..." : "Record Settlement"}
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn--primary" onClick={handleClose}>
                  {fxResult ? "Done" : "Cancel"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
