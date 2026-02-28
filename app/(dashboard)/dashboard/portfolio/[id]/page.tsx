import { notFound } from "next/navigation"
import Link from "next/link"
import { getInvestment, getDistributions } from "@/lib/dal/portfolio"
import { PropertyCard, DistributionHistory } from "@/components/portfolio"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  try {
    const investment = await getInvestment(id)
    return {
      title: `${investment.property.name} | Portfolio | Roam`,
      description: `Investment details for ${investment.property.name}`,
    }
  } catch {
    return {
      title: "Investment Not Found | Roam",
    }
  }
}

export default async function InvestmentDetailPage({ params }: Props) {
  const { id } = await params
  let investment
  try {
    investment = await getInvestment(id)
  } catch {
    notFound()
  }

  const distributions = await getDistributions({ investmentId: id, limit: 20 })

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)

  const formatPercent = (value: number) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`

  const totalGain =
    investment.currentValue -
    investment.investedAmount +
    investment.totalDistributions

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link href="/dashboard/portfolio" className="breadcrumb__link">
          Portfolio
        </Link>
        <span className="breadcrumb__separator">/</span>
        <span className="breadcrumb__current">{investment.property.name}</span>
      </nav>

      {/* Property Header */}
      <div className="investment-header">
        <PropertyCard
          property={investment.property}
          investedAmount={investment.investedAmount}
          currentValue={investment.currentValue}
        />

        {/* Investment Stats */}
        <div className="stats-grid stats-grid--compact">
          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Amount Invested</span>
            </div>
            <div className="stat-card__value">
              {formatCurrency(investment.investedAmount)}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Current Value</span>
            </div>
            <div className="stat-card__value">
              {formatCurrency(investment.currentValue)}
            </div>
          </div>

          <div className="highlight-card">
            <span className="highlight-card__label">Total Return</span>
            <div className="highlight-card__value">
              {formatPercent(investment.returnPercentage)}
            </div>
            <div className="highlight-card__change">
              {formatCurrency(totalGain)} total gain
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card__header">
              <span className="stat-card__label">Distributions Received</span>
            </div>
            <div className="stat-card__value">
              {formatCurrency(investment.totalDistributions)}
            </div>
          </div>
        </div>
      </div>

      {/* Distribution History */}
      <DistributionHistory
        distributions={distributions}
        showPropertyName={false}
      />

      {/* Back link */}
      <div className="page-actions">
        <Link href="/dashboard/portfolio" className="btn btn--ghost">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="btn__icon"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Portfolio
        </Link>
      </div>
    </div>
  )
}
