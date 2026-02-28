"use client"

import { useMemo } from "react"
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
import type { PerformanceDataPoint } from "@/types/portfolio"

interface Props {
  data: PerformanceDataPoint[]
  showInvested?: boolean
}

export function PortfolioPerformanceChart({
  data,
  showInvested = true,
}: Props) {
  const formattedData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      displayDate: new Date(point.date + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
    }))
  }, [data])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ name: string; value: number; color: string }>
    label?: string
  }) => {
    if (!active || !payload?.length) return null

    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  // Show empty state if no data
  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Portfolio Performance</h3>
          <p className="card__subtitle">Value over time</p>
        </div>
        <div className="card__body card__body--empty">
          <p>No performance data available yet.</p>
          <p className="text-muted">
            Add investments to see your portfolio performance over time.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Portfolio Performance</h3>
          <p className="card__subtitle">Value over time</p>
        </div>
        <div className="chart-legend">
          <span className="chart-legend__item chart-legend__item--primary">
            Current Value
          </span>
          {showInvested && (
            <span className="chart-legend__item chart-legend__item--muted">
              Amount Invested
            </span>
          )}
        </div>
      </div>
      <div className="card__body" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#colorValue)"
              name="Current Value"
            />
            {showInvested && (
              <Line
                type="monotone"
                dataKey="invested"
                stroke="#9CA3AF"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Amount Invested"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
