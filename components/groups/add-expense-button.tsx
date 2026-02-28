"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { addExpenseAction } from "@/actions/groups"

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

const categories = [
  { id: "food", label: "Food & Drink", icon: "🍔" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "accommodation", label: "Accommodation", icon: "🏨" },
  { id: "flights", label: "Flights", icon: "✈️" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "groceries", label: "Groceries", icon: "🛒" },
  { id: "activities", label: "Activities", icon: "🎯" },
  { id: "other", label: "Other", icon: "📝" },
]

interface Member {
  id: string
  name: string
  email: string | null
  userId: string | null
}

interface Group {
  id: string
  name: string
  currency: string
  members: Member[]
}

interface Props {
  group: Group
}

type SplitType = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES"

export function AddExpenseButton({ group }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(group.currency)
  const [paidById, setPaidById] = useState(group.members[0]?.id || "")
  const [category, setCategory] = useState("other")
  const [splitType, setSplitType] = useState<SplitType>("EQUAL")
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    group.members.map((m) => m.id)
  )
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({})

  const isForeignCurrency = currency !== group.currency

  // Calculate splits preview
  const splitPreview = useMemo(() => {
    const totalAmount = parseFloat(amount) || 0
    const members = group.members.filter((m) => selectedMembers.includes(m.id))

    if (members.length === 0 || totalAmount === 0) return []

    switch (splitType) {
      case "EQUAL":
        const equalAmount = totalAmount / members.length
        return members.map((m) => ({
          memberId: m.id,
          name: m.name,
          amount: Math.round(equalAmount * 100) / 100,
        }))

      case "EXACT":
        return members.map((m) => ({
          memberId: m.id,
          name: m.name,
          amount: parseFloat(customSplits[m.id] || "0"),
        }))

      case "PERCENTAGE":
        return members.map((m) => {
          const pct = parseFloat(customSplits[m.id] || "0")
          return {
            memberId: m.id,
            name: m.name,
            amount: Math.round(totalAmount * (pct / 100) * 100) / 100,
            percentage: pct,
          }
        })

      case "SHARES":
        const totalShares = members.reduce(
          (sum, m) => sum + (parseInt(customSplits[m.id] || "1") || 1),
          0
        )
        return members.map((m) => {
          const shares = parseInt(customSplits[m.id] || "1") || 1
          return {
            memberId: m.id,
            name: m.name,
            amount: Math.round((totalAmount * (shares / totalShares)) * 100) / 100,
            shares,
          }
        })

      default:
        return []
    }
  }, [amount, group.members, selectedMembers, splitType, customSplits])

  const splitTotal = splitPreview.reduce((sum, s) => sum + s.amount, 0)
  const totalAmount = parseFloat(amount) || 0
  const isBalanced = Math.abs(splitTotal - totalAmount) < 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isBalanced && splitType !== "EQUAL") {
      alert("Split amounts must equal the total expense amount")
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.set("groupId", group.id)
    formData.set("description", description)
    formData.set("amount", amount)
    formData.set("currency", currency)
    formData.set("paidById", paidById)
    formData.set("category", category)
    formData.set("splitType", splitType)
    formData.set(
      "splits",
      JSON.stringify(
        splitPreview.map((s) => ({
          memberId: s.memberId,
          amount: s.amount,
          percentage: (s as any).percentage,
          shares: (s as any).shares,
        }))
      )
    )

    const result = await addExpenseAction(formData)

    if (result.success) {
      setIsOpen(false)
      resetForm()
      router.refresh()
    } else {
      alert(result.error)
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setDescription("")
    setAmount("")
    setCurrency(group.currency)
    setPaidById(group.members[0]?.id || "")
    setCategory("other")
    setSplitType("EQUAL")
    setSelectedMembers(group.members.map((m) => m.id))
    setCustomSplits({})
  }

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId))
    } else {
      setSelectedMembers([...selectedMembers, memberId])
    }
  }

  return (
    <>
      <button className="btn btn--primary" onClick={() => setIsOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Expense
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Add Expense</h2>
              <button className="modal__close" onClick={() => setIsOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                {/* Description */}
                <div className="form__group">
                  <label className="form__label">Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="What was this expense for?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Amount and Currency */}
                <div className="form__row">
                  <div className="form__group" style={{ flex: 2 }}>
                    <label className="form__label">Amount</label>
                    <div className="input-group">
                      <span className="input-group__prefix">
                        {currencies.find((c) => c.code === currency)?.symbol || currency}
                      </span>
                      <input
                        type="number"
                        className="input"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form__group" style={{ flex: 1 }}>
                    <label className="form__label">Currency</label>
                    <select
                      className="select"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* FX Warning */}
                {isForeignCurrency && (
                  <div className="fx-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      This expense is in {currency} but your group uses {group.currency}.
                      FX fees will be calculated when settling.
                    </span>
                  </div>
                )}

                {/* Paid By and Category */}
                <div className="form__row">
                  <div className="form__group" style={{ flex: 1 }}>
                    <label className="form__label">Paid by</label>
                    <select
                      className="select"
                      value={paidById}
                      onChange={(e) => setPaidById(e.target.value)}
                    >
                      {group.members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form__group" style={{ flex: 1 }}>
                    <label className="form__label">Category</label>
                    <select
                      className="select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Split Type */}
                <div className="form__group">
                  <label className="form__label">Split</label>
                  <div className="split-type-tabs">
                    {(
                      [
                        { value: "EQUAL", label: "Equal" },
                        { value: "EXACT", label: "Exact amounts" },
                        { value: "PERCENTAGE", label: "Percentages" },
                        { value: "SHARES", label: "Shares" },
                      ] as const
                    ).map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        className={`split-type-tab ${splitType === type.value ? "split-type-tab--active" : ""}`}
                        onClick={() => setSplitType(type.value)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Member Selection */}
                <div className="form__group">
                  <label className="form__label">Split between</label>
                  <div className="member-select">
                    {group.members.map((member) => (
                      <div key={member.id} className="member-select__item">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMember(member.id)}
                          />
                          <span className="member-select__name">{member.name}</span>
                        </label>

                        {/* Custom amount inputs for non-equal splits */}
                        {selectedMembers.includes(member.id) && splitType !== "EQUAL" && (
                          <div className="member-select__input">
                            {splitType === "EXACT" && (
                              <input
                                type="number"
                                className="input input--sm"
                                placeholder="0.00"
                                step="0.01"
                                value={customSplits[member.id] || ""}
                                onChange={(e) =>
                                  setCustomSplits({ ...customSplits, [member.id]: e.target.value })
                                }
                              />
                            )}
                            {splitType === "PERCENTAGE" && (
                              <div className="input-group input-group--sm">
                                <input
                                  type="number"
                                  className="input input--sm"
                                  placeholder="0"
                                  min="0"
                                  max="100"
                                  value={customSplits[member.id] || ""}
                                  onChange={(e) =>
                                    setCustomSplits({ ...customSplits, [member.id]: e.target.value })
                                  }
                                />
                                <span className="input-group__suffix">%</span>
                              </div>
                            )}
                            {splitType === "SHARES" && (
                              <div className="input-group input-group--sm">
                                <input
                                  type="number"
                                  className="input input--sm"
                                  placeholder="1"
                                  min="1"
                                  value={customSplits[member.id] || "1"}
                                  onChange={(e) =>
                                    setCustomSplits({ ...customSplits, [member.id]: e.target.value })
                                  }
                                />
                                <span className="input-group__suffix">shares</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Split Preview */}
                {splitPreview.length > 0 && totalAmount > 0 && (
                  <div className="split-preview">
                    <div className="split-preview__header">
                      <span>Split Preview</span>
                      {!isBalanced && (
                        <span className="split-preview__warning">
                          Doesn't add up! {currency} {splitTotal.toFixed(2)} / {totalAmount.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="split-preview__list">
                      {splitPreview.map((split) => (
                        <div key={split.memberId} className="split-preview__item">
                          <span>{split.name}</span>
                          <span>
                            {currencies.find((c) => c.code === currency)?.symbol}
                            {split.amount.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal__footer">
                <button type="button" className="btn btn--secondary" onClick={() => setIsOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={isLoading || (!isBalanced && splitType !== "EQUAL")}
                >
                  {isLoading ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
