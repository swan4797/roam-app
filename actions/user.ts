"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { updateUserBaseCurrency, deleteUserAccount } from "@/lib/dal/user"

const updateCurrencySchema = z.object({
  currency: z.string().length(3, "Currency must be a 3-letter code").toUpperCase(),
})

export async function updateBaseCurrencyAction(formData: FormData) {
  const parsed = updateCurrencySchema.safeParse({
    currency: formData.get("currency"),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const user = await updateUserBaseCurrency(parsed.data.currency)

  // Revalidate all pages that show currency-converted amounts
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/transactions")
  revalidatePath("/dashboard/invoices")
  return { user }
}

export async function deleteAccountAction() {
  await deleteUserAccount()

  // The user will be signed out and redirected by the auth system
  return { success: true }
}
