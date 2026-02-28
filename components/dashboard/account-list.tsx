"use client"

import { useState } from "react"
import { deleteBankConnectionAction, syncTransactionsAction } from "@/actions/bank-connections"
import type { SyncStatus } from "@/generated/prisma/client"

interface BankConnection {
  id: string
  institutionId: string
  institutionName: string
  accessTokenExpiresAt: Date
  consentExpiresAt: Date | null
  lastSyncedAt: Date | null
  syncStatus: SyncStatus
  syncError: string | null
  createdAt: Date
  bankAccounts: {
    id: string
    displayName: string
    accountType: string
    currency: string
    balance: number | null
  }[]
}

interface Props {
  connections: BankConnection[]
}

export function AccountList({ connections }: Props) {
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{ id: string; success: boolean; message: string } | null>(null)

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId)
    setSyncResult(null)

    const formData = new FormData()
    formData.set("connectionId", connectionId)

    const result = await syncTransactionsAction(formData)
    setSyncResult({ id: connectionId, ...result })
    setSyncingId(null)
  }

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
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date))
  }

  const getSyncStatusBadge = (status: SyncStatus) => {
    const styles: Record<SyncStatus, string> = {
      PENDING: "badge badge--warning badge--dot",
      SYNCING: "badge badge--info badge--dot",
      COMPLETED: "badge badge--success badge--dot",
      FAILED: "badge badge--error badge--dot",
    }
    const labels: Record<SyncStatus, string> = {
      PENDING: "Pending",
      SYNCING: "Syncing",
      COMPLETED: "Synced",
      FAILED: "Failed",
    }
    return <span className={styles[status]}>{labels[status]}</span>
  }

  if (connections.length === 0) {
    return (
      <div className="card">
        <div className="table__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <p>No bank accounts connected yet</p>
          <p style={{ fontSize: "0.75rem", marginTop: 8 }}>
            Connect your bank to start tracking transactions
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {connections.map((connection) => (
        <div key={connection.id} className="card">
          <div className="card__header">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.25rem",
                  color: "#374151"
                }}
              >
                {connection.institutionName[0]}
              </div>
              <div>
                <h3 className="card__title">{connection.institutionName}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: 4 }}>
                  {getSyncStatusBadge(connection.syncStatus)}
                  {connection.lastSyncedAt && (
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Last synced: {formatDate(connection.lastSyncedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => handleSync(connection.id)}
                disabled={syncingId === connection.id}
              >
                {syncingId === connection.id ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Sync
                  </>
                )}
              </button>
              <form action={deleteBankConnectionAction}>
                <input type="hidden" name="id" value={connection.id} />
                <button
                  type="submit"
                  className="btn btn--ghost btn--sm"
                  style={{ color: "#EF4444" }}
                >
                  Disconnect
                </button>
              </form>
            </div>
          </div>

          <div className="card__body">
            <div className="wallets-row">
              {connection.bankAccounts.map((account) => (
                <div key={account.id} className="wallet-card">
                  <div className="wallet-card__content">
                    <div className="wallet-card__currency">
                      <span>{account.currency}</span>
                    </div>
                    <div className="wallet-card__balance">
                      {account.balance !== null
                        ? formatCurrency(account.balance, account.currency)
                        : "—"}
                    </div>
                    <div className="wallet-card__limit">{account.displayName}</div>
                  </div>
                  <span className="wallet-card__status wallet-card__status--active">
                    {account.accountType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {syncResult?.id === connection.id && (
            <div className="card__footer" style={{ paddingTop: "1rem" }}>
              <div className={`alert ${syncResult.success ? "alert--success" : "alert--error"}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {syncResult.success ? (
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </>
                  )}
                </svg>
                <span>{syncResult.message}</span>
              </div>
            </div>
          )}

          {connection.syncError && !syncResult && (
            <div className="card__footer">
              <div style={{
                padding: "0.75rem",
                backgroundColor: "#FEE2E2",
                borderRadius: 8,
                fontSize: "0.875rem",
                color: "#DC2626"
              }}>
                Sync error: {connection.syncError}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
