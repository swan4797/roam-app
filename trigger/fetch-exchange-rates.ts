import { schedules } from "@trigger.dev/sdk/v3"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/generated/prisma/client"

interface OpenExchangeRatesResponse {
  disclaimer: string
  license: string
  timestamp: number
  base: string
  rates: Record<string, number>
}

export const fetchExchangeRates = schedules.task({
  id: "fetch-exchange-rates",
  cron: "0 */2 * * *", // Every 2 hours
  run: async () => {
    const appId = process.env.OPENEXCHANGERATES_APP_ID

    if (!appId) {
      console.warn("Open Exchange Rates API key not configured")
      return { skipped: true }
    }

    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=USD`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`)
    }

    const data: OpenExchangeRatesResponse = await response.json()

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Store rates as JSON object with USD as base
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_date_source: {
          baseCurrency: "USD",
          date: today,
          source: "openexchangerates",
        },
      },
      create: {
        baseCurrency: "USD",
        date: today,
        rates: data.rates as Prisma.JsonObject,
        source: "openexchangerates",
      },
      update: {
        rates: data.rates as Prisma.JsonObject,
        fetchedAt: new Date(),
      },
    })

    return { stored: Object.keys(data.rates).length, timestamp: data.timestamp }
  },
})

export const fetchWiseRates = schedules.task({
  id: "fetch-wise-rates",
  cron: "0 */2 * * *", // Every 2 hours
  run: async () => {
    const apiToken = process.env.WISE_API_TOKEN

    if (!apiToken) {
      console.warn("Wise API token not configured")
      return { skipped: true }
    }

    // Fetch Wise rates for common currency pairs to GBP
    const currencies = ["EUR", "USD", "AUD", "CAD", "CHF", "JPY", "SGD"]
    const rates: Record<string, number> = {}

    for (const currency of currencies) {
      try {
        const response = await fetch(
          `https://api.wise.com/v1/rates?source=${currency}&target=GBP`,
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
            },
          }
        )

        if (!response.ok) {
          console.error(`Failed to fetch Wise rate for ${currency}`)
          continue
        }

        const data = await response.json()

        if (data.length > 0) {
          rates[currency] = data[0].rate
        }
      } catch (error) {
        console.error(`Error fetching Wise rate for ${currency}:`, error)
      }
    }

    if (Object.keys(rates).length === 0) {
      return { stored: 0 }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Store Wise rates with GBP as base
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_date_source: {
          baseCurrency: "GBP",
          date: today,
          source: "wise",
        },
      },
      create: {
        baseCurrency: "GBP",
        date: today,
        rates: rates as Prisma.JsonObject,
        source: "wise",
      },
      update: {
        rates: rates as Prisma.JsonObject,
        fetchedAt: new Date(),
      },
    })

    return { stored: Object.keys(rates).length }
  },
})
