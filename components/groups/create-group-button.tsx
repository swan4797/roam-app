"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createGroupAction } from "@/actions/groups"

const currencies = [
  { code: "GBP", name: "British Pound" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "THB", name: "Thai Baht" },
  { code: "MXN", name: "Mexican Peso" },
]

export function CreateGroupButton() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState<Array<{ name: string; email: string }>>([])
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      setMembers([...members, { name: newMemberName.trim(), email: newMemberEmail.trim() }])
      setNewMemberName("")
      setNewMemberEmail("")
    }
  }

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set("members", JSON.stringify(members))

    const result = await createGroupAction(formData)

    if (result.success && result.groupId) {
      setIsOpen(false)
      setMembers([])
      router.push(`/dashboard/groups/${result.groupId}`)
    } else {
      alert(result.error || "Failed to create group")
    }

    setIsLoading(false)
  }

  return (
    <>
      <button className="btn btn--primary" onClick={() => setIsOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Group
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Create Group</h2>
              <button
                className="modal__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal__body">
                <div className="form__group">
                  <label className="form__label" htmlFor="name">
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input"
                    placeholder="e.g., Trip to Japan, Flatmates"
                    required
                  />
                </div>

                <div className="form__group">
                  <label className="form__label" htmlFor="description">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="input"
                    placeholder="What's this group for?"
                  />
                </div>

                <div className="form__group">
                  <label className="form__label" htmlFor="currency">
                    Default Currency
                  </label>
                  <select id="currency" name="currency" className="select">
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form__group">
                  <label className="form__label">Add Members</label>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                    You'll be added automatically. Add others now or later.
                  </p>

                  {members.length > 0 && (
                    <div className="member-chips">
                      {members.map((member, idx) => (
                        <div key={idx} className="member-chip">
                          <span>{member.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(idx)}
                            className="member-chip__remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="form__row" style={{ marginTop: "0.5rem" }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="email"
                      className="input"
                      placeholder="Email (optional)"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={handleAddMember}
                      disabled={!newMemberName.trim()}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal__footer">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
