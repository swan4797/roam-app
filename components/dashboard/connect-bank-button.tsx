"use client"

import Link from "next/link"

export function ConnectBankButton() {
  return (
    <Link href="/api/truelayer/auth" className="btn btn--primary">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Connect Bank
    </Link>
  )
}
