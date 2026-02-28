export type DocumentStatus = "pending" | "signed" | "expired" | "declined"

export interface Document {
  id: string
  title: string
  description: string
  status: DocumentStatus
  createdAt: string
  expiresAt?: string
  signedAt?: string
  fileUrl?: string
}

export interface SignatureData {
  type: "draw" | "type" | "upload"
  data: string // Base64 for draw/upload, text for type
  timestamp: string
}

export interface SigningSession {
  documentId: string
  signerName: string
  signerEmail: string
  signature?: SignatureData
  agreedToTerms: boolean
  ipAddress?: string
}
