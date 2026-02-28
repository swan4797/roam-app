import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateAuthUrl } from "@/lib/truelayer"
import { randomBytes } from "crypto"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Generate state token to prevent CSRF
  // Include user ID so we can associate the connection after callback
  const stateData = {
    userId: session.user.id,
    nonce: randomBytes(16).toString("hex"),
  }
  const state = Buffer.from(JSON.stringify(stateData)).toString("base64url")

  try {
    const authUrl = generateAuthUrl(state)
    console.log("TrueLayer auth URL generated:", authUrl.substring(0, 100) + "...")
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Failed to generate TrueLayer auth URL:", error)
    const errorMessage = error instanceof Error ? error.message : "unknown"
    return NextResponse.redirect(
      new URL(`/dashboard/accounts?error=config&detail=${encodeURIComponent(errorMessage)}`, process.env.NEXTAUTH_URL!)
    )
  }
}
