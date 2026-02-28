"use client"

import { useState } from "react"

interface FxAlert {
  id: string
  type: "warning" | "tip" | "insight"
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

interface Props {
  weeklyFees: number
  topMerchant?: { name: string; fees: number }
  unusualSpending?: { currency: string; increase: number }
}

export function FxAlerts({ weeklyFees, topMerchant, unusualSpending }: Props) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount)
  }

  const alerts: FxAlert[] = []

  // Weekly fees alert
  if (weeklyFees > 10) {
    alerts.push({
      id: "weekly-fees",
      type: "warning",
      title: `You paid ${formatCurrency(weeklyFees)} in FX fees this week`,
      message: "Consider using a multi-currency card for better rates on foreign transactions.",
      action: { label: "See alternatives", href: "/dashboard/fx-analysis" },
    })
  }

  // Top merchant alert
  if (topMerchant && topMerchant.fees > 5) {
    alerts.push({
      id: "top-merchant",
      type: "tip",
      title: `${topMerchant.name} cost you ${formatCurrency(topMerchant.fees)} in hidden fees`,
      message: "Paying in local currency or using Wise could save you money here.",
      action: { label: "Learn more", href: "/dashboard/fx-analysis" },
    })
  }

  // Unusual currency spending
  if (unusualSpending && unusualSpending.increase > 50) {
    alerts.push({
      id: "unusual-spending",
      type: "insight",
      title: `${unusualSpending.currency} spending up ${unusualSpending.increase}%`,
      message: "You're spending more in this currency than usual. Are you traveling?",
      action: { label: "Set up travel mode", href: "/dashboard/settings" },
    })
  }

  // Default tip if no alerts
  if (alerts.length === 0) {
    alerts.push({
      id: "default-tip",
      type: "tip",
      title: "Track your FX spending",
      message: "Connect more accounts to get a complete picture of your foreign currency fees.",
      action: { label: "Connect bank", href: "/dashboard/accounts" },
    })
  }

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id))

  const dismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]))
  }

  const getAlertIcon = (type: FxAlert["type"]) => {
    switch (type) {
      case "warning":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      case "tip":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      case "insight":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )
    }
  }

  if (visibleAlerts.length === 0) return null

  return (
    <div className="fx-alerts">
      {visibleAlerts.map((alert) => (
        <div key={alert.id} className={`fx-alert fx-alert--${alert.type}`}>
          <div className="fx-alert__icon">{getAlertIcon(alert.type)}</div>
          <div className="fx-alert__content">
            <h4 className="fx-alert__title">{alert.title}</h4>
            <p className="fx-alert__message">{alert.message}</p>
            {alert.action && (
              <a href={alert.action.href} className="fx-alert__action">
                {alert.action.label} →
              </a>
            )}
          </div>
          <button
            className="fx-alert__dismiss"
            onClick={() => dismiss(alert.id)}
            aria-label="Dismiss alert"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
