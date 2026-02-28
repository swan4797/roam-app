import { schedules } from "@trigger.dev/sdk/v3"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/encryption"
import { refreshAccessToken } from "@/lib/truelayer"

export const refreshExpiringTokens = schedules.task({
  id: "refresh-expiring-tokens",
  cron: "0 */4 * * *", // Every 4 hours
  run: async () => {
    // Get connections where access token expires within 48 hours
    const threshold = new Date()
    threshold.setHours(threshold.getHours() + 48)

    const connections = await prisma.bankConnection.findMany({
      where: {
        accessTokenExpiresAt: { lte: threshold },
      },
      select: {
        id: true,
        institutionName: true,
        refreshTokenEncrypted: true,
      },
    })

    let refreshed = 0
    let failed = 0

    for (const connection of connections) {
      try {
        const refreshToken = decrypt(connection.refreshTokenEncrypted)
        const newTokens = await refreshAccessToken(refreshToken)

        const accessTokenExpiresAt = new Date()
        accessTokenExpiresAt.setSeconds(
          accessTokenExpiresAt.getSeconds() + newTokens.expires_in
        )

        await prisma.bankConnection.update({
          where: { id: connection.id },
          data: {
            accessTokenEncrypted: encrypt(newTokens.access_token),
            refreshTokenEncrypted: encrypt(newTokens.refresh_token),
            accessTokenExpiresAt,
          },
        })

        refreshed++
      } catch (error) {
        console.error(
          `Failed to refresh token for ${connection.institutionName}:`,
          error
        )

        // Mark connection as needing re-authentication
        await prisma.bankConnection.update({
          where: { id: connection.id },
          data: {
            syncError: "Token refresh failed - re-authentication required",
          },
        })

        failed++
      }
    }

    return { refreshed, failed, total: connections.length }
  },
})
