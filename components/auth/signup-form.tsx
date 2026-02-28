"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import Link from "next/link"
import { signupAction } from "@/actions/auth"
import { signIn } from "next-auth/react"

export function SignupForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: ["Passwords do not match"] })
      return
    }

    startTransition(async () => {
      const result = await signupAction(formData)

      if (result.error) {
        if (typeof result.error === "object") {
          setErrors(result.error as Record<string, string[]>)
        } else {
          setGeneralError(result.error as string)
        }
        return
      }

      // Auto sign in after successful signup
      const signInResult = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      })

      if (signInResult?.error) {
        setGeneralError("Account created but sign in failed. Please sign in manually.")
      } else {
        router.push("/dashboard")
      }
    })
  }

  return (
    <div className="card">
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          Create your account
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Start tracking your finances across currencies
        </p>
      </div>

      {generalError && (
        <div
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            backgroundColor: "#FEE2E2",
            border: "1px solid #FECACA",
            borderRadius: 8,
            fontSize: "0.875rem",
            color: "#DC2626",
          }}
        >
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={`input ${errors.name ? "input--error" : ""}`}
            placeholder="John Smith"
            required
          />
          {errors.name && (
            <span className="help-text help-text--error">{errors.name[0]}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className={`input ${errors.email ? "input--error" : ""}`}
            placeholder="you@example.com"
            required
          />
          {errors.email && (
            <span className="help-text help-text--error">{errors.email[0]}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={`input ${errors.password ? "input--error" : ""}`}
            placeholder="••••••••"
            minLength={8}
            required
          />
          {errors.password ? (
            <span className="help-text help-text--error">{errors.password[0]}</span>
          ) : (
            <span className="help-text">Minimum 8 characters</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="label">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className={`input ${errors.confirmPassword ? "input--error" : ""}`}
            placeholder="••••••••"
            required
          />
          {errors.confirmPassword && (
            <span className="help-text help-text--error">
              {errors.confirmPassword[0]}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`btn btn--primary btn--block ${isPending ? "is-loading" : ""}`}
        >
          {isPending ? "Creating account..." : "Create account"}
        </button>
      </form>

      <div
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          fontSize: "0.875rem",
          color: "#6b7280",
        }}
      >
        Already have an account?{" "}
        <Link href="/login" style={{ color: "#F97316", fontWeight: 500 }}>
          Sign in
        </Link>
      </div>
    </div>
  )
}
