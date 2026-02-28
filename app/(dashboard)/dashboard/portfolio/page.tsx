import { Suspense } from "react"
import {
  getPortfolioOverview,
  getPortfolios,
  getInvestments,
  getDistributions,
  getPerformanceData,
  getAllocationData,
} from "@/lib/dal/portfolio"
import {
  PortfolioOverview,
  PortfolioPerformanceChart,
  AssetAllocationChart,
  HoldingsTable,
  DistributionHistory,
  PortfolioSelector,
} from "@/components/portfolio"

export const metadata = {
  title: "Investment Portfolio | Roam",
  description: "Track your real estate investments and distributions",
}

export default async function PortfolioPage() {
  // Parallel data fetching
  const [
    overview,
    portfolios,
    investments,
    distributions,
    performanceData,
    allocationData,
  ] = await Promise.all([
    getPortfolioOverview(),
    getPortfolios(),
    getInvestments({ limit: 10 }),
    getDistributions({ limit: 5 }),
    getPerformanceData({ months: 12 }),
    getAllocationData({ groupBy: "propertyType" }),
  ])

  return (
    <div className="space-y-8">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Investment Portfolio</h1>
          <p className="page-subtitle">
            Track your real estate investments and distributions
          </p>
        </div>
        <PortfolioSelector portfolios={portfolios} />
      </div>

      {/* Overview Stats */}
      <PortfolioOverview stats={overview} />

      {/* Charts Row */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Suspense fallback={<ChartSkeleton />}>
          <PortfolioPerformanceChart data={performanceData} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <AssetAllocationChart data={allocationData} />
        </Suspense>
      </div>

      {/* Holdings Table */}
      <Suspense fallback={<TableSkeleton />}>
        <HoldingsTable investments={investments} />
      </Suspense>

      {/* Distribution History */}
      <Suspense fallback={<ListSkeleton />}>
        <DistributionHistory distributions={distributions} />
      </Suspense>
    </div>
  )
}

// Loading skeletons
function ChartSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="card__header">
        <div className="skeleton skeleton--text" style={{ width: 150 }} />
      </div>
      <div className="card__body" style={{ height: 300 }}>
        <div className="skeleton skeleton--chart" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="card__header">
        <div className="skeleton skeleton--text" style={{ width: 100 }} />
      </div>
      <div className="card__body" style={{ height: 300 }}>
        <div className="skeleton skeleton--table" />
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="card__header">
        <div className="skeleton skeleton--text" style={{ width: 150 }} />
      </div>
      <div className="card__body" style={{ height: 200 }}>
        <div className="skeleton skeleton--list" />
      </div>
    </div>
  )
}
