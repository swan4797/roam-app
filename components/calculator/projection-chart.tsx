"use client"

import { memo, useCallback } from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Line,
} from "recharts"
import type { ProjectionDataPoint } from "@/types/calculator"
import { formatCurrency } from "@/lib/utils/calculator"

interface Props {
  data: ProjectionDataPoint[]
  showComparison: boolean
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

// Memoized tooltip component
const ChartTooltip = memo(function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="chart-tooltip__row">
          <span
            className="chart-tooltip__dot"
            style={{ backgroundColor: entry.color }}
          />
          <span className="chart-tooltip__name">{entry.name}:</span>
          <span className="chart-tooltip__value">
            {formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  )
})

// Format Y-axis values (defined outside component to avoid recreation)
const formatYAxis = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value}`
}

export const ProjectionChart = memo(function ProjectionChart({ data, showComparison }: Props) {

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Projected Growth</h3>
          <p className="card__subtitle">Investment value over time</p>
        </div>
        <div className="chart-legend">
          {showComparison ? (
            <>
              <span className="chart-legend__item">
                <span
                  className="chart-legend__dot"
                  style={{ backgroundColor: "#10B981" }}
                />
                With Reinvestment
              </span>
              <span className="chart-legend__item">
                <span
                  className="chart-legend__dot"
                  style={{ backgroundColor: "#F97316" }}
                />
                Without Reinvestment
              </span>
            </>
          ) : (
            <>
              <span className="chart-legend__item">
                <span
                  className="chart-legend__dot"
                  style={{ backgroundColor: "#F97316" }}
                />
                Portfolio Value
              </span>
            </>
          )}
          <span className="chart-legend__item">
            <span
              className="chart-legend__dot chart-legend__dot--dashed"
              style={{ backgroundColor: "#9CA3AF" }}
            />
            Amount Invested
          </span>
        </div>
      </div>

      <div className="card__body" style={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorReinvest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
              width={60}
            />
            <Tooltip content={<ChartTooltip />} />

            {showComparison ? (
              <>
                <Area
                  type="monotone"
                  dataKey="withReinvestment"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#colorReinvest)"
                  name="With Reinvestment"
                />
                <Area
                  type="monotone"
                  dataKey="withoutReinvestment"
                  stroke="#F97316"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  name="Without Reinvestment"
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey="value"
                stroke="#F97316"
                strokeWidth={2}
                fill="url(#colorValue)"
                name="Portfolio Value"
              />
            )}

            <Line
              type="monotone"
              dataKey="invested"
              stroke="#9CA3AF"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Amount Invested"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
