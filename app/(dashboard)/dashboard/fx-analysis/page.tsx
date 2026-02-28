import { getTotalFxFees, getFxTransactions } from "@/lib/dal/transactions"
import { FxAnalysisChart } from "@/components/dashboard/fx-analysis-chart"
import { FxTransactionTable } from "@/components/dashboard/fx-transaction-table"
import { WiseComparison } from "@/components/dashboard/wise-comparison"

export default async function FxAnalysisPage() {
  const [fxTotals, fxTransactions] = await Promise.all([
    getTotalFxFees(),
    getFxTransactions({ limit: 50 }),
  ])

  return (
    <div className="page-content">
      <div className="page-header-section">
        <div className="page-header-section__title">
          <h1 className="page-title">FX Fee Analysis</h1>
          <p className="page-subtitle">
            See how much you&apos;re paying in foreign exchange fees
          </p>
        </div>
      </div>

      <div className="bento-grid bento-grid--2">
        <div className="bento-card">
          <div className="bento-card__header">
            <h3 className="bento-card__title">Estimated FX Fees</h3>
            <span className="badge badge--muted">This Month</span>
          </div>
          <p className="stat-value stat-value--error">
            £{fxTotals.totalFxFees.toFixed(2)}
          </p>
          <p className="text-muted">
            Approximately what your banks charged above mid-market rates
          </p>
        </div>

        <WiseComparison totalSavings={fxTotals.totalWiseSavings} />
      </div>

      <div className="section-spacing">
        <FxAnalysisChart transactions={fxTransactions} />
      </div>

      <div className="section-spacing">
        <FxTransactionTable transactions={fxTransactions} />
      </div>
    </div>
  )
}
