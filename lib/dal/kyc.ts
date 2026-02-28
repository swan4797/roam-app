import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { KYCStatus } from "@/generated/prisma/client"
import type { KYCStatusInfo, SerializedKYCProfile, KYCFormData } from "@/types/kyc"

// Helper to convert Decimal to number
function decimalToNumber(
  value: { toNumber: () => number } | null | undefined
): number | null {
  return value ? value.toNumber() : null
}

// ============================================================================
// Get KYC Status
// ============================================================================

export async function getKYCStatus(): Promise<KYCStatusInfo> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      kycStatus: true,
      kycSubmittedAt: true,
      kycVerifiedAt: true,
      kycProfile: true,
    },
  })

  if (!user) throw new Error("User not found")

  return {
    status: user.kycStatus,
    submittedAt: user.kycSubmittedAt,
    verifiedAt: user.kycVerifiedAt,
    profile: user.kycProfile
      ? {
          id: user.kycProfile.id,
          userId: user.kycProfile.userId,
          firstName: user.kycProfile.firstName,
          lastName: user.kycProfile.lastName,
          dateOfBirth: user.kycProfile.dateOfBirth,
          phone: user.kycProfile.phone,
          addressLine1: user.kycProfile.addressLine1,
          addressLine2: user.kycProfile.addressLine2,
          city: user.kycProfile.city,
          state: user.kycProfile.state,
          postalCode: user.kycProfile.postalCode,
          country: user.kycProfile.country,
          isAccredited: user.kycProfile.isAccredited,
          accreditationType: user.kycProfile.accreditationType,
          annualIncome: decimalToNumber(user.kycProfile.annualIncome),
          netWorth: decimalToNumber(user.kycProfile.netWorth),
          idDocumentUrl: user.kycProfile.idDocumentUrl,
          addressProofUrl: user.kycProfile.addressProofUrl,
          accreditationUrl: user.kycProfile.accreditationUrl,
          createdAt: user.kycProfile.createdAt,
          updatedAt: user.kycProfile.updatedAt,
        }
      : null,
  }
}

// ============================================================================
// Update KYC Status
// ============================================================================

export async function updateKYCStatus(status: KYCStatus) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const updateData: {
    kycStatus: KYCStatus
    kycSubmittedAt?: Date
    kycVerifiedAt?: Date
  } = { kycStatus: status }

  if (status === "PENDING_REVIEW") {
    updateData.kycSubmittedAt = new Date()
  } else if (status === "VERIFIED") {
    updateData.kycVerifiedAt = new Date()
  }

  return prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  })
}

// ============================================================================
// Save KYC Profile
// ============================================================================

export async function saveKYCProfile(data: KYCFormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const profileData = {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: new Date(data.dateOfBirth),
    phone: data.phone,
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 || null,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
    isAccredited: data.isAccredited === "yes",
    accreditationType: data.accreditationType || null,
    annualIncome: data.annualIncome || null,
    netWorth: data.netWorth || null,
    idDocumentUrl: data.idDocumentUrl || null,
    addressProofUrl: data.addressProofUrl || null,
    accreditationUrl: data.accreditationUrl || null,
  }

  // Upsert the KYC profile
  const profile = await prisma.kYCProfile.upsert({
    where: { userId: session.user.id },
    update: profileData,
    create: {
      userId: session.user.id,
      ...profileData,
    },
  })

  // Update user's KYC status to PENDING_REVIEW
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      kycStatus: "PENDING_REVIEW",
      kycSubmittedAt: new Date(),
    },
  })

  return profile
}

// ============================================================================
// Get KYC Profile (for editing)
// ============================================================================

export async function getKYCProfile(): Promise<SerializedKYCProfile | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const profile = await prisma.kYCProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!profile) return null

  return {
    id: profile.id,
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: profile.dateOfBirth,
    phone: profile.phone,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    city: profile.city,
    state: profile.state,
    postalCode: profile.postalCode,
    country: profile.country,
    isAccredited: profile.isAccredited,
    accreditationType: profile.accreditationType,
    annualIncome: decimalToNumber(profile.annualIncome),
    netWorth: decimalToNumber(profile.netWorth),
    idDocumentUrl: profile.idDocumentUrl,
    addressProofUrl: profile.addressProofUrl,
    accreditationUrl: profile.accreditationUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

// ============================================================================
// Save Partial KYC Data (for step-by-step saving)
// ============================================================================

export async function savePartialKYC(
  step: number,
  data: Partial<KYCFormData>
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Update status to IN_PROGRESS if not already
  await prisma.user.update({
    where: { id: session.user.id },
    data: { kycStatus: "IN_PROGRESS" },
  })

  // Check if profile exists
  const existingProfile = await prisma.kYCProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (existingProfile) {
    // Update existing profile
    return prisma.kYCProfile.update({
      where: { userId: session.user.id },
      data: buildUpdateData(step, data),
    })
  } else {
    // Create new profile with minimal required data
    // For step 0, we have personal info
    if (step === 0) {
      return prisma.kYCProfile.create({
        data: {
          userId: session.user.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
          phone: data.phone || "",
          addressLine1: "",
          city: "",
          state: "",
          postalCode: "",
          country: "",
        },
      })
    }
  }
}

function buildUpdateData(step: number, data: Partial<KYCFormData>) {
  switch (step) {
    case 0:
      return {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        phone: data.phone,
      }
    case 1:
      return {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
      }
    case 2:
      return {
        isAccredited: data.isAccredited === "yes",
        accreditationType: data.accreditationType || null,
        annualIncome: data.annualIncome || null,
        netWorth: data.netWorth || null,
      }
    case 3:
      return {
        idDocumentUrl: data.idDocumentUrl || null,
        addressProofUrl: data.addressProofUrl || null,
        accreditationUrl: data.accreditationUrl || null,
      }
    default:
      return {}
  }
}
