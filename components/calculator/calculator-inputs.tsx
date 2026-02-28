"use client"

import { RangeSlider } from "./range-slider"
import {
  DISTRIBUTION_OPTIONS,
  type CalculatorInputValues,
  type DistributionFrequency,
} from "@/types/calculator"
import { formatCurrency } from "@/lib/utils/calculator"

interface Props {
  values: CalculatorInputValues
  onChange: <K extends keyof CalculatorInputValues>(
    field: K,
    value: CalculatorInputValues[K]
  ) => void
}

export function CalculatorInputs({ values, onChange }: Props) {
  return (
    <div className="calculator-inputs">
      <div className="calculator-inputs__header">
        <h2 className="calculator-inputs__title">Investment Parameters</h2>
        <p className="calculator-inputs__subtitle">
          Adjust the values to see projected returns
        </p>
      </div>

      <div className="form">
        <div className="form-group">
          <label htmlFor="investmentAmount" className="label">
            Investment Amount
          </label>
          <div className="input-group">
            <span className="input-group__prefix">$</span>
            <input
              id="investmentAmount"
              type="number"
              className="input"
              value={values.investmentAmount}
              onChange={(e) =>
                onChange("investmentAmount", Number(e.target.value) || 0)
              }
              min={1000}
              max={10000000}
              step={1000}
            />
          </div>
          <span className="help-text">Minimum investment: $1,000</span>
        </div>

        <RangeSlider
          label="Expected Annual Return"
          value={values.annualReturnRate}
          min={0}
          max={20}
          step={0.5}
          formatValue={(v) => `${v.toFixed(1)}%`}
          onChange={(v) => onChange("annualReturnRate", v)}
          ticks={[0, 5, 10, 15, 20]}
          formatTick={(v) => `${v}%`}
        />

        <RangeSlider
          label="Investment Duration"
          value={values.investmentDuration}
          min={1}
          max={30}
          step={1}
          formatValue={(v) => `${v} ${v === 1 ? "year" : "years"}`}
          onChange={(v) => onChange("investmentDuration", v)}
          ticks={[1, 10, 20, 30]}
          formatTick={(v) => `${v}y`}
        />

        <div className="form-group">
          <label htmlFor="distributionFrequency" className="label">
            Distribution Frequency
          </label>
          <select
            id="distributionFrequency"
            className="select"
            value={values.distributionFrequency}
            onChange={(e) =>
              onChange(
                "distributionFrequency",
                e.target.value as DistributionFrequency
              )
            }
          >
            {DISTRIBUTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="help-text">
            How often distributions are paid
          </span>
        </div>

        <div className="form-group">
          <label className="label">Reinvest Distributions (DRIP)</label>
          <div className="radio-group radio-group--inline">
            <label className="radio">
              <input
                type="radio"
                name="reinvest"
                className="radio__input"
                checked={values.reinvestDistributions}
                onChange={() => onChange("reinvestDistributions", true)}
              />
              <span className="radio__circle" />
              <span className="radio__label">Yes</span>
            </label>
            <label className="radio">
              <input
                type="radio"
                name="reinvest"
                className="radio__input"
                checked={!values.reinvestDistributions}
                onChange={() => onChange("reinvestDistributions", false)}
              />
              <span className="radio__circle" />
              <span className="radio__label">No</span>
            </label>
          </div>
          <span className="help-text">
            {values.reinvestDistributions
              ? "Distributions will be automatically reinvested"
              : "Distributions will be paid out as cash"}
          </span>
        </div>
      </div>

      <div className="calculator-inputs__summary">
        <div className="calculator-inputs__summary-row">
          <span>Initial Investment</span>
          <strong>{formatCurrency(values.investmentAmount)}</strong>
        </div>
        <div className="calculator-inputs__summary-row">
          <span>Expected Return</span>
          <strong>{values.annualReturnRate}% annually</strong>
        </div>
        <div className="calculator-inputs__summary-row">
          <span>Time Horizon</span>
          <strong>
            {values.investmentDuration}{" "}
            {values.investmentDuration === 1 ? "year" : "years"}
          </strong>
        </div>
      </div>
    </div>
  )
}
