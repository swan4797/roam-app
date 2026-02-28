"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  createPortfolio,
  createInvestment,
  deletePortfolio,
  getPortfolioOverview,
  getInvestments,
  getDistributions,
  getPerformanceData,
  getAllocationData,
} from "@/lib/dal/portfolio"
import type { PropertyType } from "@/generated/prisma/client"

// ============================================================================
// Validation Schemas
// ============================================================================

const createPortfolioSchema = z.object({
  name: z.string().min(1, "Portfolio name is required").max(100),
  description: z.string().max(500).optional(),
})

const createInvestmentSchema = z.object({
  portfolioId: z.string().min(1, "Portfolio ID is required"),
  propertyId: z.string().min(1, "Property ID is required"),
  investedAmount: z.number().positive("Amount must be positive"),
  shareCount: z.number().positive().optional(),
  investmentDate: z.date(),
})

// ============================================================================
// Types
// ============================================================================

export type CreatePortfolioState = {
  error?: Record<string, string[]>
  success?: boolean
  portfolioId?: string
}

export type CreateInvestmentState = {
  error?: Record<string, string[]>
  success?: boolean
  investmentId?: string
}

// ============================================================================
// Portfolio Actions
// ============================================================================

export async function createPortfolioAction(
  formData: FormData
): Promise<CreatePortfolioState> {
  const parsed = createPortfolioSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const portfolio = await createPortfolio(parsed.data)
  revalidatePath("/dashboard/portfolio")
  return { success: true, portfolioId: portfolio.id }
}

export async function deletePortfolioAction(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) {
    throw new Error("Portfolio ID is required")
  }

  await deletePortfolio(id)
  revalidatePath("/dashboard/portfolio")
}

// ============================================================================
// Investment Actions
// ============================================================================

export async function createInvestmentAction(
  formData: FormData
): Promise<CreateInvestmentState> {
  const parsed = createInvestmentSchema.safeParse({
    portfolioId: formData.get("portfolioId"),
    propertyId: formData.get("propertyId"),
    investedAmount: parseFloat(formData.get("investedAmount") as string),
    shareCount: formData.get("shareCount")
      ? parseFloat(formData.get("shareCount") as string)
      : undefined,
    investmentDate: new Date(formData.get("investmentDate") as string),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const investment = await createInvestment(parsed.data)
  revalidatePath("/dashboard/portfolio")
  return { success: true, investmentId: investment.id }
}

// ============================================================================
// Data Fetching Actions (for client-side refetching with filters)
// ============================================================================

export async function fetchPortfolioOverviewAction() {
  return getPortfolioOverview()
}

export async function fetchInvestmentsAction(options?: {
  portfolioId?: string
  propertyType?: PropertyType
}) {
  return getInvestments(options)
}

export async function fetchDistributionsAction(options?: {
  portfolioId?: string
  investmentId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  return getDistributions(options)
}

export async function fetchPerformanceDataAction(options?: {
  portfolioId?: string
  months?: number
}) {
  return getPerformanceData(options)
}

export async function fetchAllocationDataAction(options?: {
  portfolioId?: string
  groupBy?: "propertyType" | "property"
}) {
  return getAllocationData(options)
}
