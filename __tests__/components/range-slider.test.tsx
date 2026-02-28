import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { RangeSlider } from "@/components/calculator/range-slider"

describe("RangeSlider Component", () => {
  const defaultProps = {
    label: "Investment Amount",
    value: 50000,
    min: 1000,
    max: 1000000,
    formatValue: (v: number) => `$${v.toLocaleString()}`,
    onChange: vi.fn(),
  }

  it("renders label correctly", () => {
    render(<RangeSlider {...defaultProps} />)
    expect(screen.getByText("Investment Amount")).toBeInTheDocument()
  })

  it("displays formatted value", () => {
    render(<RangeSlider {...defaultProps} />)
    expect(screen.getByText("$50,000")).toBeInTheDocument()
  })

  it("renders range input with correct attributes", () => {
    render(<RangeSlider {...defaultProps} />)
    const input = screen.getByRole("slider")

    expect(input).toHaveAttribute("min", "1000")
    expect(input).toHaveAttribute("max", "1000000")
    expect(input).toHaveValue("50000")
  })

  it("calls onChange when value changes", () => {
    const onChange = vi.fn()
    render(<RangeSlider {...defaultProps} onChange={onChange} />)

    const input = screen.getByRole("slider")
    fireEvent.change(input, { target: { value: "75000" } })

    expect(onChange).toHaveBeenCalledWith(75000)
  })

  it("renders ticks when provided", () => {
    const ticks = [1000, 500000, 1000000]
    const formatTick = (v: number) => `$${v / 1000}K`

    render(
      <RangeSlider {...defaultProps} ticks={ticks} formatTick={formatTick} />
    )

    expect(screen.getByText("$1K")).toBeInTheDocument()
    expect(screen.getByText("$500K")).toBeInTheDocument()
    expect(screen.getByText("$1000K")).toBeInTheDocument()
  })

  it("applies step attribute correctly", () => {
    render(<RangeSlider {...defaultProps} step={1000} />)
    const input = screen.getByRole("slider")

    expect(input).toHaveAttribute("step", "1000")
  })

  it("has proper accessibility attributes", () => {
    render(<RangeSlider {...defaultProps} />)
    const input = screen.getByRole("slider")

    expect(input).toHaveAttribute("aria-valuenow", "50000")
    expect(input).toHaveAttribute("aria-valuemin", "1000")
    expect(input).toHaveAttribute("aria-valuemax", "1000000")
    expect(input).toHaveAttribute("aria-valuetext", "$50,000")
  })

  it("label is associated with input via htmlFor/id", () => {
    render(<RangeSlider {...defaultProps} />)
    const label = screen.getByText("Investment Amount")
    const input = screen.getByRole("slider")

    // The label's "for" should match the input's "id"
    expect(label).toHaveAttribute("for", input.id)
  })
})
