import "dotenv/config"
import { PrismaClient } from "../generated/prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create default categories
  const categories = [
    { name: "Food & Drink", icon: "🍔", color: "#F59E0B" },
    { name: "Groceries", icon: "🛒", color: "#22C55E" },
    { name: "Transport", icon: "🚗", color: "#3B82F6" },
    { name: "Travel", icon: "✈️", color: "#10B981" },
    { name: "Shopping", icon: "🛍️", color: "#8B5CF6" },
    { name: "Entertainment", icon: "🎬", color: "#EC4899" },
    { name: "Bills & Utilities", icon: "📄", color: "#6B7280" },
    { name: "Health", icon: "💊", color: "#EF4444" },
    { name: "Subscriptions", icon: "📱", color: "#8B5CF6" },
    { name: "Income", icon: "💰", color: "#10B981" },
    { name: "Transfer", icon: "🔄", color: "#6B7280" },
    { name: "Cash", icon: "💵", color: "#F59E0B" },
    { name: "Other", icon: "📦", color: "#9CA3AF" },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log(`Created ${categories.length} categories`)

  // Create demo user
  const hashedPassword = await bcrypt.hash("demo1234", 12)
  const user = await prisma.user.upsert({
    where: { email: "demo@roam.app" },
    update: {},
    create: {
      email: "demo@roam.app",
      name: "Demo User",
      password: hashedPassword,
      baseCurrency: "GBP",
    },
  })
  console.log(`Created demo user: ${user.email}`)

  // Create mock bank connection (simulating TrueLayer sandbox)
  const bankConnection = await prisma.bankConnection.upsert({
    where: {
      id: "demo-connection",
    },
    update: {},
    create: {
      id: "demo-connection",
      userId: user.id,
      institutionId: "mock-uk-bank",
      institutionName: "Mock UK Bank",
      accessTokenEncrypted: "demo-access-token",
      refreshTokenEncrypted: "demo-refresh-token",
      accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      consentExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      syncStatus: "COMPLETED",
      lastSyncedAt: new Date(),
    },
  })

  // Create bank accounts
  const currentAccount = await prisma.bankAccount.upsert({
    where: {
      bankConnectionId_externalId: {
        bankConnectionId: bankConnection.id,
        externalId: "current-account-001",
      },
    },
    update: {},
    create: {
      bankConnectionId: bankConnection.id,
      externalId: "current-account-001",
      accountType: "TRANSACTION",
      displayName: "Current Account",
      currency: "GBP",
      balance: 4250.75,
      sortCode: "040004",
      accountNumber: "1234",
    },
  })

  const savingsAccount = await prisma.bankAccount.upsert({
    where: {
      bankConnectionId_externalId: {
        bankConnectionId: bankConnection.id,
        externalId: "savings-account-001",
      },
    },
    update: {},
    create: {
      bankConnectionId: bankConnection.id,
      externalId: "savings-account-001",
      accountType: "SAVINGS",
      displayName: "Savings Account",
      currency: "GBP",
      balance: 12500.0,
      sortCode: "040004",
      accountNumber: "5678",
    },
  })

  console.log("Created 2 bank accounts")

  // Get category IDs
  const categoryMap = new Map<string, string>()
  const allCategories = await prisma.category.findMany()
  for (const cat of allCategories) {
    categoryMap.set(cat.name, cat.id)
  }

  // Create realistic transactions for the past 3 months
  interface TransactionData {
    bankAccountId: string
    externalId: string
    amount: number
    amountInBase: number
    currency: string
    transactionDate: Date
    description: string
    transactionType: string
    transactionCategory: string | null
    merchantName: string | null
    normalisedMerchant: string | null
    categoryId: string | null
    midMarketRate: number | null
    bankRate: number | null
    estimatedFxFee: number | null
    wiseSavings: number | null
  }

  const transactions: TransactionData[] = generateRealisticTransactions(
    currentAccount.id,
    categoryMap
  )

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: {
        bankAccountId_externalId: {
          bankAccountId: tx.bankAccountId,
          externalId: tx.externalId,
        },
      },
      update: {},
      create: tx,
    })
  }
  console.log(`Created ${transactions.length} transactions`)

  // Create exchange rates for the past 30 days
  const exchangeRates = generateExchangeRates()
  for (const rate of exchangeRates) {
    await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_date_source: {
          baseCurrency: rate.baseCurrency,
          date: rate.date,
          source: rate.source,
        },
      },
      update: {},
      create: rate,
    })
  }
  console.log(`Created ${exchangeRates.length} exchange rate entries`)

  // Create sample invoices
  const invoices = [
    {
      userId: user.id,
      clientName: "Acme Corp",
      description: "Web development - January",
      amount: 3500,
      currency: "GBP",
      amountInBase: 3500,
      issuedAt: new Date("2026-01-15"),
      dueAt: new Date("2026-02-15"),
      status: "PAID" as const,
      paidAt: new Date("2026-02-10"),
    },
    {
      userId: user.id,
      clientName: "TechStart Inc",
      description: "Consulting services - February",
      amount: 2800,
      currency: "USD",
      amountInBase: 2212,
      issuedAt: new Date("2026-02-01"),
      dueAt: new Date("2026-03-01"),
      status: "UNPAID" as const,
    },
    {
      userId: user.id,
      clientName: "Design Studio EU",
      description: "UI/UX Design project",
      amount: 4200,
      currency: "EUR",
      amountInBase: 3570,
      issuedAt: new Date("2026-02-10"),
      dueAt: new Date("2026-03-10"),
      status: "UNPAID" as const,
    },
  ]

  for (const invoice of invoices) {
    await prisma.invoice.create({ data: invoice })
  }
  console.log(`Created ${invoices.length} invoices`)

  // ============================================================================
  // Investment Portfolio Seed Data
  // ============================================================================

  // Create sample properties (similar to Cardone Capital funds)
  const properties = [
    {
      id: "prop-10x-growth",
      name: "10X Growth Fund I",
      propertyType: "FUND" as const,
      location: "Multi-State, USA",
      description:
        "Diversified portfolio of Class A multifamily properties across high-growth Sun Belt markets. Focus on value-add opportunities with strong cash flow potential.",
      imageUrl: null,
      targetReturn: 15.0,
      totalRaised: 125000000,
      totalUnits: 2847,
      acquisitionDate: new Date("2023-06-15"),
      status: "DISTRIBUTING" as const,
    },
    {
      id: "prop-equity-ix",
      name: "Equity Fund IX",
      propertyType: "MULTIFAMILY" as const,
      location: "Miami, FL",
      description:
        "Luxury waterfront apartment complex in Miami's Brickell district. 312 units with premium amenities including rooftop pool, fitness center, and concierge services.",
      imageUrl: null,
      targetReturn: 12.5,
      totalRaised: 78000000,
      totalUnits: 312,
      acquisitionDate: new Date("2024-01-20"),
      status: "ACTIVE" as const,
    },
    {
      id: "prop-capital-partners",
      name: "Capital Partners VII",
      propertyType: "MIXED_USE" as const,
      location: "Austin, TX",
      description:
        "Mixed-use development in downtown Austin featuring 180 residential units and 25,000 sq ft of ground-floor retail. Prime location near tech corridor.",
      imageUrl: null,
      targetReturn: 14.0,
      totalRaised: 95000000,
      totalUnits: 180,
      acquisitionDate: new Date("2023-09-01"),
      status: "DISTRIBUTING" as const,
    },
    {
      id: "prop-income-fund",
      name: "Income Fund II",
      propertyType: "COMMERCIAL" as const,
      location: "Phoenix, AZ",
      description:
        "Class A office complex with long-term corporate tenants. Stable cash flow with annual escalations. NNN lease structure minimizes operating expenses.",
      imageUrl: null,
      targetReturn: 10.0,
      totalRaised: 52000000,
      totalUnits: null,
      acquisitionDate: new Date("2022-11-10"),
      status: "DISTRIBUTING" as const,
    },
    {
      id: "prop-opportunity-fund",
      name: "Opportunity Fund IV",
      propertyType: "INDUSTRIAL" as const,
      location: "Dallas, TX",
      description:
        "Industrial warehouse portfolio targeting e-commerce logistics. 850,000 sq ft across 4 properties with major tenant Amazon fulfillment contracts.",
      imageUrl: null,
      targetReturn: 18.0,
      totalRaised: 145000000,
      totalUnits: null,
      acquisitionDate: new Date("2024-03-01"),
      status: "ACTIVE" as const,
    },
    {
      id: "prop-new-fund",
      name: "Growth Fund XI",
      propertyType: "FUND" as const,
      location: "Southeast USA",
      description:
        "New fund targeting workforce housing in high-growth Southeast markets. Focus on suburban multifamily with strong employment fundamentals.",
      imageUrl: null,
      targetReturn: 16.0,
      totalRaised: 35000000,
      totalUnits: null,
      acquisitionDate: null,
      status: "RAISING" as const,
    },
  ]

  for (const property of properties) {
    await prisma.property.upsert({
      where: { id: property.id },
      update: {},
      create: property,
    })
  }
  console.log(`Created ${properties.length} properties`)

  // Create portfolio for demo user
  const portfolio = await prisma.portfolio.upsert({
    where: { id: "demo-portfolio" },
    update: {},
    create: {
      id: "demo-portfolio",
      userId: user.id,
      name: "My Real Estate Portfolio",
      description: "Long-term wealth building through institutional-grade real estate",
    },
  })
  console.log(`Created portfolio: ${portfolio.name}`)

  // Create investments
  const investments = [
    {
      id: "inv-10x-growth",
      portfolioId: portfolio.id,
      propertyId: "prop-10x-growth",
      investedAmount: 50000,
      currentValue: 58500,
      shareCount: 50,
      investmentDate: new Date("2023-07-01"),
      status: "ACTIVE" as const,
    },
    {
      id: "inv-equity-ix",
      portfolioId: portfolio.id,
      propertyId: "prop-equity-ix",
      investedAmount: 25000,
      currentValue: 26750,
      shareCount: 25,
      investmentDate: new Date("2024-02-15"),
      status: "ACTIVE" as const,
    },
    {
      id: "inv-capital-partners",
      portfolioId: portfolio.id,
      propertyId: "prop-capital-partners",
      investedAmount: 35000,
      currentValue: 39200,
      shareCount: 35,
      investmentDate: new Date("2023-10-01"),
      status: "ACTIVE" as const,
    },
    {
      id: "inv-income-fund",
      portfolioId: portfolio.id,
      propertyId: "prop-income-fund",
      investedAmount: 20000,
      currentValue: 21800,
      shareCount: 20,
      investmentDate: new Date("2023-01-15"),
      status: "ACTIVE" as const,
    },
    {
      id: "inv-opportunity-fund",
      portfolioId: portfolio.id,
      propertyId: "prop-opportunity-fund",
      investedAmount: 40000,
      currentValue: 42000,
      shareCount: 40,
      investmentDate: new Date("2024-04-01"),
      status: "ACTIVE" as const,
    },
  ]

  for (const investment of investments) {
    await prisma.investment.upsert({
      where: { id: investment.id },
      update: {},
      create: investment,
    })
  }
  console.log(`Created ${investments.length} investments`)

  // Create distributions (quarterly dividends)
  const distributions = generateDistributions(investments)
  for (const dist of distributions) {
    await prisma.distribution.create({ data: dist })
  }
  console.log(`Created ${distributions.length} distributions`)

  // Create valuations (monthly snapshots for performance chart)
  const valuations = generateValuations(investments)
  for (const val of valuations) {
    await prisma.valuation.create({ data: val })
  }
  console.log(`Created ${valuations.length} valuations`)

  console.log("Seeding complete!")
}

