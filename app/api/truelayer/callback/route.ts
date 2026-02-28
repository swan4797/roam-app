import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/encryption"
import {
  exchangeCodeForTokens,
  getConnectionInfo,
  getAccounts,
  getAccountBalance,
} from "@/lib/truelayer"
import { SyncStatus } from "@/generated/prisma/client"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXTAUTH_URL!

  // Handle user cancellation or error
  if (error) {
    console.error("TrueLayer auth error:", error)
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=${encodeURIComponent(error)}`, baseUrl)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard/accounts?error=invalid_response", baseUrl))
  }

  // Decode state to get user ID
  let stateData: { userId: string; nonce: string }
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString())
  } catch {
    return NextResponse.redirect(new URL("/dashboard/accounts?error=invalid_state", baseUrl))
  }

  const { userId } = stateData

  // Verify user exists
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.redirect(new URL("/dashboard/accounts?error=user_not_found", baseUrl))
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get connection info (provider details)
    const connectionInfo = await getConnectionInfo(tokens.access_token)

    // Calculate token expiry
    const accessTokenExpiresAt = new Date()
    accessTokenExpiresAt.setSeconds(
      accessTokenExpiresAt.getSeconds() + tokens.expires_in
    )

    // Parse consent expiry if available
    let consentExpiresAt: Date | undefined
    if (connectionInfo.consent_expires_at) {
      consentExpiresAt = new Date(connectionInfo.consent_expires_at)
    }

    // Check for existing connection with same provider
    const existingConnection = await prisma.bankConnection.findFirst({
      where: {
        userId,
        institutionId: connectionInfo.provider.provider_id,
      },
    })

    let bankConnectionId: string

    if (existingConnection) {
      // Update existing connection with new tokens
      await prisma.bankConnection.update({
        where: { id: existingConnection.id },
        data: {
          accessTokenEncrypted: encrypt(tokens.access_token),
          refreshTokenEncrypted: encrypt(tokens.refresh_token),
          accessTokenExpiresAt,
          consentExpiresAt,
          syncStatus: SyncStatus.PENDING,
          syncError: null,
        },
      })
      bankConnectionId = existingConnection.id
    } else {
      // Create new bank connection
      const bankConnection = await prisma.bankConnection.create({
        data: {
          userId,
          institutionId: connectionInfo.provider.provider_id,
          institutionName: connectionInfo.provider.display_name,
          accessTokenEncrypted: encrypt(tokens.access_token),
          refreshTokenEncrypted: encrypt(tokens.refresh_token),
          accessTokenExpiresAt,
          consentExpiresAt,
          syncStatus: SyncStatus.PENDING,
        },
      })
      bankConnectionId = bankConnection.id
    }

    // Fetch and store accounts
    const accounts = await getAccounts(tokens.access_token)

    for (const account of accounts) {
      // Get balance for each account
      let balance = 0
      try {
        const balanceData = await getAccountBalance(
          tokens.access_token,
          account.account_id
        )
        balance = balanceData.current
      } catch (e) {
        console.error(`Failed to fetch balance for ${account.account_id}:`, e)
      }

      // Upsert account
      await prisma.bankAccount.upsert({
        where: {
          bankConnectionId_externalId: {
            bankConnectionId,
            externalId: account.account_id,
          },
        },
        create: {
          bankConnectionId,
          externalId: account.account_id,
          accountType: account.account_type,
          displayName: account.display_name,
          currency: account.currency,
          balance,
          iban: account.account_number?.iban,
          sortCode: account.account_number?.sort_code,
          accountNumber: account.account_number?.number,
        },
        update: {
          displayName: account.display_name,
          currency: account.currency,
          balance,
          iban: account.account_number?.iban,
          sortCode: account.account_number?.sort_code,
          accountNumber: account.account_number?.number,
        },
      })
    }

    // Update sync status
    await prisma.bankConnection.update({
      where: { id: bankConnectionId },
      data: {
        syncStatus: SyncStatus.COMPLETED,
        lastSyncedAt: new Date(),
      },
    })

    return NextResponse.redirect(new URL("/dashboard/accounts?success=connected", baseUrl))
  } catch (error) {
    console.error("TrueLayer callback error:", error)
    return NextResponse.redirect(
      new URL("/dashboard/accounts?error=connection_failed", baseUrl)
    )
  }
}
