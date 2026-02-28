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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">
          All your transactions across connected accounts
        </p>
      </div>

      <TransactionFilters categories={categories} accounts={accounts} />

      <TransactionList
        transactions={transactions}
        totalFxFees={fxTotals.totalFxFees}
        categories={categories}
      />
    </div>
  )
}
