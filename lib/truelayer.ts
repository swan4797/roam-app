import { decrypt } from "./encryption"

const TRUELAYER_AUTH_URL = {
  sandbox: "https://auth.truelayer-sandbox.com",
  live: "https://auth.truelayer.com",
}

const TRUELAYER_API_URL = {
  sandbox: "https://api.truelayer-sandbox.com",
  live: "https://api.truelayer.com",
}

function getEnv(): "sandbox" | "live" {
  return (process.env.TRUELAYER_ENV as "sandbox" | "live") ?? "sandbox"
}

function getAuthUrl() {
  return TRUELAYER_AUTH_URL[getEnv()]
}

function getApiUrl() {
  return TRUELAYER_API_URL[getEnv()]
}

export function generateAuthUrl(state: string): string {
  const clientId = process.env.TRUELAYER_CLIENT_ID
  const redirectUri = process.env.TRUELAYER_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw new Error("TrueLayer credentials not configured")
  }

  const scopes = [
    "info",
    "accounts",
    "balance",
    "transactions",
    "offline_access",
  ]

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(" "),
    state,
  })

  // In sandbox mode, add mock provider for testing
  if (getEnv() === "sandbox") {
    params.set("providers", "uk-ob-all uk-oauth-all")
  }

  return `${getAuthUrl()}/?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const clientId = process.env.TRUELAYER_CLIENT_ID
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET
  const redirectUri = process.env.TRUELAYER_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("TrueLayer credentials not configured")
  }

  const response = await fetch(`${getAuthUrl()}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return response.json()
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const clientId = process.env.TRUELAYER_CLIENT_ID
  const clientSecret = process.env.TRUELAYER_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("TrueLayer credentials not configured")
  }

  const response = await fetch(`${getAuthUrl()}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${error}`)
  }

  return response.json()
}

interface TrueLayerAccount {
  account_id: string
  account_type: string
  display_name: string
  currency: string
  account_number?: {
    iban?: string
    number?: string
    sort_code?: string
  }
  provider?: {
    provider_id: string
    display_name: string
  }
}

interface AccountsResponse {
  results: TrueLayerAccount[]
}

export async function getAccounts(
  accessToken: string
): Promise<TrueLayerAccount[]> {
  const response = await fetch(`${getApiUrl()}/data/v1/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch accounts: ${error}`)
  }

  const data: AccountsResponse = await response.json()
  return data.results
}

interface TrueLayerBalance {
  currency: string
  available: number
  current: number
  overdraft?: number
}

interface BalanceResponse {
  results: TrueLayerBalance[]
}

export async function getAccountBalance(
  accessToken: string,
  accountId: string
): Promise<TrueLayerBalance> {
  const response = await fetch(
    `${getApiUrl()}/data/v1/accounts/${accountId}/balance`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch balance: ${error}`)
  }

  const data: BalanceResponse = await response.json()
  return data.results[0]
}

interface TrueLayerTransaction {
  transaction_id: string
  timestamp: string
  description: string
  transaction_type: string
  transaction_category: string
  transaction_classification: string[]
  amount: number
  currency: string
  merchant_name?: string
  running_balance?: {
    amount: number
    currency: string
  }
  meta?: {
    provider_transaction_id?: string
  }
}

interface TransactionsResponse {
  results: TrueLayerTransaction[]
}

export async function getTransactions(
  accessToken: string,
  accountId: string,
  from?: Date,
  to?: Date
): Promise<TrueLayerTransaction[]> {
  const params = new URLSearchParams()

  if (from) {
    params.set("from", from.toISOString())
  }
  if (to) {
    params.set("to", to.toISOString())
  }

  const url = `${getApiUrl()}/data/v1/accounts/${accountId}/transactions${
    params.toString() ? `?${params.toString()}` : ""
  }`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch transactions: ${error}`)
  }

  const data: TransactionsResponse = await response.json()
  return data.results
}

interface TrueLayerConnectionInfo {
  credentials_id: string
  client_id: string
  provider: {
    provider_id: string
    display_name: string
    logo_uri: string
  }
  consent_status: string
  consent_created_at: string
  consent_expires_at?: string
}

interface InfoResponse {
  results: TrueLayerConnectionInfo[]
}

export async function getConnectionInfo(
  accessToken: string
): Promise<TrueLayerConnectionInfo> {
  const response = await fetch(`${getApiUrl()}/data/v1/info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch connection info: ${error}`)
  }

  const data: InfoResponse = await response.json()
  return data.results[0]
}

export type {
  TrueLayerAccount,
  TrueLayerBalance,
  TrueLayerTransaction,
  TrueLayerConnectionInfo,
  TokenResponse,
}
