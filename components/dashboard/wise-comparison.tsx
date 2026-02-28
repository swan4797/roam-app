"use client"

interface Props {
  totalSavings: number
}

export function WiseComparison({ totalSavings }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount)
  }

  return (
    <div
      className="card"
      style={{
        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        color: "#fff"
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            width: 40,
            height: 40,
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, opacity: 0.9 }}>
          Potential Wise Savings
        </h3>
      </div>

      <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {formatCurrency(totalSavings)}
      </div>

      <p style={{ fontSize: "0.875rem", opacity: 0.9, marginBottom: "1.5rem" }}>
        Estimated savings if you had used Wise for all foreign transactions this month
      </p>

      <a
        href="https://wise.com/invite/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn"
        style={{
          backgroundColor: "#fff",
          color: "#059669",
          fontWeight: 600,
          padding: "0.75rem 1.5rem"
        }}
      >
        Try Wise — Get your first transfer free
      </a>

      <p style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "1rem" }}>
        Affiliate link — we may earn a commission
      </p>
    </div>
  )
}
