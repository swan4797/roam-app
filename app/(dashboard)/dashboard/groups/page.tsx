import Link from "next/link"
import { getGroups } from "@/lib/dal/groups"
import { GroupsList } from "@/components/groups/groups-list"
import { CreateGroupButton } from "@/components/groups/create-group-button"

export default async function GroupsPage() {
  const groups = await getGroups()

  return (
    <div className="page-content">
      <div className="page-title-row">
        <div>
          <h1 className="page-title">Split Expenses</h1>
          <p className="page-subtitle">
            Track shared expenses with friends and see hidden FX fees when settling
          </p>
        </div>
        <CreateGroupButton />
      </div>

      {groups.length === 0 ? (
        <div className="card" style={{ marginTop: "2rem" }}>
          <div className="card__body" style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
            <h3 style={{ marginBottom: "0.5rem" }}>No groups yet</h3>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Create a group to start splitting expenses with friends, flatmates, or travel buddies.
            </p>
            <CreateGroupButton />
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "2rem" }}>
          <GroupsList groups={groups} />
        </div>
      )}
    </div>
  )
}
