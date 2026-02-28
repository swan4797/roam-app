"use client"

import { memo, useId } from "react"

interface Props {
  label: string
  value: number
  min: number
  max: number
  step?: number
  formatValue: (value: number) => string
  onChange: (value: number) => void
  ticks?: number[]
  formatTick?: (value: number) => string
}

export const RangeSlider = memo(function RangeSlider({
  label,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onChange,
  ticks,
  formatTick,
}: Props) {
  const id = useId()
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="range-slider">
      <div className="range-slider__header">
        <label htmlFor={id} className="range-slider__label">
          {label}
        </label>
        <span className="range-slider__value">{formatValue(value)}</span>
      </div>

      <div className="range-slider__track">
        <div
          className="range-slider__fill"
          style={{ width: `${percentage}%` }}
        />
        <input
          id={id}
          type="range"
          className="range-slider__input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={formatValue(value)}
        />
      </div>

      {ticks && (
        <div className="range-slider__ticks">
          {ticks.map((tick) => (
            <span key={tick}>
              {formatTick ? formatTick(tick) : tick}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})
