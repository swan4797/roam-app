"use server"

import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt, encrypt } from "@/lib/encryption"
import { deleteBankConnection } from "@/lib/dal/bank-connections"
import {
  getTransactions,
  getAccountBalance,
  refreshAccessToken,
} from "@/lib/truelayer"
import { SyncStatus } from "@/generated/prisma/client"

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

export async function syncTransactionsAction(formData: FormData): Promise<{ success: boolean; message: string; count?: number }> {
  const connectionId = formData.get("connectionId") as string

  if (!connectionId) {
    return { success: false, message: "Connection ID is required" }
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }

  // Get connection with accounts
  const connection = await prisma.bankConnection.findFirst({
    where: { id: connectionId, userId: session.user.id },
    include: { bankAccounts: true },
  })

  if (!connection) {
    return { success: false, message: "Connection not found" }
  }

  // Mark as syncing
  await prisma.bankConnection.update({
    where: { id: connectionId },
    data: { syncStatus: SyncStatus.SYNCING, syncError: null },
  })

  try {
    let accessToken = decrypt(connection.accessTokenEncrypted)

    // Check if token needs refresh
    if (connection.accessTokenExpiresAt < new Date()) {
      const refreshToken = decrypt(connection.refreshTokenEncrypted)
      const newTokens = await refreshAccessToken(refreshToken)

      const accessTokenExpiresAt = new Date()
      accessTokenExpiresAt.setSeconds(
        accessTokenExpiresAt.getSeconds() + newTokens.expires_in
      )

      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          accessTokenEncrypted: encrypt(newTokens.access_token),
          refreshTokenEncrypted: encrypt(newTokens.refresh_token),
          accessTokenExpiresAt,
        },
      })

      accessToken = newTokens.access_token
    }

    let totalTransactionsSynced = 0

    for (const account of connection.bankAccounts) {
      // Update balance
      try {
        const balance = await getAccountBalance(accessToken, account.externalId)
        await prisma.bankAccount.update({
          where: { id: account.id },
          data: {
            balance: balance.current,
            balanceUpdatedAt: new Date(),
          },
        })
      } catch (e) {
        console.error(`Failed to update balance for ${account.id}:`, e)
      }

      // Fetch transactions from last sync or 3 months ago
      const fromDate =
        connection.lastSyncedAt ??
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days

      try {
        const transactions = await getTransactions(
          accessToken,
          account.externalId,
          fromDate,
          new Date()
        )

        for (const tx of transactions) {
          await prisma.transaction.upsert({
            where: {
              bankAccountId_externalId: {
                bankAccountId: account.id,
                externalId: tx.transaction_id,
              },
            },
            create: {
              bankAccountId: account.id,
              externalId: tx.transaction_id,
              transactionDate: new Date(tx.timestamp),
              amount: tx.amount,
              currency: tx.currency,
              description: tx.description,
              merchantName: tx.merchant_name ?? null,
              transactionType: tx.transaction_type,
              transactionCategory: tx.transaction_category,
              normalisedMerchant: normaliseMerchantName(tx.merchant_name ?? tx.description),
            },
            update: {
              transactionDate: new Date(tx.timestamp),
              amount: tx.amount,
              description: tx.description,
              merchantName: tx.merchant_name ?? null,
            },
          })
        }

        totalTransactionsSynced += transactions.length
      } catch (e) {
        console.error(`Failed to fetch transactions for ${account.id}:`, e)
      }
    }

    // Mark sync as complete
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: SyncStatus.COMPLETED,
        lastSyncedAt: new Date(),
        syncError: null,
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/accounts")
    revalidatePath("/dashboard/transactions")

    return {
      success: true,
      message: `Synced ${totalTransactionsSynced} transactions`,
      count: totalTransactionsSynced,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    // Mark sync as failed
    await prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        syncStatus: SyncStatus.FAILED,
        syncError: errorMessage,
      },
    })

    revalidatePath("/dashboard/accounts")

    return { success: false, message: errorMessage }
  }
}

function normaliseMerchantName(rawName: string): string {
  let name = rawName
    .replace(/\s+(LTD|LIMITED|INC|LLC|PLC|CO|CORP)\.?$/i, "")
    .replace(/\s*\*+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  name = name.replace(/\s+[A-Z]{2,}(\s+[A-Z]{2,3})?$/i, "")

  name = name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return name
}
