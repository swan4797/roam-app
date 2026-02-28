import { getUserDashboardStats } from "@/lib/dal/user"
import {
  getSpendingByCategory,
  getFxTransactions,
  getWeeklyFxFees,
  getCurrencyBreakdown,
  getFxStats,
} from "@/lib/dal/transactions"
import { FxHeroCard } from "@/components/dashboard/fx-hero-card"
import { FxAlerts } from "@/components/dashboard/fx-alerts"
import { CurrencyOverview } from "@/components/dashboard/currency-overview"
import { SpendingByCategory } from "@/components/dashboard/spending-by-category"
import { FxFeeSummary } from "@/components/dashboard/fx-fee-summary"

export default async function DashboardPage() {
  // Parallel data fetching - all DAL calls run concurrently
  const [stats, fxStats, weeklyFx, currencies, spendingByCategory, topFxTransactions] =
    await Promise.all([
      getUserDashboardStats(),
      getFxStats(),
      getWeeklyFxFees(),
      getCurrencyBreakdown(),
      getSpendingByCategory(),
      getFxTransactions({ limit: 5 }),
    ])

  // Find top merchant by FX fees
  const topMerchant = topFxTransactions[0]
    ? {
        name: topFxTransactions[0].normalisedMerchant ?? topFxTransactions[0].merchantName ?? "Unknown",
        fees: topFxTransactions[0].estimatedFxFee ?? 0,
      }
    : undefined

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">FX Fee Tracker</h1>
          <p className="page-subtitle">
            See how much you&apos;re paying in hidden foreign exchange fees
          </p>
        </div>
      </div>

      {/* FX Alerts - show warnings and tips */}
      <FxAlerts
        weeklyFees={weeklyFx.weeklyFees}
        topMerchant={topMerchant}
      />

      {/* Hero FX Card - prominent fee display */}
      <div style={{ marginTop: "1.5rem" }}>
        <FxHeroCard
          totalFxFees={fxStats.totalFxFees}
          wiseSavings={fxStats.wiseSavings}
          transactionCount={fxStats.transactionCount}
          topCurrency={fxStats.topCurrency}
          weeklyFees={weeklyFx.weeklyFees}
          monthlyChange={fxStats.monthlyChange}
        />
      </div>

      {/* Multi-currency overview */}
      <div style={{ marginTop: "2rem" }}>
        <CurrencyOverview
          currencies={currencies}
          baseCurrency={stats.baseCurrency ?? "GBP"}
        />
      </div>

      {/* Two column layout for spending and top FX transactions */}
      <div className="grid gap-8 lg:grid-cols-2" style={{ marginTop: "2rem" }}>
        <SpendingByCategory data={spendingByCategory} />
        <FxFeeSummary
          totals={{ totalFxFees: fxStats.totalFxFees, totalWiseSavings: fxStats.wiseSavings }}
          topTransactions={topFxTransactions}
        />
      </div>
    </div>
  )
}
