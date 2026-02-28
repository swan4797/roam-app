import { InvestmentCalculator } from "@/components/calculator"

export const metadata = {
  title: "Investment Calculator | Roam",
  description: "Project your potential returns on real estate investments",
}

export default function CalculatorPage() {
  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Investment Calculator</h1>
        <p className="page__subtitle">
          Project your potential returns on real estate investments
        </p>
      </div>

      <InvestmentCalculator />
    </div>
  )
}
