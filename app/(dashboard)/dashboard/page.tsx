import { getUserDashboardStats } from "@/lib/dal/user"
import { getSpendingByCategory, getTotalFxFees, getFxTransactions } from "@/lib/dal/transactions"
import { getUnpaidInvoicesTotal } from "@/lib/dal/invoices"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { SpendingByCategory } from "@/components/dashboard/spending-by-category"
import { FxFeeSummary } from "@/components/dashboard/fx-fee-summary"
import { InvoiceSummary } from "@/components/dashboard/invoice-summary"

export default async function DashboardPage() {
  // Parallel data fetching - all DAL calls run concurrently
  const [stats, spendingByCategory, fxTotals, topFxTransactions, unpaidInvoices] =
    await Promise.all([
      getUserDashboardStats(),
      getSpendingByCategory(),
      getTotalFxFees(),
      getFxTransactions({ limit: 5 }),
      getUnpaidInvoicesTotal(),
    ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your financial overview for the last 30 days
        </p>
      </div>

      <DashboardOverview stats={stats} />

      <div className="grid gap-8 lg:grid-cols-2">
        <SpendingByCategory data={spendingByCategory} />
        <FxFeeSummary
          totals={fxTotals}
          topTransactions={topFxTransactions}
        />
      </div>

      <InvoiceSummary unpaidTotal={unpaidInvoices} />
    </div>
  )
}
