import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { getCurrentUser } from "@/lib/dal/user"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="app-layout">
      {/* Skip links for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#main-nav" className="skip-link">
        Skip to navigation
      </a>

      <DashboardNav user={session.user} />
      <main className="main-content" id="main-content" role="main">
        <header className="page-header" role="banner">
          <div className="page-header__left">
            <h1 className="page-header__greeting">
              Good {getGreeting()}, {session.user.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="page-header__subtitle">
              Stay on top of your finances, monitor spending, and track FX fees.
            </p>
          </div>
          <div className="page-header__right">
            <div className="page-header__search" role="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Search transactions..."
                aria-label="Search transactions"
              />
            </div>
            <div className="page-header__actions">
              <button
                className="page-header__icon-btn"
                aria-label="View notifications"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "morning"
  if (hour < 17) return "afternoon"
  return "evening"
}
