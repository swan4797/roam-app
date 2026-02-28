"use client"

import { useTransition } from "react"
import { createInvoiceAction } from "@/actions/invoices"

interface Props {
  onSuccess?: () => void
}

export function InvoiceForm({ onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createInvoiceAction(formData)
      if (!result.error && onSuccess) {
        onSuccess()
      }
    })
  }

  // Get today's date for default values
  const today = new Date().toISOString().split("T")[0]
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0]

  return (
    <form action={handleSubmit} className="form">
      <div className="form-group">
        <label className="label label--required">Client Name</label>
        <input
          type="text"
          name="clientName"
          className="input"
          placeholder="e.g., Acme Corp"
          required
        />
      </div>

      <div className="form-group">
        <label className="label">Description</label>
        <textarea
          name="description"
          className="textarea"
          placeholder="e.g., Website development - Phase 1"
          rows={2}
        />
      </div>

      <div className="form__row">
        <div className="form-group">
          <label className="label label--required">Amount</label>
          <div className="input-group">
            <input
              type="number"
              name="amount"
              className="input"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label label--required">Currency</label>
          <select name="currency" className="select" defaultValue="GBP" required>
            <option value="GBP">GBP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="label label--required">Amount in GBP</label>
        <input
          type="number"
          name="amountInBase"
          className="input"
          placeholder="Converted amount"
          step="0.01"
          min="0"
          required
        />
        <span className="help-text">
          For tracking purposes. Use current exchange rate.
        </span>
      </div>

      <div className="form__row">
        <div className="form-group">
          <label className="label label--required">Issue Date</label>
          <input
            type="date"
            name="issuedAt"
            className="input"
            defaultValue={today}
            required
          />
        </div>

        <div className="form-group">
          <label className="label label--required">Due Date</label>
          <input
            type="date"
            name="dueAt"
            className="input"
            defaultValue={inThirtyDays}
            required
          />
        </div>
      </div>

      <div className="form__actions">
        <button
          type="submit"
          className={`btn btn--primary btn--block ${isPending ? "is-loading" : ""}`}
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create Invoice"}
        </button>
      </div>
    </form>
  )
}
