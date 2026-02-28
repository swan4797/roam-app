import { task, schedules } from "@trigger.dev/sdk/v3"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import {
  getTransactions,
  getAccountBalance,
  refreshAccessToken,
} from "@/lib/truelayer"
import { SyncStatus } from "@/generated/prisma/client"

export const syncAllConnections = schedules.task({
  id: "sync-all-connections",
  cron: "0 */6 * * *", // Every 6 hours
  run: async () => {
    const connections = await prisma.bankConnection.findMany({
      where: {
        syncStatus: { not: SyncStatus.SYNCING },
      },
      select: {
        id: true,
        userId: true,
      },
    })

    for (const connection of connections) {
      await syncConnection.trigger({
        connectionId: connection.id,
        userId: connection.userId,
      })
    }

    return { triggered: connections.length }
  },
})

export const syncConnection = task({
  id: "sync-connection",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: { connectionId: string; userId: string }) => {
    const { connectionId, userId } = payload

    // Get connection with encrypted tokens
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, userId },
      include: { bankAccounts: true },
    })

    if (!connection) {
      throw new Error("Connection not found")
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

        // Update stored tokens
        const { encrypt } = await import("@/lib/encryption")
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
            data: { balance: balance.current },
          })
        } catch (e) {
          console.error(`Failed to update balance for ${account.id}:`, e)
        }

        // Fetch transactions from last sync or 24 months ago
        const fromDate =
          connection.lastSyncedAt ??
          new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000)

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
              merchantName: tx.merchant_name,
              transactionType: tx.transaction_type,
              transactionCategory: tx.transaction_category,
            },
            update: {
              transactionDate: new Date(tx.timestamp),
              amount: tx.amount,
              description: tx.description,
              merchantName: tx.merchant_name,
            },
          })
        }

        totalTransactionsSynced += transactions.length
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

      // Trigger enrichment for new transactions
      await enrichTransactions.trigger({
        connectionId,
        userId,
      })

      return { transactionsSynced: totalTransactionsSynced }
    } catch (error) {
      // Mark sync as failed
      await prisma.bankConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: SyncStatus.FAILED,
          syncError: error instanceof Error ? error.message : "Unknown error",
        },
      })
      throw error
    }
  },
})

export const enrichTransactions = task({
  id: "enrich-transactions",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { connectionId: string; userId: string }) => {
    const { connectionId, userId } = payload
    const { normalizeMerchantName: aiNormalize } = await import("@/lib/ai")

    // Get transactions that need enrichment
    const transactions = await prisma.transaction.findMany({
      where: {
        bankAccount: {
          bankConnectionId: connectionId,
          bankConnection: { userId },
        },
        normalisedMerchant: null,
      },
      take: 100, // Process in batches
    })

    if (transactions.length === 0) {
      return { enriched: 0 }
    }

    let enrichedCount = 0

    for (const tx of transactions) {
      // Use AI to normalise merchant name and suggest category
      let normalisedMerchant: string
      let suggestedCategory: string | null = null

      if (process.env.ANTHROPIC_API_KEY) {
        const aiResult = await aiNormalize(
          tx.description,
          tx.merchantName
        )
        normalisedMerchant = aiResult.normalizedName
        suggestedCategory = aiResult.category
      } else {
        // Fallback to basic normalization if no API key
        normalisedMerchant = normaliseMerchantName(
          tx.merchantName ?? tx.description
        )
      }

      // Auto-categorize: first check user's existing rules, then AI suggestion, then TrueLayer category
      const category = await autoCategorizeTx(
        userId,
        normalisedMerchant,
        tx.transactionCategory,
        suggestedCategory
      )

      // Calculate FX enrichment if foreign currency
      let fxEnrichment = {}
      if (tx.currency !== "GBP") {
        fxEnrichment = await calculateFxEnrichment(
          tx.currency,
          Math.abs(tx.amount.toNumber()),
          tx.transactionDate
        )
      }

      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          normalisedMerchant,
          categoryId: category?.id,
          ...fxEnrichment,
        },
      })

      enrichedCount++
    }

    return { enriched: enrichedCount }
  },
})

