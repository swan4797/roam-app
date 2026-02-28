import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt } from "@/lib/encryption"
import { SyncStatus } from "@/generated/prisma/client"

export interface CreateBankConnectionInput {
  institutionId: string
  institutionName: string
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  consentExpiresAt?: Date
}

export async function createBankConnection(input: CreateBankConnectionInput) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  return prisma.bankConnection.create({
    data: {
      userId: session.user.id,
      institutionId: input.institutionId,
      institutionName: input.institutionName,
      accessTokenEncrypted: encrypt(input.accessToken),
      refreshTokenEncrypted: encrypt(input.refreshToken),
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      consentExpiresAt: input.consentExpiresAt,
      syncStatus: SyncStatus.PENDING,
    },
  })
}

export async function getBankConnections() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const connections = await prisma.bankConnection.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      institutionId: true,
      institutionName: true,
      accessTokenExpiresAt: true,
      consentExpiresAt: true,
      lastSyncedAt: true,
      syncStatus: true,
      syncError: true,
      createdAt: true,
      bankAccounts: {
        select: {
          id: true,
          displayName: true,
          accountType: true,
          currency: true,
          balance: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return connections.map((conn) => ({
    ...conn,
    bankAccounts: conn.bankAccounts.map((acc) => ({
      ...acc,
      balance: acc.balance?.toNumber() ?? null,
    })),
  }))
}

export async function getBankConnection(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const connection = await prisma.bankConnection.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      bankAccounts: true,
    },
  })

  if (!connection) throw new Error("Bank connection not found")
  return connection
}

export async function deleteBankConnection(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const connection = await prisma.bankConnection.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!connection) throw new Error("Bank connection not found")

  // Cascade delete handles accounts and transactions
  return prisma.bankConnection.delete({
    where: { id },
  })
}

export async function updateBankConnectionTokens(
  id: string,
  tokens: {
    accessToken: string
    refreshToken: string
    accessTokenExpiresAt: Date
  }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const connection = await prisma.bankConnection.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!connection) throw new Error("Bank connection not found")

  return prisma.bankConnection.update({
    where: { id },
    data: {
      accessTokenEncrypted: encrypt(tokens.accessToken),
      refreshTokenEncrypted: encrypt(tokens.refreshToken),
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    },
  })
}

export async function updateSyncStatus(
  id: string,
  status: SyncStatus,
  error?: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const connection = await prisma.bankConnection.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!connection) throw new Error("Bank connection not found")

  return prisma.bankConnection.update({
    where: { id },
    data: {
      syncStatus: status,
      syncError: error ?? null,
      lastSyncedAt: status === SyncStatus.COMPLETED ? new Date() : undefined,
    },
  })
}

// Internal function for background jobs - no session check
// Only call this from authenticated Trigger.dev jobs
export async function getConnectionWithTokens(id: string, userId: string) {
  const connection = await prisma.bankConnection.findFirst({
    where: { id, userId },
  })

  if (!connection) throw new Error("Bank connection not found")

  return {
    ...connection,
    accessToken: decrypt(connection.accessTokenEncrypted),
    refreshToken: decrypt(connection.refreshTokenEncrypted),
  }
}

export async function getConnectionsNeedingTokenRefresh() {
  // Get connections where access token expires within 48 hours
  const threshold = new Date()
  threshold.setHours(threshold.getHours() + 48)

  return prisma.bankConnection.findMany({
    where: {
      accessTokenExpiresAt: { lte: threshold },
    },
    select: {
      id: true,
      userId: true,
      institutionName: true,
      accessTokenExpiresAt: true,
    },
  })
}

export async function getConnectionsDueForSync() {
  // Get connections that haven't synced in the last hour
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  return prisma.bankConnection.findMany({
    where: {
      OR: [
        { lastSyncedAt: null },
        { lastSyncedAt: { lte: oneHourAgo } },
      ],
      syncStatus: { not: SyncStatus.SYNCING },
    },
    select: {
      id: true,
      userId: true,
      institutionName: true,
      lastSyncedAt: true,
    },
  })
}