function generateRealisticTransactions(
  accountId: string,
  categoryMap: Map<string, string>
) {
  const transactions: Array<{
    bankAccountId: string
    externalId: string
    amount: number
    amountInBase: number
    currency: string
    transactionDate: Date
    description: string
    transactionType: string
    transactionCategory: string | null
    merchantName: string | null
    normalisedMerchant: string | null
    categoryId: string | null
    midMarketRate: number | null
    bankRate: number | null
    estimatedFxFee: number | null
    wiseSavings: number | null
  }> = []

  const now = new Date()
  let txId = 1

  // UK domestic transactions
  const ukMerchants = [
    { name: "Tesco", category: "Groceries", min: 25, max: 120 },
    { name: "Sainsbury's", category: "Groceries", min: 30, max: 100 },
    { name: "Pret A Manger", category: "Food & Drink", min: 6, max: 15 },
    { name: "Costa Coffee", category: "Food & Drink", min: 3, max: 8 },
    { name: "Uber", category: "Transport", min: 8, max: 35 },
    { name: "TfL", category: "Transport", min: 3, max: 15 },
    { name: "Amazon", category: "Shopping", min: 10, max: 200 },
    { name: "Netflix", category: "Subscriptions", min: 10.99, max: 10.99 },
    { name: "Spotify", category: "Subscriptions", min: 10.99, max: 10.99 },
    { name: "EE Mobile", category: "Bills & Utilities", min: 35, max: 35 },
    { name: "British Gas", category: "Bills & Utilities", min: 80, max: 150 },
    { name: "Deliveroo", category: "Food & Drink", min: 15, max: 40 },
    { name: "Vue Cinema", category: "Entertainment", min: 12, max: 25 },
    { name: "Boots", category: "Health", min: 8, max: 45 },
  ]

  // Foreign currency transactions (travel/remote work)
  const foreignMerchants = [
    { name: "Booking.com", currency: "EUR", category: "Travel", min: 80, max: 250, rate: 1.17 },
    { name: "Airbnb", currency: "EUR", category: "Travel", min: 100, max: 300, rate: 1.17 },
    { name: "Uber Lisbon", currency: "EUR", category: "Transport", min: 8, max: 25, rate: 1.17 },
    { name: "Cafe Lisboa", currency: "EUR", category: "Food & Drink", min: 10, max: 35, rate: 1.17 },
    { name: "Carrefour", currency: "EUR", category: "Groceries", min: 30, max: 80, rate: 1.17 },
    { name: "Stripe Inc", currency: "USD", category: "Income", min: 500, max: 3500, rate: 1.27 },
    { name: "AWS", currency: "USD", category: "Bills & Utilities", min: 20, max: 150, rate: 1.27 },
    { name: "Figma", currency: "USD", category: "Subscriptions", min: 15, max: 15, rate: 1.27 },
    { name: "GitHub", currency: "USD", category: "Subscriptions", min: 7, max: 7, rate: 1.27 },
    { name: "WeWork Bangkok", currency: "THB", category: "Bills & Utilities", min: 8000, max: 15000, rate: 45.2 },
    { name: "Grab Thailand", currency: "THB", category: "Transport", min: 80, max: 250, rate: 45.2 },
    { name: "7-Eleven", currency: "THB", category: "Groceries", min: 150, max: 500, rate: 45.2 },
  ]

  // Generate 3 months of UK transactions
  for (let daysAgo = 0; daysAgo < 90; daysAgo++) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)

    // 2-5 UK transactions per day
    const txPerDay = 2 + Math.floor(Math.random() * 4)

    for (let i = 0; i < txPerDay; i++) {
      const merchant = ukMerchants[Math.floor(Math.random() * ukMerchants.length)]
      const amount = -(merchant.min + Math.random() * (merchant.max - merchant.min))

      const gbpAmount = Math.round(amount * 100) / 100
      transactions.push({
        bankAccountId: accountId,
        externalId: `tx-${txId++}`,
        amount: gbpAmount,
        amountInBase: gbpAmount, // Same as amount for GBP
        currency: "GBP",
        transactionDate: date,
        description: `${merchant.name.toUpperCase()} LONDON GB`,
        transactionType: "DEBIT",
        transactionCategory: merchant.category.toUpperCase().replace(/ & /g, "_AND_").replace(/ /g, "_"),
        merchantName: merchant.name,
        normalisedMerchant: merchant.name,
        categoryId: categoryMap.get(merchant.category) ?? null,
        midMarketRate: null,
        bankRate: null,
        estimatedFxFee: null,
        wiseSavings: null,
      })
    }
  }

  // Generate foreign currency transactions (travel periods)
  // Simulate 2-week trip to Lisbon (30-45 days ago)
  for (let daysAgo = 30; daysAgo < 45; daysAgo++) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)

    const euroMerchants = foreignMerchants.filter((m) => m.currency === "EUR")
    const txPerDay = 2 + Math.floor(Math.random() * 3)

    for (let i = 0; i < txPerDay; i++) {
      const merchant = euroMerchants[Math.floor(Math.random() * euroMerchants.length)]
      const amountForeign = merchant.min + Math.random() * (merchant.max - merchant.min)
      const midMarketRate = 1 / merchant.rate
      const bankMarkup = 0.025 + Math.random() * 0.015 // 2.5-4% markup
      const bankRate = midMarketRate * (1 + bankMarkup)
      const amountGbp = amountForeign * bankRate
      const estimatedFxFee = amountForeign * midMarketRate * bankMarkup
      const wiseSavings = estimatedFxFee * 0.8 // Wise saves ~80% of the fee

      const amountGbpRounded = -Math.round(amountGbp * 100) / 100
      transactions.push({
        bankAccountId: accountId,
        externalId: `tx-${txId++}`,
        amount: amountGbpRounded,
        amountInBase: amountGbpRounded, // Store GBP equivalent
        currency: "EUR",
        transactionDate: date,
        description: `${merchant.name.toUpperCase()} LISBON PT`,
        transactionType: "DEBIT",
        transactionCategory: merchant.category.toUpperCase().replace(/ & /g, "_AND_").replace(/ /g, "_"),
        merchantName: merchant.name,
        normalisedMerchant: merchant.name,
        categoryId: categoryMap.get(merchant.category) ?? null,
        midMarketRate: Math.round(midMarketRate * 10000) / 10000,
        bankRate: Math.round(bankRate * 10000) / 10000,
        estimatedFxFee: Math.round(estimatedFxFee * 100) / 100,
        wiseSavings: Math.round(wiseSavings * 100) / 100,
      })
    }
  }

  // Add some USD income (Stripe payouts)
  for (let month = 0; month < 3; month++) {
    const date = new Date(now)
    date.setMonth(date.getMonth() - month)
    date.setDate(15) // Mid-month payout

    const stripe = foreignMerchants.find((m) => m.name === "Stripe Inc")!
    const amountUsd = 1500 + Math.random() * 2000
    const midMarketRate = 1 / stripe.rate
    const bankMarkup = 0.02
    const bankRate = midMarketRate * (1 - bankMarkup) // Bank takes a cut on incoming
    const amountGbp = amountUsd * bankRate
    const estimatedFxFee = amountUsd * midMarketRate * bankMarkup

    const incomeAmountGbp = Math.round(amountGbp * 100) / 100
    transactions.push({
      bankAccountId: accountId,
      externalId: `tx-${txId++}`,
      amount: incomeAmountGbp,
      amountInBase: incomeAmountGbp,
      currency: "USD",
      transactionDate: date,
      description: "STRIPE PAYOUT",
      transactionType: "CREDIT",
      transactionCategory: "INCOME",
      merchantName: "Stripe",
      normalisedMerchant: "Stripe",
      categoryId: categoryMap.get("Income") ?? null,
      midMarketRate: Math.round(midMarketRate * 10000) / 10000,
      bankRate: Math.round(bankRate * 10000) / 10000,
      estimatedFxFee: Math.round(estimatedFxFee * 100) / 100,
      wiseSavings: Math.round(estimatedFxFee * 0.8 * 100) / 100,
    })
  }

  // Add monthly subscriptions (USD)
  const usdSubs = foreignMerchants.filter(
    (m) => m.currency === "USD" && m.category === "Subscriptions"
  )
  for (const sub of usdSubs) {
    for (let month = 0; month < 3; month++) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - month)
      date.setDate(1)

      const midMarketRate = 1 / sub.rate
      const bankMarkup = 0.03
      const bankRate = midMarketRate * (1 + bankMarkup)
      const amountGbp = sub.min * bankRate
      const estimatedFxFee = sub.min * midMarketRate * bankMarkup

      const subAmountGbp = -Math.round(amountGbp * 100) / 100
      transactions.push({
        bankAccountId: accountId,
        externalId: `tx-${txId++}`,
        amount: subAmountGbp,
        amountInBase: subAmountGbp,
        currency: "USD",
        transactionDate: date,
        description: `${sub.name.toUpperCase()} SAN FRANCISCO US`,
        transactionType: "DEBIT",
        transactionCategory: "SUBSCRIPTIONS",
        merchantName: sub.name,
        normalisedMerchant: sub.name,
        categoryId: categoryMap.get("Subscriptions") ?? null,
        midMarketRate: Math.round(midMarketRate * 10000) / 10000,
        bankRate: Math.round(bankRate * 10000) / 10000,
        estimatedFxFee: Math.round(estimatedFxFee * 100) / 100,
        wiseSavings: Math.round(estimatedFxFee * 0.8 * 100) / 100,
      })
    }
  }

  return transactions
}

