"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { Category, SyncStatus } from "@/generated/prisma/client"

interface SerializedAccount {
  id: string
  displayName: string
  bankConnection: {
    institutionName: string
    lastSyncedAt: Date | null
    syncStatus: SyncStatus
  }
}

interface Props {
  categories: Category[]
  accounts: SerializedAccount[]
}

export function TransactionFilters({ categories, accounts }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="card card--compact">
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "flex-end"
      }}>
        <div className="form-group" style={{ minWidth: 200 }}>
          <label className="label">Category</label>
          <select
            className="select"
            value={searchParams.get("category") ?? ""}
            onChange={(e) => updateFilter("category", e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: 200 }}>
          <label className="label">Account</label>
          <select
            className="select"
            value={searchParams.get("account") ?? ""}
            onChange={(e) => updateFilter("account", e.target.value)}
          >
            <option value="">All accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.bankConnection.institutionName} - {acc.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="label">From</label>
          <input
            type="date"
            className="input"
            value={searchParams.get("startDate") ?? ""}
            onChange={(e) => updateFilter("startDate", e.target.value)}
          />
        </div>

        <div className="form-group" style={{ minWidth: 150 }}>
          <label className="label">To</label>
          <input
            type="date"
            className="input"
            value={searchParams.get("endDate") ?? ""}
            onChange={(e) => updateFilter("endDate", e.target.value)}
          />
        </div>

        {(searchParams.get("category") ||
          searchParams.get("account") ||
          searchParams.get("startDate") ||
          searchParams.get("endDate")) && (
          <button
            className="btn btn--ghost"
            onClick={() => router.push("/dashboard/transactions")}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
