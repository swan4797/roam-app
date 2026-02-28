"use client"

import { useEffect } from "react"
import { useThemeStore, type Theme } from "@/lib/stores/theme-store"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const effectiveTheme = theme === "system" ? getSystemTheme() : theme

  root.setAttribute("data-theme", effectiveTheme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme)

  useEffect(() => {
    applyTheme(theme)

    // Listen for system theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = () => applyTheme("system")

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  // Prevent flash of wrong theme
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return <>{children}</>
}
