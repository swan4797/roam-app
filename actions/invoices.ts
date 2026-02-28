"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  linkPaymentToInvoice,
  confirmPayment,
  unlinkPayment,
} from "@/lib/dal/invoices"
import { MatchType } from "@/generated/prisma/client"

const createInvoiceSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  amountInBase: z.number().positive(),
  issuedAt: z.date(),
  dueAt: z.date(),
})

export type CreateInvoiceState = {
  error?: Record<string, string[]>
  success?: boolean
}

export async function createInvoiceAction(
  formData: FormData
): Promise<CreateInvoiceState> {
  const parsed = createInvoiceSchema.safeParse({
    clientName: formData.get("clientName"),
    description: formData.get("description") || undefined,
    amount: parseFloat(formData.get("amount") as string),
    currency: formData.get("currency"),
    amountInBase: parseFloat(formData.get("amountInBase") as string),
    issuedAt: new Date(formData.get("issuedAt") as string),
    dueAt: new Date(formData.get("dueAt") as string),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await createInvoice(parsed.data)
  revalidatePath("/dashboard/invoices")
  return { success: true }
}

export async function deleteInvoiceAction(formData: FormData): Promise<void> {
  const id = formData.get("id") as string
  if (!id) {
    throw new Error("Invoice ID is required")
  }

  await deleteInvoice(id)
  revalidatePath("/dashboard/invoices")
}

export async function linkPaymentAction(formData: FormData): Promise<void> {
  const invoiceId = formData.get("invoiceId") as string
  const transactionId = formData.get("transactionId") as string
  const matchTypeStr = formData.get("matchType") as string | null

  if (!invoiceId || !transactionId) {
    throw new Error("Invoice ID and Transaction ID are required")
  }

  const matchType = matchTypeStr ? (matchTypeStr as MatchType) : MatchType.MANUAL

  await linkPaymentToInvoice(invoiceId, transactionId, matchType)
  revalidatePath("/dashboard/invoices")
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
}

export async function confirmPaymentAction(formData: FormData): Promise<void> {
  const paymentId = formData.get("paymentId") as string
  if (!paymentId) {
    throw new Error("Payment ID is required")
  }

  await confirmPayment(paymentId)
  revalidatePath("/dashboard/invoices")
}

export async function unlinkPaymentAction(formData: FormData): Promise<void> {
  const paymentId = formData.get("paymentId") as string
  if (!paymentId) {
    throw new Error("Payment ID is required")
  }

  await unlinkPayment(paymentId)
  revalidatePath("/dashboard/invoices")
}
