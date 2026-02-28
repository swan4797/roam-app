"use client"

import type { SerializedProperty } from "@/types/portfolio"

interface Props {
  property: SerializedProperty
  investedAmount?: number
  currentValue?: number
  onClick?: () => void
}

export function PropertyCard({
  property,
  investedAmount,
  currentValue,
  onClick,
}: Props) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount)

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      RAISING: "badge--warning",
      ACTIVE: "badge--success",
      DISTRIBUTING: "badge--info",
      SOLD: "badge--secondary",
    }
    return classes[status] || ""
  }

  return (
    <div
      className={`property-card ${onClick ? "property-card--clickable" : ""}`}
      onClick={onClick}
    >
      <div className="property-card__image">
        {property.imageUrl ? (
          <img src={property.imageUrl} alt={property.name} />
        ) : (
          <div className="property-card__placeholder">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        <span
          className={`property-card__badge badge ${getStatusBadgeClass(property.status)}`}
        >
          {property.status}
        </span>
      </div>
      <div className="property-card__body">
        <h4 className="property-card__name">{property.name}</h4>
        <p className="property-card__location">{property.location}</p>
        <div className="property-card__meta">
          <span className="property-card__type">
            {property.propertyType.replace("_", " ")}
          </span>
          {property.targetReturn && (
            <span className="property-card__return">
              {property.targetReturn}% Target
            </span>
          )}
        </div>
        {(investedAmount !== undefined || currentValue !== undefined) && (
          <div className="property-card__values">
            {investedAmount !== undefined && (
              <div className="property-card__value">
                <span className="property-card__value-label">Invested</span>
                <span className="property-card__value-amount">
                  {formatCurrency(investedAmount)}
                </span>
              </div>
            )}
            {currentValue !== undefined && (
              <div className="property-card__value">
                <span className="property-card__value-label">Value</span>
                <span className="property-card__value-amount">
                  {formatCurrency(currentValue)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
