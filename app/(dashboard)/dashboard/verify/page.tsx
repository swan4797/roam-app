import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getKYCProfile, getKYCStatus } from "@/lib/dal/kyc"
import { KYCWizard, KYCStatusBadge } from "@/components/kyc"
import { KYCStatus } from "@/generated/prisma/client"
import type { KYCFormData } from "@/types/kyc"

export const metadata = {
  title: "Identity Verification | Roam",
  description: "Complete your KYC verification to unlock all features",
}

export default async function VerifyPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect("/login")
  }

  const kycStatusInfo = await getKYCStatus()
  const kycStatus = kycStatusInfo.status
  const existingProfile = await getKYCProfile()

  // If already verified, show success state
  if (kycStatus === KYCStatus.VERIFIED) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title">Identity Verification</h1>
          <KYCStatusBadge status={kycStatus} />
        </div>

        <div className="kyc-verified">
          <div className="kyc-verified__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="kyc-verified__title">Verification Complete</h2>
          <p className="kyc-verified__description">
            Your identity has been verified. You now have full access to all
            investment opportunities on the platform.
          </p>
        </div>
      </div>
    )
  }

  // If pending review, show waiting state
  if (kycStatus === KYCStatus.PENDING_REVIEW) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title">Identity Verification</h1>
          <KYCStatusBadge status={kycStatus} />
        </div>

        <div className="kyc-pending">
          <div className="kyc-pending__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="kyc-pending__title">Under Review</h2>
          <p className="kyc-pending__description">
            Your verification documents are being reviewed. This typically takes
            1-2 business days. We&apos;ll notify you once the review is complete.
          </p>
        </div>
      </div>
    )
  }

  // If rejected, show rejection with option to resubmit
  if (kycStatus === KYCStatus.REJECTED) {
    return (
      <div className="page">
        <div className="page__header">
          <h1 className="page__title">Identity Verification</h1>
          <KYCStatusBadge status={kycStatus} />
        </div>

        <div className="kyc-rejected">
          <div className="kyc-rejected__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="kyc-rejected__title">Verification Unsuccessful</h2>
          <p className="kyc-rejected__description">
            We were unable to verify your identity with the documents provided.
            Please review your information and resubmit.
          </p>
        </div>

        <KYCWizard initialData={transformProfileToFormData(existingProfile)} />
      </div>
    )
  }

  // Default: show wizard for NOT_STARTED or IN_PROGRESS
  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Identity Verification</h1>
        {kycStatus !== KYCStatus.NOT_STARTED && (
          <KYCStatusBadge status={kycStatus} />
        )}
      </div>

      <div className="page__intro">
        <p>
          Complete the verification process to unlock full access to investment
          opportunities. This process typically takes 5-10 minutes.
        </p>
      </div>

      <KYCWizard initialData={transformProfileToFormData(existingProfile)} />
    </div>
  )
}

function transformProfileToFormData(
  profile: Awaited<ReturnType<typeof getKYCProfile>>
): Partial<KYCFormData> {
  if (!profile) return {}

  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: profile.dateOfBirth.toISOString().split("T")[0],
    phone: profile.phone,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2 ?? undefined,
    city: profile.city,
    state: profile.state,
    postalCode: profile.postalCode,
    country: profile.country,
    isAccredited: profile.isAccredited ? "yes" : "no",
    accreditationType: profile.accreditationType as
      | "INCOME"
      | "NET_WORTH"
      | "PROFESSIONAL"
      | undefined,
    annualIncome: profile.annualIncome
      ? Number(profile.annualIncome)
      : undefined,
    netWorth: profile.netWorth ? Number(profile.netWorth) : undefined,
    idDocumentUrl: profile.idDocumentUrl ?? undefined,
    addressProofUrl: profile.addressProofUrl ?? undefined,
    accreditationUrl: profile.accreditationUrl ?? undefined,
  }
}
