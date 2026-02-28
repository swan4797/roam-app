"use server"

import { revalidatePath } from "next/cache"
import { deleteBankConnection } from "@/lib/dal/bank-connections"

export async function deleteBankConnectionAction(formData: FormData): Promise<void> {
  const id = formData.get("id") as string

  if (!id) {
    throw new Error("Connection ID is required")
  }

  await deleteBankConnection(id)

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/accounts")
  revalidatePath("/dashboard/transactions")
}

export async function triggerSyncAction(formData: FormData): Promise<void> {
  const connectionId = formData.get("connectionId") as string

  if (!connectionId) {
    throw new Error("Connection ID is required")
  }

  // TODO: Implement Trigger.dev job trigger
  // await triggerSyncJob.invoke({ connectionId })

  revalidatePath("/dashboard/accounts")
}
