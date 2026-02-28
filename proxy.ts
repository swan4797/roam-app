import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Redirect unauthenticated users to login
  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Allow authenticated requests to continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protect all dashboard routes
    "/dashboard/:path*",
    // Protect API routes (except auth)
    "/api/truelayer/:path*",
  ],
}
