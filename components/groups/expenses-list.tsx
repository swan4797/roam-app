"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteExpenseAction } from "@/actions/groups"

interface Split {
  id: string
  memberId: string
  amount: number
  percentage: number | null
  shares: number | null
  isPaid: boolean
  member: {
    id: string
    name: string
    userId: string | null
  }
}

interface Expense {
  id: string
  groupId: string
  description: string
  amount: number
  currency: string
  category: string | null
  expenseDate: Date
  splitType: string
  notes: string | null
  amountInGroupCurrency: number | null
  midMarketRate: number | null
  actualRate: number | null
  estimatedFxFee: number | null
  paidBy: {
    id: string
    name: string
    userId: string | null
  }
  splits: Split[]
}

interface Props {
  expenses: Expense[]
  groupCurrency: string
}

export function ExpensesList({ expenses, groupCurrency }: Props) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(new Date(date))
  }

  const handleDelete = async (expenseId: string, groupId: string) => {
    if (!confirm("Delete this expense?")) return

    setDeletingId(expenseId)
    const formData = new FormData()
    formData.set("expenseId", expenseId)
    formData.set("groupId", groupId)

    const result = await deleteExpenseAction(formData)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setDeletingId(null)
  }

  if (expenses.length === 0) {
    return (
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Expenses</h3>
        </div>
        <div className="card__body" style={{ textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💸</div>
          <p style={{ color: "var(--text-secondary)" }}>
            No expenses yet. Add your first expense to start splitting!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Expenses</h3>
        <span className="card__badge">{expenses.length}</span>
      </div>
      <div className="card__body" style={{ padding: 0 }}>
        <div className="expense-list">
          {expenses.map((expense) => (
            <div key={expense.id} className="expense-item">
              <div className="expense-item__main">
                <div className="expense-item__icon">
                  {getCategoryIcon(expense.category)}
                </div>
                <div className="expense-item__info">
                  <div className="expense-item__description">{expense.description}</div>
                  <div className="expense-item__meta">
                    <span>Paid by {expense.paidBy.name}</span>
                    <span>•</span>
                    <span>{formatDate(expense.expenseDate)}</span>
                  </div>
                </div>
                <div className="expense-item__amount">
                  <div className="expense-item__total">
                    {formatCurrency(expense.amount, expense.currency)}
                  </div>

                  {/* FX Warning */}
                  {expense.estimatedFxFee && expense.estimatedFxFee > 0 && (
                    <div className="expense-item__fx-warning">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      ~{formatCurrency(expense.estimatedFxFee, groupCurrency)} FX fee
                    </div>
                  )}
                </div>
                <button
                  className="expense-item__delete"
                  onClick={() => handleDelete(expense.id, expense.groupId)}
                  disabled={deletingId === expense.id}
                  title="Delete expense"
                >
                  {deletingId === expense.id ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Split details */}
              <div className="expense-item__splits">
                {expense.splits.map((split) => (
                  <div key={split.id} className="expense-split">
                    <span className="expense-split__name">{split.member.name}</span>
                    <span className="expense-split__amount">
                      {formatCurrency(split.amount, expense.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getCategoryIcon(category: string | null): string {
  const icons: Record<string, string> = {
    food: "🍔",
    transport: "🚗",
    accommodation: "🏨",
    entertainment: "🎬",
    shopping: "🛍️",
    drinks: "🍺",
    groceries: "🛒",
    flights: "✈️",
    activities: "🎯",
    other: "📝",
  }
  return icons[category?.toLowerCase() || "other"] || "📝"
}
