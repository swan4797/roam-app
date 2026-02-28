"use client"

import { useState, useMemo, useCallback, Suspense, lazy } from "react"
import { CalculatorInputs } from "./calculator-inputs"
import { SummaryStats } from "./summary-stats"
import { YearBreakdownTable } from "./year-breakdown-table"
import { calculateProjection } from "@/lib/utils/calculator"
import {
  DEFAULT_INPUTS,
  type CalculatorInputValues,
} from "@/types/calculator"

// Lazy load the chart component (heaviest dependency - recharts)
const ProjectionChart = lazy(() =>
  import("./projection-chart").then((mod) => ({ default: mod.ProjectionChart }))
)

// Loading skeleton for chart
function ChartSkeleton() {
  return (
    <div className="card">
      <div className="card__header">
        <div>
          <div className="skeleton" style={{ width: 150, height: 20 }} />
          <div className="skeleton" style={{ width: 200, height: 16, marginTop: 8 }} />
        </div>
      </div>
      <div className="card__body" style={{ height: 350 }}>
        <div className="skeleton" style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  )
}

export function InvestmentCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputValues>(DEFAULT_INPUTS)
  const [showComparison, setShowComparison] = useState(false)

  const handleChange = useCallback(<K extends keyof CalculatorInputValues>(
    field: K,
    value: CalculatorInputValues[K]
  ) => {
    setInputs((prev) => ({ ...prev, [field]: value }))
  }, [])

  const projection = useMemo(() => calculateProjection(inputs), [inputs])

  return (
    <div className="calculator">
      <aside className="calculator__sidebar">
        <CalculatorInputs values={inputs} onChange={handleChange} />
      </aside>

      <main className="calculator__main">
        <div className="calculator__controls">
          <label className="toggle">
            <input
              type="checkbox"
              className="toggle__input"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
            />
            <span className="toggle__track">
              <span className="toggle__thumb" />
            </span>
            <span className="toggle__label">Compare with/without reinvestment</span>
          </label>
        </div>

        <SummaryStats
          summary={projection.summary}
          comparison={projection.comparisonSummary}
          showComparison={showComparison}
        />

        <Suspense fallback={<ChartSkeleton />}>
          <ProjectionChart
            data={projection.chartData}
            showComparison={showComparison}
          />
        </Suspense>

        <YearBreakdownTable
          data={projection.yearlyBreakdown}
          reinvestMode={inputs.reinvestDistributions}
        />
      </main>
    </div>
  )
}