function normaliseMerchantName(rawName: string): string {
  // Remove common suffixes and clean up
  let name = rawName
    .replace(/\s+(LTD|LIMITED|INC|LLC|PLC|CO|CORP)\.?$/i, "")
    .replace(/\s*\*+\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // Remove location suffixes (e.g., "STARBUCKS LONDON GB")
  name = name.replace(/\s+[A-Z]{2,}(\s+[A-Z]{2,3})?$/i, "")

  // Title case
  name = name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return name
}

async function autoCategorizeTx(
  userId: string,
  merchantName: string,
  transactionCategory: string | null,
  aiSuggestedCategory?: string | null
): Promise<{ id: string } | null> {
  // First check for user-defined rules based on merchant
  const userRule = await prisma.transaction.findFirst({
    where: {
      bankAccount: { bankConnection: { userId } },
      normalisedMerchant: merchantName,
      categoryId: { not: null },
    },
    select: { categoryId: true },
    orderBy: { createdAt: "desc" },
  })

  if (userRule?.categoryId) {
    return { id: userRule.categoryId }
  }

  // Map TrueLayer categories to our categories
  const categoryMap: Record<string, string> = {
    FOOD_AND_DRINK: "Food & Drink",
    GROCERIES: "Groceries",
    TRANSPORT: "Transport",
    TRAVEL: "Travel",
    SHOPPING: "Shopping",
    ENTERTAINMENT: "Entertainment",
    BILLS_AND_UTILITIES: "Bills & Utilities",
    HEALTH: "Health",
    CASH: "Cash",
    TRANSFER: "Transfer",
  }

  // Try AI suggested category first (higher confidence than TrueLayer)
  if (aiSuggestedCategory) {
    const aiCategory = await prisma.category.findFirst({
      where: { name: aiSuggestedCategory },
      select: { id: true },
    })

    if (aiCategory) {
      return aiCategory
    }
  }

  // Fall back to TrueLayer category mapping
  const mappedName = transactionCategory ? categoryMap[transactionCategory] : null

  if (mappedName) {
    const category = await prisma.category.findFirst({
      where: { name: mappedName },
      select: { id: true },
    })

    return category
  }

  return null
}

async function calculateFxEnrichment(
  currency: string,
  amount: number,
  date: Date
): Promise<{
  midMarketRate?: number
  bankRate?: number
  estimatedFxFee?: number
  wiseSavings?: number
}> {
  // Get the exchange rate for the transaction date (USD base from Open Exchange Rates)
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const rateData = await prisma.exchangeRate.findFirst({
    where: {
      baseCurrency: "USD",
      source: "openexchangerates",
      date: {
        gte: new Date(txDate.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(txDate.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      date: "desc",
    },
  })

  if (!rateData) {
    return {}
  }

  const rates = rateData.rates as Record<string, number>
  const currencyToUsd = rates[currency]
  const gbpToUsd = rates["GBP"]

  if (!currencyToUsd || !gbpToUsd) {
    return {}
  }

  // Convert: 1 [currency] = X GBP
  // If 1 USD = 0.79 GBP and 1 USD = 1.08 EUR, then 1 EUR = 0.79 / 1.08 GBP
  const midMarketRate = gbpToUsd / currencyToUsd

  // Estimate bank markup (typically 2-3% for high street banks)
  const estimatedBankMarkup = 0.025 // 2.5%
  const bankRate = midMarketRate * (1 + estimatedBankMarkup)

  // Calculate estimated fee
  const fairValue = amount * midMarketRate
  const actualValue = amount * bankRate
  const estimatedFxFee = actualValue - fairValue

  // Calculate Wise savings (Wise typically charges 0.4-0.6%)
  const wiseMarkup = 0.005 // 0.5%
  const wiseRate = midMarketRate * (1 + wiseMarkup)
  const wiseValue = amount * wiseRate
  const wiseSavings = actualValue - wiseValue

  return {
    midMarketRate,
    bankRate,
    estimatedFxFee: Math.abs(estimatedFxFee),
    wiseSavings: Math.abs(wiseSavings),
  }
}
