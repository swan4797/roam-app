import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface MerchantNormalizationResult {
  normalizedName: string
  category: string | null
  confidence: number
}

export async function normalizeMerchantName(
  rawDescription: string,
  existingMerchantName?: string | null
): Promise<MerchantNormalizationResult> {
  const prompt = `You are a merchant name normalizer for a UK banking app. Given a raw transaction description, extract the clean merchant name.

Rules:
- Remove location suffixes (e.g., "LONDON GB", "MANCHESTER UK")
- Remove transaction IDs and reference numbers (e.g., "*1A2B3C", "#12345")
- Remove company suffixes (LTD, LIMITED, INC, PLC, CO)
- Convert common abbreviations to full names (AMZN → Amazon, TESCO STORES → Tesco)
- Use proper title case
- For card payments, extract just the merchant name
- Keep well-known brand names as-is (Netflix, Spotify, Uber, etc.)

Examples:
- "AMZN MKTP GB*1A2B3C4D" → "Amazon"
- "TESCO STORES 2341 LONDON GB" → "Tesco"
- "UBER *TRIP HELP.UBER.COM" → "Uber"
- "NETFLIX.COM 866-579-7172 CA" → "Netflix"
- "TFL TRAVEL CH\\VICTORIA STN" → "TfL"
- "PRET A MANGER LONDON" → "Pret A Manger"
- "SP * DELIVEROO" → "Deliveroo"
- "GOOGLE *GOOGLE STORAGE" → "Google"

Also suggest a category from this list if obvious:
- Food & Drink
- Groceries
- Transport
- Travel
- Shopping
- Entertainment
- Bills & Utilities
- Health
- Subscriptions
- Income
- Transfer
- Cash
- Other

Respond in JSON format:
{"normalizedName": "...", "category": "..." or null, "confidence": 0.0-1.0}

Raw description: "${rawDescription}"${existingMerchantName ? `\nExisting merchant name hint: "${existingMerchantName}"` : ""}`

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    const result = JSON.parse(content.text)
    return {
      normalizedName: result.normalizedName || rawDescription,
      category: result.category || null,
      confidence: result.confidence || 0.5,
    }
  } catch (error) {
    console.error("Merchant normalization failed:", error)
    // Fallback to basic normalization
    return {
      normalizedName: basicNormalize(rawDescription),
      category: null,
      confidence: 0.3,
    }
  }
}

function basicNormalize(raw: string): string {
  return raw
    .replace(/\s+(LTD|LIMITED|INC|LLC|PLC|CO|CORP)\.?$/i, "")
    .replace(/\s*\*+\s*/g, " ")
    .replace(/\s+[A-Z]{2,}(\s+[A-Z]{2,3})?$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function normalizeMerchantsBatch(
  transactions: Array<{
    id: string
    description: string
    merchantName?: string | null
  }>
): Promise<Map<string, MerchantNormalizationResult>> {
  const results = new Map<string, MerchantNormalizationResult>()

  // Process in parallel with concurrency limit
  const concurrencyLimit = 5
  const chunks: typeof transactions[] = []

  for (let i = 0; i < transactions.length; i += concurrencyLimit) {
    chunks.push(transactions.slice(i, i + concurrencyLimit))
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (tx) => {
      const result = await normalizeMerchantName(tx.description, tx.merchantName)
      results.set(tx.id, result)
    })
    await Promise.all(promises)
  }

  return results
}

export async function generateMonthlyInsight(
  userId: string,
  month: Date,
  data: {
    totalSpent: number
    totalIncome: number
    fxFees: number
    wiseSavings: number
    topCategories: Array<{ name: string; amount: number }>
    topMerchants: Array<{ name: string; amount: number; count: number }>
    unusualTransactions: Array<{ merchant: string; amount: number; reason: string }>
  }
): Promise<string> {
  const monthName = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  const prompt = `You are a friendly financial assistant for a UK-based personal finance app used by digital nomads and freelancers.

Generate a brief, helpful monthly spending summary (2-3 paragraphs, ~150 words) for ${monthName}.

Data:
- Total spent: £${data.totalSpent.toFixed(2)}
- Total income: £${data.totalIncome.toFixed(2)}
- FX fees paid: £${data.fxFees.toFixed(2)}
- Potential Wise savings: £${data.wiseSavings.toFixed(2)}
- Top categories: ${data.topCategories.map(c => `${c.name} (£${c.amount.toFixed(0)})`).join(", ")}
- Top merchants: ${data.topMerchants.map(m => `${m.name} (£${m.amount.toFixed(0)}, ${m.count}x)`).join(", ")}

Guidelines:
- Be conversational but professional
- Highlight any notable patterns or changes
- If FX fees are significant, mention the Wise savings opportunity
- Don't be preachy about spending - just informative
- Use British English and £ currency`

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    return content.text
  } catch (error) {
    console.error("Monthly insight generation failed:", error)
    return `Your spending summary for ${monthName} is being prepared. Check back soon.`
  }
}

export async function suggestCategory(
  merchantName: string,
  transactionDescription: string,
  amount: number
): Promise<string | null> {
  const prompt = `Given this transaction, suggest the most appropriate category from the list below.

Merchant: ${merchantName}
Description: ${transactionDescription}
Amount: £${Math.abs(amount).toFixed(2)} (${amount > 0 ? "credit" : "debit"})

Categories:
- Food & Drink (restaurants, cafes, takeaway)
- Groceries (supermarkets, food shops)
- Transport (taxis, trains, buses, fuel)
- Travel (flights, hotels, bookings)
- Shopping (retail, online shopping)
- Entertainment (cinema, streaming, games)
- Bills & Utilities (rent, utilities, phone)
- Health (pharmacy, doctors, gym)
- Subscriptions (recurring digital services)
- Income (salary, freelance payments)
- Transfer (bank transfers, internal moves)
- Cash (ATM withdrawals)
- Other (if none fit)

Respond with just the category name, nothing else.`

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 20,
      messages: [{ role: "user", content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== "text") {
      return null
    }

    const category = content.text.trim()
    const validCategories = [
      "Food & Drink", "Groceries", "Transport", "Travel", "Shopping",
      "Entertainment", "Bills & Utilities", "Health", "Subscriptions",
      "Income", "Transfer", "Cash", "Other"
    ]

    return validCategories.includes(category) ? category : null
  } catch (error) {
    console.error("Category suggestion failed:", error)
    return null
  }
}
