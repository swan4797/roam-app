import Link from "next/link"

export default function HomePage() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav__container">
          <Link href="/" className="landing-nav__logo">
            Roam
          </Link>
          <div className="landing-nav__actions">
            <Link href="/login" className="landing-nav__link">
              Log in
            </Link>
            <Link href="/signup" className="btn btn--primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero__container">
          <div className="landing-hero__badge">
            <span>Built for digital nomads</span>
          </div>
          <h1 className="landing-hero__title">
            Stop losing money on
            <span className="landing-hero__highlight"> hidden FX fees</span>
          </h1>
          <p className="landing-hero__subtitle">
            Track your spending across currencies, see exactly how much banks charge you
            in foreign exchange fees, and discover how much you could save.
          </p>
          <div className="landing-hero__actions">
            <Link href="/signup" className="btn btn--primary btn--lg">
              Start tracking free
            </Link>
            <Link href="/login" className="btn btn--outline-light btn--lg">
              Sign in
            </Link>
          </div>
          <p className="landing-hero__note">
            No credit card required. Connect your bank in 2 minutes.
          </p>
        </div>

        {/* Hero Visual */}
        <div className="landing-hero__visual">
          <div className="landing-hero__card">
            <div className="landing-hero__card-header">
              <span className="landing-hero__card-badge">This Month</span>
            </div>
            <div className="landing-hero__card-content">
              <div className="landing-hero__stat">
                <span className="landing-hero__stat-label">FX Fees Paid</span>
                <span className="landing-hero__stat-value">£47.82</span>
              </div>
              <div className="landing-hero__stat landing-hero__stat--highlight">
                <span className="landing-hero__stat-label">Could Save With Wise</span>
                <span className="landing-hero__stat-value">£38.25</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-features__container">
          <div className="landing-features__header">
            <h2 className="landing-features__title">
              Everything you need to track FX fees
            </h2>
            <p className="landing-features__subtitle">
              Connect your bank accounts and get instant visibility into your multi-currency spending.
            </p>
          </div>

          <div className="landing-features__grid">
            <div className="landing-feature">
              <div className="landing-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="landing-feature__title">Multi-Currency Tracking</h3>
              <p className="landing-feature__description">
                See all your spending across GBP, EUR, USD, and 15+ other currencies in one place.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="landing-feature__title">Real-Time FX Analysis</h3>
              <p className="landing-feature__description">
                Compare your bank&apos;s rates against mid-market rates to see exactly what you&apos;re paying.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="landing-feature__title">Savings Calculator</h3>
              <p className="landing-feature__description">
                See how much you could save by switching to services like Wise or Revolut.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <h3 className="landing-feature__title">Spending Categories</h3>
              <p className="landing-feature__description">
                Automatically categorise your transactions and understand where your money goes.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 className="landing-feature__title">Smart Alerts</h3>
              <p className="landing-feature__description">
                Get notified when you&apos;re paying high FX fees or when there&apos;s a better option.
              </p>
            </div>

            <div className="landing-feature">
              <div className="landing-feature__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3 className="landing-feature__title">Bank Sync</h3>
              <p className="landing-feature__description">
                Securely connect UK banks via Open Banking. Your data stays private and encrypted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="landing-steps">
        <div className="landing-steps__container">
          <h2 className="landing-steps__title">Get started in minutes</h2>

          <div className="landing-steps__grid">
            <div className="landing-step">
              <div className="landing-step__number">1</div>
              <h3 className="landing-step__title">Create your account</h3>
              <p className="landing-step__description">
                Sign up for free with just your email. No credit card required.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step__number">2</div>
              <h3 className="landing-step__title">Connect your banks</h3>
              <p className="landing-step__description">
                Securely link your UK bank accounts using Open Banking.
              </p>
            </div>

            <div className="landing-step">
              <div className="landing-step__number">3</div>
              <h3 className="landing-step__title">See your savings</h3>
              <p className="landing-step__description">
                Instantly see how much you&apos;re paying in FX fees and how to save.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-cta__container">
          <h2 className="landing-cta__title">
            Ready to stop overpaying on FX?
          </h2>
          <p className="landing-cta__subtitle">
            Join thousands of digital nomads who are saving money on currency conversions.
          </p>
          <div className="landing-cta__actions">
            <Link href="/signup" className="btn btn--dark btn--lg">
              Get started for free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer__container">
          <div className="landing-footer__brand">
            <span className="landing-footer__logo">Roam</span>
            <p className="landing-footer__tagline">
              Personal finance for digital nomads
            </p>
          </div>
          <div className="landing-footer__links">
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </div>
          <p className="landing-footer__copyright">
            &copy; {new Date().getFullYear()} Roam. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
