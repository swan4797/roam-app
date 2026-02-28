"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { AllocationDataPoint } from "@/types/portfolio"

interface Props {
  data: AllocationDataPoint[]
  showLegend?: boolean
}

export function AssetAllocationChart({ data, showLegend = true }: Props) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: AllocationDataPoint }>
  }) => {
    if (!active || !payload?.length) return null
    const item = payload[0].payload

    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip__label">{item.name}</p>
        <p>{formatCurrency(item.value)}</p>
        <p>{item.percentage.toFixed(1)}%</p>
      </div>
    )
  }

  const renderCustomLabel = (props: {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    percent?: number
  }) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props

    // Handle undefined values
    if (
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      innerRadius === undefined ||
      outerRadius === undefined ||
      percent === undefined
    ) {
      return null
    }

    if (percent < 0.05) return null // Don't show label for small slices

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  // Show empty state if no data
  if (data.length === 0) {
    return (
      <div className="card">
        <div className="card__header">
          <h3 className="card__title">Asset Allocation</h3>
          <p className="card__subtitle">By property type</p>
        </div>
        <div className="card__body card__body--empty">
          <p>No allocation data available yet.</p>
          <p className="text-muted">
            Add investments to see your asset allocation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Asset Allocation</h3>
          <p className="card__subtitle">By property type</p>
        </div>
      </div>
      <div className="card__body">
        <div className="donut-chart-wrapper" style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="donut-chart__center">
            <div className="donut-chart__value">{formatCurrency(total)}</div>
            <div className="donut-chart__label">Total</div>
          </div>
        </div>
        {showLegend && (
          <div className="allocation-legend">
            {data.map((item) => (
              <div key={item.name} className="allocation-legend__item">
                <span
                  className="allocation-legend__dot"
                  style={{ backgroundColor: item.color }}
                />
                <span className="allocation-legend__name">{item.name}</span>
                <span className="allocation-legend__value">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
