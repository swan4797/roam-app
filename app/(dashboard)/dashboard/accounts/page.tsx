import { getBankConnections } from "@/lib/dal/bank-connections"
import { getAccountBalances, getTotalBalance } from "@/lib/dal/accounts"
import { AccountList } from "@/components/dashboard/account-list"
import { BalanceOverview } from "@/components/dashboard/balance-overview"
import { ConnectBankButton } from "@/components/dashboard/connect-bank-button"

interface Props {
  searchParams: Promise<{ error?: string; success?: string; detail?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  config: "Bank connection is not configured. Please contact support.",
  invalid_response: "Invalid response from bank. Please try again.",
  invalid_state: "Security validation failed. Please try again.",
  user_not_found: "User session expired. Please log in again.",
  connection_failed: "Failed to connect to bank. Please try again.",
  access_denied: "Access was denied. Please try again and grant permissions.",
}

export default async function AccountsPage({ searchParams }: Props) {
  const { error, success, detail } = await searchParams
  const [connections, balances, totalBalance] = await Promise.all([
    getBankConnections(),
    getAccountBalances(),
    getTotalBalance(),
  ])

  return (
    <div className="page-content">
      {error && (
        <div className="alert alert--error" style={{ marginBottom: "1.5rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{ERROR_MESSAGES[error] || `Connection error: ${error}`}{detail && ` - ${detail}`}</span>
        </div>
      )}

      {success === "connected" && (
        <div className="alert alert--success" style={{ marginBottom: "1.5rem" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Bank account connected successfully!</span>
        </div>
      )}

      <div className="page-title-row">
        <div>
          <h1 className="page-title">Connected Accounts</h1>
          <p className="page-subtitle">
            Manage your bank connections and view balances
          </p>
        </div>
        <ConnectBankButton />
      </div>

      <BalanceOverview total={totalBalance} balances={balances} />

      <AccountList connections={connections} />
    </div>
  )
}
