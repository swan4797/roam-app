import type { KYCStatus } from "@/generated/prisma/client"

export interface KYCFormData {
  // Step 1: Personal Info
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string

  // Step 2: Address
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string

  // Step 3: Accreditation
  isAccredited: "yes" | "no"
  accreditationType?: "INCOME" | "NET_WORTH" | "PROFESSIONAL"
  annualIncome?: number
  netWorth?: number

  // Step 4: Documents (file names/URLs)
  idDocumentUrl?: string
  addressProofUrl?: string
  accreditationUrl?: string
}

export interface SerializedKYCProfile {
  id: string
  userId: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  postalCode: string
  country: string
  isAccredited: boolean
  accreditationType: string | null
  annualIncome: number | null
  netWorth: number | null
  idDocumentUrl: string | null
  addressProofUrl: string | null
  accreditationUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface KYCStatusInfo {
  status: KYCStatus
  submittedAt: Date | null
  verifiedAt: Date | null
  profile: SerializedKYCProfile | null
}

export const KYC_STEPS = [
  { id: 0, label: "Personal", title: "Personal Information" },
  { id: 1, label: "Address", title: "Address Details" },
  { id: 2, label: "Investor", title: "Investor Accreditation" },
  { id: 3, label: "Documents", title: "Document Verification" },
] as const

export type KYCStepId = (typeof KYC_STEPS)[number]["id"]

export const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "CH", name: "Switzerland" },
  { code: "IE", name: "Ireland" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
] as const

export const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const

export const ACCREDITATION_TYPES = [
  {
    value: "INCOME",
    label: "Annual Income",
    description: "Individual income exceeding $200,000 (or $300,000 joint) in each of the prior two years",
  },
  {
    value: "NET_WORTH",
    label: "Net Worth",
    description: "Net worth exceeding $1 million, excluding primary residence",
  },
  {
    value: "PROFESSIONAL",
    label: "Professional Certification",
    description: "Licensed Series 7, 65, or 82 holder in good standing",
  },
] as const
