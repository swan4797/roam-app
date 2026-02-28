import { getBankConnections } from "@/lib/dal/bank-connections"
import { getAccountBalances, getTotalBalance } from "@/lib/dal/accounts"
import { AccountList } from "@/components/dashboard/account-list"
import { BalanceOverview } from "@/components/dashboard/balance-overview"
import { ConnectBankButton } from "@/components/dashboard/connect-bank-button"

export default async function AccountsPage() {
  const [connections, balances, totalBalance] = await Promise.all([
    getBankConnections(),
    getAccountBalances(),
    getTotalBalance(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
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
