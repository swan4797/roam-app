"use client"

import Link from "next/link"
import { deleteInvoiceAction } from "@/actions/invoices"
import type { InvoiceStatus } from "@/generated/prisma/client"

interface SerializedInvoice {
  id: string
  clientName: string
  description: string | null
  amount: number
  currency: string
  amountInBase: number
  issuedAt: Date
  dueAt: Date
  status: InvoiceStatus
  paidAt: Date | null
  payments: Array<{
    id: string
    amount: number
    confirmedAt: Date | null
    transaction: {
      id: string
      amount: number
      currency: string
      transactionDate: Date
      description: string
    } | null
  }>
}

interface Props {
  invoices: SerializedInvoice[]
}

const statusStyles: Record<InvoiceStatus, { class: string; label: string }> = {
  UNPAID: { class: "status-badge--pending", label: "Unpaid" },
  PARTIALLY_PAID: { class: "status-badge--in-progress", label: "Partial" },
  PAID: { class: "status-badge--completed", label: "Paid" },
  OVERDUE: { class: "status-badge--failed", label: "Overdue" },
}

export function InvoiceList({ invoices }: Props) {
  const formatCurrency = (amount: number, currency: string) => {
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

  if (invoices.length === 0) {
    return (
      <div className="card">
        <div className="table__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 48, height: 48 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p>No invoices yet</p>
          <p style={{ fontSize: "0.75rem", marginTop: 8, color: "#6b7280" }}>
            Create an invoice to start tracking payments
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead className="table__header">
          <tr>
            <th className="table__head-cell">Client</th>
            <th className="table__head-cell">Amount</th>
            <th className="table__head-cell">Issued</th>
            <th className="table__head-cell">Due</th>
            <th className="table__head-cell">Status</th>
            <th className="table__head-cell">Payments</th>
            <th className="table__head-cell table__head-cell--right">Actions</th>
          </tr>
        </thead>
        <tbody className="table__body">
          {invoices.map((invoice) => {
            const status = statusStyles[invoice.status]
            const paidAmount = invoice.payments
              .filter((p): p is typeof p & { confirmedAt: Date } => p.confirmedAt !== null)
              .reduce((sum: number, p) => sum + p.amount, 0)

            return (
              <tr key={invoice.id} className="table__row">
                <td className="table__cell">
                  <div style={{ fontWeight: 500 }}>{invoice.clientName}</div>
                  {invoice.description && (
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: 2 }}>
                      {invoice.description.slice(0, 50)}
                    </div>
                  )}
                </td>
                <td className="table__cell">
                  <div style={{ fontWeight: 600 }}>
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </div>
                  {invoice.currency !== "GBP" && (
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      ≈ {formatCurrency(invoice.amountInBase, "GBP")}
                    </div>
                  )}
                </td>
                <td className="table__cell table__cell--nowrap">
                  {formatDate(invoice.issuedAt)}
                </td>
                <td className="table__cell table__cell--nowrap">
                  {formatDate(invoice.dueAt)}
                </td>
                <td className="table__cell">
                  <span className={`status-badge ${status.class}`}>
                    {status.label}
                  </span>
                </td>
                <td className="table__cell">
                  {invoice.payments.length > 0 ? (
                    <div>
                      <div style={{ fontSize: "0.875rem" }}>
                        {formatCurrency(paidAmount, invoice.currency)} received
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                        {invoice.payments.length} payment{invoice.payments.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>No payments</span>
                  )}
                </td>
                <td className="table__cell table__cell--right">
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="btn btn--ghost btn--sm"
                    >
                      View
                    </Link>
                    <form action={deleteInvoiceAction}>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        type="submit"
                        className="btn btn--ghost btn--sm"
                        style={{ color: "#EF4444" }}
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
