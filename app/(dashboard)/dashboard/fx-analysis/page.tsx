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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">FX Fee Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          See how much you&apos;re paying in foreign exchange fees
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Estimated FX Fees This Month
          </h2>
          <p className="mt-2 text-3xl font-bold text-red-600">
            £{fxTotals.totalFxFees.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Approximately what your banks charged above mid-market rates
          </p>
        </div>

        <WiseComparison totalSavings={fxTotals.totalWiseSavings} />
      </div>

      <FxAnalysisChart transactions={fxTransactions} />

      <FxTransactionTable transactions={fxTransactions} />
    </div>
  )
}
