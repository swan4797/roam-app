"use client"

import { deleteBankConnectionAction } from "@/actions/bank-connections"
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

          {connection.syncError && (
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
