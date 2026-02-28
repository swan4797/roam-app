import { getTransactions, getTotalFxFees } from "@/lib/dal/transactions"
import { getCategories } from "@/lib/dal/categories"
import { getBankAccounts } from "@/lib/dal/accounts"
import { TransactionList } from "@/components/transactions/transaction-list"
import { TransactionFilters } from "@/components/transactions/transaction-filters"

interface Props {
  searchParams: Promise<{
    category?: string
    account?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams

  const [transactions, fxTotals, categories, accounts] = await Promise.all([
    getTransactions({
      categoryId: params.category,
      bankAccountId: params.account,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
    }),
    getTotalFxFees({
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
    }),
    getCategories(),
    getBankAccounts(),
  ])

  return (
    <div className="page-content">
      <div className="page-header-section">
        <div className="page-header-section__title">
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">
            All your transactions across connected accounts
          </p>
        </div>
      </div>

      <TransactionFilters categories={categories} accounts={accounts} />

      <div className="transaction-list-container">
        <TransactionList
          transactions={transactions}
          totalFxFees={fxTotals.totalFxFees}
          categories={categories}
        />
      </div>
    </div>
  )
}
