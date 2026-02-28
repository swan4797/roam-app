"use client"

import { useState } from "react"
import { updateCategoryAction, markAsTransferAction } from "@/actions/transactions"
import type { Category, BankConnection } from "@/generated/prisma/client"

interface SerializedTransaction {
  id: string
  amount: number
  amountInBase: number | null
  currency: string
  transactionDate: Date
  description: string
  merchantName: string | null
  normalisedMerchant: string | null
  categoryId: string | null
  midMarketRate: number | null
  bankRate: number | null
  estimatedFxFee: number | null
  isInternalTransfer: boolean
  bankAccount: {
    displayName: string
    currency: string
    bankConnection: Pick<BankConnection, "institutionName">
  }
  category: Category | null
}

interface Props {
  transactions: SerializedTransaction[]
  totalFxFees: number
  categories: Category[]
}

export function TransactionList({ transactions, totalFxFees, categories }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  if (transactions.length === 0) {
    return (
      <div className="card">
        <div className="table__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48 }}>
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <p>No transactions found</p>
          <p style={{ fontSize: "0.75rem", marginTop: 8, color: "#6b7280" }}>
            Connect a bank account to see your transactions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <div className="table-toolbar">
        <div className="table-toolbar__left">
          <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
          </span>
          {totalFxFees > 0 && (
            <span className="badge badge--error">
              {formatCurrency(totalFxFees)} in FX fees
            </span>
          )}
        </div>
      </div>

      <div>
        {transactions.map((tx) => {
          const isCredit = tx.amount > 0
          const isSelected = selectedId === tx.id

          return (
            <div key={tx.id}>
              <div
                className={`activity-row ${isSelected ? "is-selected" : ""}`}
                onClick={() => setSelectedId(isSelected ? null : tx.id)}
                style={{ cursor: "pointer" }}
              >
                <div className="activity-row__left">
                  <input
                    type="checkbox"
                    className="activity-row__checkbox"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div
                    className="activity-row__icon"
                    style={{
                      backgroundColor: tx.category?.color
                        ? `${tx.category.color}15`
                        : "#f3f4f6"
                    }}
                  >
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      backgroundColor: tx.category?.color ?? "#9ca3af",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      color: "#fff",
                      fontWeight: 600
                    }}>
                      {(tx.category?.name ?? tx.normalisedMerchant ?? tx.description)[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="activity-row__content">
                    <div className="activity-row__title">
                      {tx.normalisedMerchant ?? tx.merchantName ?? tx.description.slice(0, 35)}
                    </div>
                    <div className="activity-row__id">
                      {tx.bankAccount.bankConnection.institutionName} • {tx.bankAccount.displayName}
                    </div>
                  </div>
                </div>

                <div className="activity-row__right">
                  <div
                    className={`activity-row__amount ${isCredit ? "activity-row__amount--positive" : ""}`}
                  >
                    {isCredit ? "+" : ""}
                    {formatCurrency(tx.amount, tx.currency)}
                  </div>

                  {tx.category && (
                    <span
                      className="badge"
                      style={{
                        backgroundColor: `${tx.category.color ?? "#9ca3af"}15`,
                        color: tx.category.color ?? "#9ca3af"
                      }}
                    >
                      {tx.category.name}
                    </span>
                  )}

                  {tx.estimatedFxFee && tx.estimatedFxFee > 0 && (
                    <span className="badge badge--error badge--sm">
                      +{formatCurrency(tx.estimatedFxFee)} FX
                    </span>
                  )}

                  <div className="activity-row__date">
                    {formatDate(tx.transactionDate)}
                  </div>

                  <button
                    className="icon-btn icon-btn--sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                </div>
              </div>

              {isSelected && (
                <div className="transaction-detail">
                  <div className="transaction-detail__grid">
                    <div className="transaction-detail__item">
                      <span className="transaction-detail__label">Category</span>
                      <form action={updateCategoryAction}>
                        <input type="hidden" name="transactionId" value={tx.id} />
                        <select
                          name="categoryId"
                          className="select"
                          defaultValue={tx.categoryId ?? ""}
                          onChange={(e) => e.target.form?.requestSubmit()}
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </form>
                    </div>

                    {tx.currency !== "GBP" && (
                      <>
                        <div className="transaction-detail__item">
                          <span className="transaction-detail__label">Mid-Market Rate</span>
                          <span className="transaction-detail__value">
                            {tx.midMarketRate?.toFixed(4) ?? "—"}
                          </span>
                        </div>
                        <div className="transaction-detail__item">
                          <span className="transaction-detail__label">Bank Rate</span>
                          <span className="transaction-detail__value">
                            {tx.bankRate?.toFixed(4) ?? "—"}
                          </span>
                        </div>
                        <div className="transaction-detail__item">
                          <span className="transaction-detail__label">Est. FX Fee</span>
                          <span className="transaction-detail__value transaction-detail__value--error">
                            {tx.estimatedFxFee
                              ? formatCurrency(tx.estimatedFxFee)
                              : "—"}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="transaction-detail__actions">
                      <form action={markAsTransferAction}>
                        <input type="hidden" name="transactionId" value={tx.id} />
                        <button
                          type="submit"
                          className="btn btn--ghost btn--sm"
                          disabled={tx.isInternalTransfer}
                        >
                          {tx.isInternalTransfer ? "Marked as transfer" : "Mark as transfer"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
