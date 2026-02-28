import { z } from "zod"

// ============================================================================
// Client-Side Validation Schemas
// These run in the browser for immediate feedback before server validation
// ============================================================================

export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: "Please enter a valid date" }
    )
    .refine(
      (val) => {
        const date = new Date(val)
        const today = new Date()
        const age = today.getFullYear() - date.getFullYear()
        const monthDiff = today.getMonth() - date.getMonth()
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
          ? age - 1
          : age
        return actualAge >= 18
      },
      { message: "You must be at least 18 years old" }
    )
    .refine(
      (val) => {
        const date = new Date(val)
        const today = new Date()
        const age = today.getFullYear() - date.getFullYear()
        return age <= 120
      },
      { message: "Please enter a valid date of birth" }
    ),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must be less than 20 characters")
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
      "Please enter a valid phone number"
    ),
})

export const addressSchema = z.object({
  addressLine1: z
    .string()
    .min(1, "Address is required")
    .min(5, "Please enter a valid address")
    .max(100, "Address must be less than 100 characters"),
  addressLine2: z
    .string()
    .max(100, "Address line 2 must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be less than 50 characters"),
  state: z
    .string()
    .min(1, "State/Province is required")
    .min(2, "State must be at least 2 characters")
    .max(50, "State must be less than 50 characters"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .min(3, "Postal code must be at least 3 characters")
    .max(20, "Postal code must be less than 20 characters"),
  country: z
    .string()
    .min(1, "Country is required")
    .min(2, "Please select a country"),
})

export const accreditationSchema = z.object({
  isAccredited: z.enum(["yes", "no"], {
    message: "Please select your accreditation status",
  }),
  accreditationType: z
    .enum(["INCOME", "NET_WORTH", "PROFESSIONAL"])
    .optional(),
  annualIncome: z
    .number()
    .positive("Annual income must be positive")
    .optional(),
  netWorth: z
    .number()
    .positive("Net worth must be positive")
    .optional(),
}).refine(
  (data) => {
    // If accredited, must have a type selected
    if (data.isAccredited === "yes" && !data.accreditationType) {
      return false
    }
    return true
  },
  {
    message: "Please select how you qualify as an accredited investor",
    path: ["accreditationType"],
  }
)

export const documentsSchema = z.object({
  idDocumentUrl: z.string().optional(),
  addressProofUrl: z.string().optional(),
  accreditationUrl: z.string().optional(),
})

// Full KYC schema combining all steps
export const fullKYCSchema = personalInfoSchema
  .merge(addressSchema)
  .merge(accreditationSchema)
  .merge(documentsSchema)

// Type exports
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type AddressFormData = z.infer<typeof addressSchema>
export type AccreditationFormData = z.infer<typeof accreditationSchema>
export type DocumentsFormData = z.infer<typeof documentsSchema>
export type FullKYCFormData = z.infer<typeof fullKYCSchema>

// ============================================================================
// Client-side validation helpers
// ============================================================================

export function validatePersonalInfoClient(data: unknown) {
  return personalInfoSchema.safeParse(data)
}

export function validateAddressClient(data: unknown) {
  return addressSchema.safeParse(data)
}

export function validateAccreditationClient(data: unknown) {
  return accreditationSchema.safeParse(data)
}

export function validateDocumentsClient(data: unknown) {
  return documentsSchema.safeParse(data)
}

// Real-time field validation (for onChange)
export function validateField(
  schema: z.ZodSchema,
  field: string,
  value: unknown
): string | null {
  try {
    const partialSchema = z.object({ [field]: (schema as z.ZodObject<z.ZodRawShape>).shape[field] })
    partialSchema.parse({ [field]: value })
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.issues.find((e) => e.path[0] === field)
      return fieldError?.message || null
    }
    return null
  }
}
