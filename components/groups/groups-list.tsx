"use client"

import Link from "next/link"

interface Group {
  id: string
  name: string
  description: string | null
  currency: string
  members: Array<{
    id: string
    name: string
    userId: string | null
  }>
  _count: {
    expenses: number
  }
}

interface Props {
  groups: Group[]
}

export function GroupsList({ groups }: Props) {
  return (
    <div className="groups-grid">
      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/dashboard/groups/${group.id}`}
          className="group-card"
        >
          <div className="group-card__header">
            <div className="group-card__avatar">
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div className="group-card__info">
              <h3 className="group-card__name">{group.name}</h3>
              {group.description && (
                <p className="group-card__description">{group.description}</p>
              )}
            </div>
          </div>

          <div className="group-card__stats">
            <div className="group-card__stat">
              <span className="group-card__stat-value">{group.members.length}</span>
              <span className="group-card__stat-label">
                {group.members.length === 1 ? "member" : "members"}
              </span>
            </div>
            <div className="group-card__stat">
              <span className="group-card__stat-value">{group._count.expenses}</span>
              <span className="group-card__stat-label">
                {group._count.expenses === 1 ? "expense" : "expenses"}
              </span>
            </div>
            <div className="group-card__stat">
              <span className="group-card__stat-value">{group.currency}</span>
              <span className="group-card__stat-label">currency</span>
            </div>
          </div>

          <div className="group-card__members">
            {group.members.slice(0, 4).map((member, idx) => (
              <div
                key={member.id}
                className="group-card__member-avatar"
                style={{ zIndex: 4 - idx }}
                title={member.name}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {group.members.length > 4 && (
              <div className="group-card__member-avatar group-card__member-avatar--more">
                +{group.members.length - 4}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
