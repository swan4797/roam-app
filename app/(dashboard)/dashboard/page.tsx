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
      {/* Page Header */}
      <div className="page-header-section">
        <div className="page-header-section__left">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <div className="page-header-section__right">
          <div className="date-range-picker">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>This month</span>
          </div>
        </div>
      </div>

      {/* FX Alerts - show warnings and tips */}
      <FxAlerts
        weeklyFees={weeklyFx.weeklyFees}
        topMerchant={topMerchant}
      />

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Featured FX Card - spans 5 cols */}
        <div className="bento-grid__item bento-grid__item--span-5">
          <FxHeroCard
            totalFxFees={fxStats.totalFxFees}
            wiseSavings={fxStats.wiseSavings}
            transactionCount={fxStats.transactionCount}
            topCurrency={fxStats.topCurrency}
            weeklyFees={weeklyFx.weeklyFees}
            monthlyChange={fxStats.monthlyChange}
          />
        </div>

        {/* Spending by Category - spans 4 cols */}
        <div className="bento-grid__item bento-grid__item--span-4">
          <SpendingByCategory data={spendingByCategory} />
        </div>

        {/* Currency Overview - spans 3 cols */}
        <div className="bento-grid__item bento-grid__item--span-3">
          <CurrencyOverview
            currencies={currencies}
            baseCurrency={stats.baseCurrency ?? "GBP"}
          />
        </div>

        {/* Recent FX Transactions - spans 12 cols (full width) */}
        <div className="bento-grid__item bento-grid__item--span-12">
          <FxFeeSummary
            totals={{ totalFxFees: fxStats.totalFxFees, totalWiseSavings: fxStats.wiseSavings }}
            topTransactions={topFxTransactions}
          />
        </div>
      </div>
    </div>
  )
}
