"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addMemberAction, deleteGroupAction } from "@/actions/groups"

interface Member {
  id: string
  name: string
  email: string | null
  userId: string | null
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  } | null
}

interface Group {
  id: string
  name: string
  description: string | null
  currency: string
  createdById: string
  members: Member[]
}

interface Props {
  group: Group
}

export function GroupHeader({ group }: Props) {
  const router = useRouter()
  const [showAddMember, setShowAddMember] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [isAdding, setIsAdding] = useState(false)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim()) return

    setIsAdding(true)
    const formData = new FormData()
    formData.set("groupId", group.id)
    formData.set("name", newMemberName.trim())
    if (newMemberEmail) formData.set("email", newMemberEmail.trim())

    const result = await addMemberAction(formData)

    if (result.success) {
      setNewMemberName("")
      setNewMemberEmail("")
      setShowAddMember(false)
      router.refresh()
    } else {
      alert(result.error)
    }
    setIsAdding(false)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this group? All expenses will be lost.")) {
      return
    }

    setIsDeleting(true)
    const formData = new FormData()
    formData.set("groupId", group.id)

    const result = await deleteGroupAction(formData)

    if (result.success) {
      router.push("/dashboard/groups")
    } else {
      alert(result.error)
      setIsDeleting(false)
    }
  }

  return (
    <div className="group-header">
      <div className="group-header__main">
        <div className="group-header__avatar">
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div className="group-header__info">
          <h1 className="group-header__title">{group.name}</h1>
          {group.description && (
            <p className="group-header__description">{group.description}</p>
          )}
        </div>
      </div>

      <div className="group-header__members">
        <div className="group-header__members-list">
          {group.members.map((member) => (
            <div key={member.id} className="group-member" title={member.name}>
              <div className="group-member__avatar">
                {member.user?.image ? (
                  <img src={member.user.image} alt="" />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="group-member__name">{member.name}</span>
            </div>
          ))}

          <button
            className="group-member group-member--add"
            onClick={() => setShowAddMember(!showAddMember)}
            title="Add member"
          >
            <div className="group-member__avatar">+</div>
          </button>
        </div>

        <button
          className="btn btn--ghost btn--sm"
          onClick={handleDelete}
          disabled={isDeleting}
          style={{ color: "var(--danger)" }}
        >
          {isDeleting ? "Deleting..." : "Delete Group"}
        </button>
      </div>

      {showAddMember && (
        <form onSubmit={handleAddMember} className="add-member-form">
          <input
            type="text"
            className="input"
            placeholder="Name"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            autoFocus
          />
          <input
            type="email"
            className="input"
            placeholder="Email (optional)"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={isAdding || !newMemberName.trim()}
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setShowAddMember(false)}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}
