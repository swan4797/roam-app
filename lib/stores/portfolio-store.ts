import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import type { PropertyType } from "@/generated/prisma/client"
import type {
  PortfolioFilters,
  PortfolioUIState,
  PortfolioOverviewStats,
} from "@/types/portfolio"

interface PortfolioStore {
  // Filters
  filters: PortfolioFilters
  setPortfolioId: (id: string | null) => void
  setDateRange: (start: Date | null, end: Date | null) => void
  setPropertyTypeFilter: (type: PropertyType | null) => void
  resetFilters: () => void

  // UI State
  ui: PortfolioUIState
  setLoading: (loading: boolean) => void
  setSelectedInvestment: (id: string | null) => void
  setChartView: (view: "performance" | "allocation") => void
  setTableSort: (column: string, direction: "asc" | "desc") => void

  // Cached data (for optimistic updates)
  cachedOverview: PortfolioOverviewStats | null
  setCachedOverview: (data: PortfolioOverviewStats | null) => void
}

const initialFilters: PortfolioFilters = {
  portfolioId: null,
  dateRange: {
    start: null,
    end: null,
  },
  propertyType: null,
}

const initialUIState: PortfolioUIState = {
  isLoading: false,
  selectedInvestmentId: null,
  chartView: "performance",
  tableSort: {
    column: "currentValue",
    direction: "desc",
  },
}

export const usePortfolioStore = create<PortfolioStore>()(
  devtools(
    persist(
      (set) => ({
        // Filters
        filters: initialFilters,
        setPortfolioId: (id) =>
          set((state) => ({
            filters: { ...state.filters, portfolioId: id },
          })),
        setDateRange: (start, end) =>
          set((state) => ({
            filters: { ...state.filters, dateRange: { start, end } },
          })),
        setPropertyTypeFilter: (type) =>
          set((state) => ({
            filters: { ...state.filters, propertyType: type },
          })),
        resetFilters: () => set({ filters: initialFilters }),

        // UI State
        ui: initialUIState,
        setLoading: (loading) =>
          set((state) => ({
            ui: { ...state.ui, isLoading: loading },
          })),
        setSelectedInvestment: (id) =>
          set((state) => ({
            ui: { ...state.ui, selectedInvestmentId: id },
          })),
        setChartView: (view) =>
          set((state) => ({
            ui: { ...state.ui, chartView: view },
          })),
        setTableSort: (column, direction) =>
          set((state) => ({
            ui: { ...state.ui, tableSort: { column, direction } },
          })),

        // Cached data
        cachedOverview: null,
        setCachedOverview: (data) => set({ cachedOverview: data }),
      }),
      {
        name: "portfolio-store",
        partialize: (state) => ({
          filters: state.filters,
          ui: {
            chartView: state.ui.chartView,
            tableSort: state.ui.tableSort,
          },
        }),
      }
    ),
    { name: "PortfolioStore" }
  )
)
