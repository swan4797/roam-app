import { KYCStatus } from "@/generated/prisma/client"

interface Props {
  status: KYCStatus
  className?: string
}

const STATUS_CONFIG: Record<
  KYCStatus,
  { label: string; variant: string; icon: React.ReactNode }
> = {
  NOT_STARTED: {
    label: "Not Started",
    variant: "neutral",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "info",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    variant: "warning",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  VERIFIED: {
    label: "Verified",
    variant: "success",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  REJECTED: {
    label: "Rejected",
    variant: "error",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
}

export function KYCStatusBadge({ status, className = "" }: Props) {
  const config = STATUS_CONFIG[status]

  return (
    <span className={`kyc-badge kyc-badge--${config.variant} ${className}`}>
      <span className="kyc-badge__icon">{config.icon}</span>
      <span className="kyc-badge__label">{config.label}</span>
    </span>
  )
}
