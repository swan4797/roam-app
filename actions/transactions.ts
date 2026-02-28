"use server"

import { revalidatePath } from "next/cache"
import {
  markAsInternalTransfer,
  updateTransactionCategory,
} from "@/lib/dal/transactions"

export async function markAsTransferAction(formData: FormData): Promise<void> {
  const transactionId = formData.get("transactionId") as string
  const linkedTransactionId = formData.get("linkedTransactionId") as string | null

  if (!transactionId) {
    throw new Error("Transaction ID is required")
  }

  await markAsInternalTransfer(transactionId, linkedTransactionId || undefined)

  revalidatePath("/dashboard/transactions")
  revalidatePath(`/dashboard/transactions/${transactionId}`)
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  const transactionId = formData.get("transactionId") as string
  const categoryId = formData.get("categoryId") as string

  if (!transactionId || !categoryId) {
    throw new Error("Transaction ID and Category ID are required")
  }

  await updateTransactionCategory(transactionId, categoryId)

  revalidatePath("/dashboard/transactions")
  revalidatePath(`/dashboard/transactions/${transactionId}`)
  revalidatePath("/dashboard")
}
