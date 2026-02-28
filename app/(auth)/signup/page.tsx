import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SignupForm } from "@/components/auth/signup-form"

export default async function SignupPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: "#111827" }}>
            Roam
          </h1>
          <p style={{ marginTop: "0.5rem", color: "#6b7280" }}>
            Personal finance for digital nomads
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
