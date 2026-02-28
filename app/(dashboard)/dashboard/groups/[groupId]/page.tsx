import Link from "next/link"
import { notFound } from "next/navigation"
import { getGroup, getGroupExpenses, getGroupBalances } from "@/lib/dal/groups"
import { GroupHeader } from "@/components/groups/group-header"
import { GroupBalances } from "@/components/groups/group-balances"
import { ExpensesList } from "@/components/groups/expenses-list"
import { AddExpenseButton } from "@/components/groups/add-expense-button"
import { SettleUpButton } from "@/components/groups/settle-up-button"

interface Props {
  params: Promise<{ groupId: string }>
}

export default async function GroupDetailPage({ params }: Props) {
  const { groupId } = await params

  try {
    const [group, expenses, balances] = await Promise.all([
      getGroup(groupId),
      getGroupExpenses(groupId),
      getGroupBalances(groupId),
    ])

    // Find current user's member record
    const currentUserMember = group.members.find((m) => m.user !== null)

    return (
      <div className="page-content">
        <div className="page-breadcrumb">
          <Link href="/dashboard/groups" className="page-breadcrumb__link">
            Groups
          </Link>
          <span className="page-breadcrumb__separator">/</span>
          <span>{group.name}</span>
        </div>

        <GroupHeader group={group} />

        <div className="group-actions" style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <AddExpenseButton group={group} />
          {balances.debts.length > 0 && (
            <SettleUpButton group={group} debts={balances.debts} />
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3" style={{ marginTop: "2rem" }}>
          <div className="lg:col-span-2">
            <ExpensesList expenses={expenses} groupCurrency={group.currency} />
          </div>
          <div>
            <GroupBalances balances={balances} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
