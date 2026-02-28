"use client"

import type { SerializedDistribution } from "@/types/portfolio"

interface Props {
  distributions: SerializedDistribution[]
  showPropertyName?: boolean
}

export function DistributionHistory({
  distributions,
  showPropertyName = true,
}: Props) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  const getDistributionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DIVIDEND: "Dividend",
      PREFERRED_RETURN: "Preferred Return",
      CAPITAL_RETURN: "Capital Return",
      SPECIAL: "Special Distribution",
    }
    return labels[type] || type
  }

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      PAID: "badge--success",
      PENDING: "badge--warning",
      PROCESSING: "badge--info",
    }
    return classes[status] || ""
  }

  return (
    <div className="card">
      <div className="card__header">
        <h3 className="card__title">Recent Distributions</h3>
      </div>
      <div className="distribution-list">
        {distributions.length === 0 ? (
          <div className="card__body card__body--empty">
            <p>No distributions yet.</p>
            <p className="text-muted">
              Distribution payments will appear here once received.
            </p>
          </div>
        ) : (
          distributions.map((dist) => (
            <div key={dist.id} className="activity-row">
              <div className="activity-row__left">
                <div
                  className="activity-row__icon"
                  style={{ backgroundColor: "#D1FAE5" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="activity-row__content">
                  <div className="activity-row__title">
                    {getDistributionTypeLabel(dist.distributionType)}
                  </div>
                  {showPropertyName && dist.investment?.property && (
                    <div className="activity-row__id">
                      {dist.investment.property.name}
                    </div>
                  )}
                </div>
              </div>
              <div className="activity-row__right">
                <div className="activity-row__amount activity-row__amount--positive">
                  +{formatCurrency(dist.amount)}
                </div>
                <div className="activity-row__date">
                  {formatDate(dist.distributionDate)}
                </div>
                <span className={`badge ${getStatusBadgeClass(dist.status)}`}>
                  {dist.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
