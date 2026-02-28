"use client"

import { useState } from "react"
import { usePortfolioStore } from "@/lib/stores/portfolio-store"
import type { SerializedPortfolio } from "@/types/portfolio"

interface Props {
  portfolios: SerializedPortfolio[]
}

export function PortfolioSelector({ portfolios }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const { filters, setPortfolioId } = usePortfolioStore()

  const selectedPortfolio = portfolios.find((p) => p.id === filters.portfolioId)

  const handleSelect = (id: string | null) => {
    setPortfolioId(id)
    setIsOpen(false)
  }

  // Don't render if there are no portfolios or only one
  if (portfolios.length <= 1) {
    return null
  }

  return (
    <div className="portfolio-selector">
      <button
        className="portfolio-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{selectedPortfolio?.name || "All Portfolios"}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="portfolio-selector__backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="portfolio-selector__dropdown">
            <button
              className={`portfolio-selector__option ${
                !filters.portfolioId ? "is-active" : ""
              }`}
              onClick={() => handleSelect(null)}
              type="button"
            >
              All Portfolios
            </button>
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                className={`portfolio-selector__option ${
                  filters.portfolioId === portfolio.id ? "is-active" : ""
                }`}
                onClick={() => handleSelect(portfolio.id)}
                type="button"
              >
                {portfolio.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
