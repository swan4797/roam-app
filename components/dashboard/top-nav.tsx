"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme"

interface Props {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/fx-analysis", label: "Analytics" },
  { href: "/dashboard/transactions", label: "History" },
  { href: "/dashboard/groups", label: "Groups" },
  { href: "/dashboard/accounts", label: "Accounts" },
]

export function TopNav({ user }: Props) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email?.[0]?.toUpperCase() ?? "U"
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="top-nav">
        {/* Left: Logo */}
        <div className="top-nav__left">
          <Link href="/dashboard" className="top-nav__brand">
            <div className="top-nav__logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <span className="top-nav__name">Roam</span>
          </Link>
        </div>

        {/* Center: Navigation Pills */}
        <nav className="top-nav__center">
          <div className="nav-pills">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-pills__item ${isActive(item.href) ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Right: Actions */}
        <div className="top-nav__right">
          <button className="top-nav__action" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <button className="top-nav__action" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <ThemeToggle />

          {/* User Avatar */}
          <div className="top-nav__user">
            <button
              className="top-nav__avatar"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              aria-label="User menu"
            >
              {user.image ? (
                <img src={user.image} alt="" />
              ) : (
                getInitials(user.name, user.email)
              )}
            </button>

            {isUserMenuOpen && (
              <div className="top-nav__dropdown">
                <div className="top-nav__dropdown-header">
                  <div className="top-nav__dropdown-name">{user.name ?? "User"}</div>
                  <div className="top-nav__dropdown-email">{user.email}</div>
                </div>
                <div className="top-nav__dropdown-divider" />
                <Link href="/dashboard/settings" className="top-nav__dropdown-item">
                  Settings
                </Link>
                <button
                  className="top-nav__dropdown-item"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="top-nav__mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          <div
            className="mobile-nav-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobile-nav">
            <nav className="mobile-nav__items">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mobile-nav__item ${isActive(item.href) ? "is-active" : ""}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mobile-nav__footer">
              <Link
                href="/dashboard/settings"
                className="mobile-nav__item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                className="mobile-nav__item"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Log out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="top-nav__overlay"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </>
  )
}