function generateExchangeRates() {
  const rates: Array<{
    baseCurrency: string
    date: Date
    rates: Record<string, number>
    source: string
  }> = []

  const now = new Date()

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(now)
    date.setDate(date.getDate() - daysAgo)
    const rateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    // Add some realistic variation to rates
    const variation = 1 + (Math.random() - 0.5) * 0.02 // +/- 1%

    rates.push({
      baseCurrency: "USD",
      date: rateDate,
      rates: {
        GBP: 0.79 * variation,
        EUR: 0.92 * variation,
        AUD: 1.53 * variation,
        CAD: 1.36 * variation,
        CHF: 0.88 * variation,
        JPY: 149.5 * variation,
        SGD: 1.34 * variation,
        THB: 35.6 * variation,
        HKD: 7.82 * variation,
        NZD: 1.64 * variation,
      },
      source: "openexchangerates",
    })
  }

  return rates
}

function generateDistributions(
  investments: Array<{
    id: string
    investedAmount: number
    investmentDate: Date
  }>
) {
  const distributions: Array<{
    investmentId: string
    amount: number
    distributionType: "DIVIDEND" | "PREFERRED_RETURN" | "CAPITAL_RETURN" | "SPECIAL"
    distributionDate: Date
    status: "PENDING" | "PROCESSING" | "PAID"
    description: string | null
  }> = []

  const now = new Date()

  for (const investment of investments) {
    const investDate = new Date(investment.investmentDate)
    const monthsSinceInvest = Math.floor(
      (now.getTime() - investDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    )

    // Generate quarterly distributions since investment date
    const quarters = Math.floor(monthsSinceInvest / 3)

    for (let q = 0; q < quarters; q++) {
      const distDate = new Date(investDate)
      distDate.setMonth(distDate.getMonth() + (q + 1) * 3)

      // Skip if distribution date is in the future
      if (distDate > now) continue

      // Calculate quarterly distribution (roughly 2-3% of invested amount per quarter)
      const quarterlyRate = 0.02 + Math.random() * 0.01
      const amount = Math.round(investment.investedAmount * quarterlyRate * 100) / 100

      // Determine distribution type
      const types: Array<"DIVIDEND" | "PREFERRED_RETURN"> = ["DIVIDEND", "PREFERRED_RETURN"]
      const distributionType = types[Math.floor(Math.random() * types.length)]

      // Determine status (recent ones might be pending/processing)
      const daysAgo = Math.floor((now.getTime() - distDate.getTime()) / (24 * 60 * 60 * 1000))
      let status: "PENDING" | "PROCESSING" | "PAID" = "PAID"
      if (daysAgo < 7) status = "PROCESSING"
      if (daysAgo < 3) status = "PENDING"

      distributions.push({
        investmentId: investment.id,
        amount,
        distributionType,
        distributionDate: distDate,
        status,
        description: `Q${Math.floor((distDate.getMonth() / 3) + 1)} ${distDate.getFullYear()} ${distributionType === "DIVIDEND" ? "Cash Distribution" : "Preferred Return"}`,
      })
    }
  }

  return distributions
}

function generateValuations(
  investments: Array<{
    id: string
    investedAmount: number
    currentValue: number
    investmentDate: Date
  }>
) {
  const valuations: Array<{
    investmentId: string
    value: number
    valuationDate: Date
    source: string
    notes: string | null
  }> = []

  const now = new Date()

  for (const investment of investments) {
    const investDate = new Date(investment.investmentDate)
    const monthsSinceInvest = Math.floor(
      (now.getTime() - investDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    )

    // Generate monthly valuations
    const totalGrowth = investment.currentValue / investment.investedAmount - 1
    const monthlyGrowthRate = totalGrowth / Math.max(monthsSinceInvest, 1)

    for (let m = 0; m <= monthsSinceInvest && m <= 18; m++) {
      const valDate = new Date(investDate)
      valDate.setMonth(valDate.getMonth() + m)

      // Skip if valuation date is in the future
      if (valDate > now) continue

      // Calculate value with some randomness
      const baseGrowth = monthlyGrowthRate * m
      const randomVariation = (Math.random() - 0.5) * 0.02 // +/- 1% variation
      const value = Math.round(investment.investedAmount * (1 + baseGrowth + randomVariation) * 100) / 100

      valuations.push({
        investmentId: investment.id,
        value,
        valuationDate: valDate,
        source: m % 3 === 0 ? "quarterly_report" : "estimate",
        notes: m % 3 === 0 ? `Q${Math.floor((valDate.getMonth() / 3) + 1)} ${valDate.getFullYear()} NAV Report` : null,
      })
    }
  }

  return valuations
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
