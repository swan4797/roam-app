"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { saveKYCProfile, savePartialKYC, updateKYCStatus } from "@/lib/dal/kyc"
import type { KYCFormData } from "@/types/kyc"

// ============================================================================
// Validation Schemas
// ============================================================================

const personalInfoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().refine(
    (val) => {
      const date = new Date(val)
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      return age >= 18
    },
    { message: "You must be at least 18 years old" }
  ),
  phone: z.string().min(10, "Please enter a valid phone number"),
})

const addressSchema = z.object({
  addressLine1: z.string().min(5, "Please enter a valid address"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
})

const accreditationSchema = z.object({
  isAccredited: z.enum(["yes", "no"]),
  accreditationType: z
    .enum(["INCOME", "NET_WORTH", "PROFESSIONAL"])
    .optional()
    .nullable(),
  annualIncome: z.number().optional().nullable(),
  netWorth: z.number().optional().nullable(),
})

const documentsSchema = z.object({
  idDocumentUrl: z.string().optional(),
  addressProofUrl: z.string().optional(),
  accreditationUrl: z.string().optional(),
})

const fullKYCSchema = z.object({
  ...personalInfoSchema.shape,
  ...addressSchema.shape,
  ...accreditationSchema.shape,
  ...documentsSchema.shape,
})

// ============================================================================
// Types
// ============================================================================

export type KYCActionResult = {
  error?: Record<string, string[]>
  success?: boolean
}

// ============================================================================
// Step Validation Actions
// ============================================================================

export async function validatePersonalInfoAction(
  formData: FormData
): Promise<KYCActionResult> {
  const parsed = personalInfoSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone"),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Save partial data
  await savePartialKYC(0, parsed.data)
  revalidatePath("/dashboard/verify")
  return { success: true }
}

export async function validateAddressAction(
  formData: FormData
): Promise<KYCActionResult> {
  const parsed = addressSchema.safeParse({
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await savePartialKYC(1, parsed.data)
  revalidatePath("/dashboard/verify")
  return { success: true }
}

export async function validateAccreditationAction(
  formData: FormData
): Promise<KYCActionResult> {
  const isAccredited = formData.get("isAccredited") as "yes" | "no"

  const data: {
    isAccredited: "yes" | "no"
    accreditationType?: "INCOME" | "NET_WORTH" | "PROFESSIONAL" | null
    annualIncome?: number | null
    netWorth?: number | null
  } = {
    isAccredited,
    accreditationType: null,
    annualIncome: null,
    netWorth: null,
  }

  if (isAccredited === "yes") {
    data.accreditationType = formData.get("accreditationType") as
      | "INCOME"
      | "NET_WORTH"
      | "PROFESSIONAL"
      | null

    const annualIncomeStr = formData.get("annualIncome") as string
    if (annualIncomeStr) {
      data.annualIncome = parseFloat(annualIncomeStr)
    }

    const netWorthStr = formData.get("netWorth") as string
    if (netWorthStr) {
      data.netWorth = parseFloat(netWorthStr)
    }
  }

  const parsed = accreditationSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await savePartialKYC(2, parsed.data as Partial<KYCFormData>)
  revalidatePath("/dashboard/verify")
  return { success: true }
}

export async function validateDocumentsAction(
  formData: FormData
): Promise<KYCActionResult> {
  // For now, we'll just mark the documents as "uploaded" with placeholder URLs
  // In a real app, you'd upload to S3/Cloudinary and get back URLs
  const idDocument = formData.get("idDocument") as File | null
  const addressProof = formData.get("addressProof") as File | null
  const accreditationDoc = formData.get("accreditationDoc") as File | null

  const data: Partial<KYCFormData> = {}

  // Simulate document upload - in production, upload to cloud storage
  if (idDocument && idDocument.size > 0) {
    data.idDocumentUrl = `uploads/${Date.now()}_id_document.pdf`
  }
  if (addressProof && addressProof.size > 0) {
    data.addressProofUrl = `uploads/${Date.now()}_address_proof.pdf`
  }
  if (accreditationDoc && accreditationDoc.size > 0) {
    data.accreditationUrl = `uploads/${Date.now()}_accreditation.pdf`
  }

  await savePartialKYC(3, data)
  revalidatePath("/dashboard/verify")
  return { success: true }
}

// ============================================================================
// Submit Full KYC
// ============================================================================

export async function submitKYCAction(
  formData: FormData
): Promise<KYCActionResult> {
  const isAccredited = formData.get("isAccredited") as "yes" | "no"

  const data: Record<string, unknown> = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city"),
    state: formData.get("state"),
    postalCode: formData.get("postalCode"),
    country: formData.get("country"),
    isAccredited,
    accreditationType: isAccredited === "yes"
      ? formData.get("accreditationType")
      : null,
    annualIncome: formData.get("annualIncome")
      ? parseFloat(formData.get("annualIncome") as string)
      : null,
    netWorth: formData.get("netWorth")
      ? parseFloat(formData.get("netWorth") as string)
      : null,
    idDocumentUrl: formData.get("idDocumentUrl") || undefined,
    addressProofUrl: formData.get("addressProofUrl") || undefined,
    accreditationUrl: formData.get("accreditationUrl") || undefined,
  }

  const parsed = fullKYCSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await saveKYCProfile(parsed.data as KYCFormData)
  revalidatePath("/dashboard/verify")
  revalidatePath("/dashboard")
  return { success: true }
}

// ============================================================================
// Update Status (for demo purposes)
// ============================================================================

export async function setKYCStatusAction(
  status: "VERIFIED" | "REJECTED"
): Promise<void> {
  await updateKYCStatus(status)
  revalidatePath("/dashboard/verify")
  revalidatePath("/dashboard")
}

// ============================================================================
// Client-friendly validation functions (for use in wizard)
// ============================================================================

type ValidationResult = {
  success: boolean
  errors?: Record<string, string[]>
}

export async function validatePersonalInfo(
  data: Partial<KYCFormData>
): Promise<ValidationResult> {
  const parsed = personalInfoSchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  return { success: true }
}

export async function validateAddress(
  data: Partial<KYCFormData>
): Promise<ValidationResult> {
  const parsed = addressSchema.safeParse(data)

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  return { success: true }
}

export async function validateAccreditation(
  data: Partial<KYCFormData>
): Promise<ValidationResult> {
  const parsed = accreditationSchema.safeParse({
    isAccredited: data.isAccredited,
    accreditationType: data.accreditationType ?? null,
    annualIncome: data.annualIncome ?? null,
    netWorth: data.netWorth ?? null,
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  return { success: true }
}

export async function submitKYC(
  data: KYCFormData
): Promise<ValidationResult> {
  const parsed = fullKYCSchema.safeParse({
    ...data,
    accreditationType: data.accreditationType ?? null,
    annualIncome: data.annualIncome ?? null,
    netWorth: data.netWorth ?? null,
  })

  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors }
  }

  await saveKYCProfile(parsed.data as KYCFormData)
  revalidatePath("/dashboard/verify")
  revalidatePath("/dashboard")
  return { success: true }
}
