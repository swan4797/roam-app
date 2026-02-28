"use client"

import { useState, useRef, useEffect, memo, useCallback } from "react"
import { useNotificationStore } from "@/lib/stores/notification-store"
import type { Notification } from "@/types/notifications"

const NotificationItem = memo(function NotificationItem({
  notification,
  onRead,
  onRemove,
}: {
  notification: Notification
  onRead: (id: string) => void
  onRemove: (id: string) => void
}) {
  const icons = {
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  }

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div
      className={`notification-item ${notification.read ? "" : "is-unread"}`}
      onClick={() => !notification.read && onRead(notification.id)}
      role="listitem"
    >
      <div className={`notification-item__icon notification-item__icon--${notification.type}`}>
        {icons[notification.type]}
      </div>
      <div className="notification-item__content">
        <p className="notification-item__title">{notification.title}</p>
        {notification.message && (
          <p className="notification-item__message">{notification.message}</p>
        )}
        <span className="notification-item__time">{timeAgo(notification.timestamp)}</span>
      </div>
      <button
        type="button"
        className="notification-item__remove"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(notification.id)
        }}
        aria-label="Remove notification"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
})

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore()

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkRead = useCallback(
    (id: string) => markAsRead(id),
    [markAsRead]
  )

  const handleRemove = useCallback(
    (id: string) => removeNotification(id),
    [removeNotification]
  )

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-bell__badge" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown" role="listbox">
          <div className="notification-dropdown__header">
            <h3 className="notification-dropdown__title">Notifications</h3>
            {notifications.length > 0 && (
              <div className="notification-dropdown__actions">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={clearAll}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="notification-dropdown__list">
            {notifications.length === 0 ? (
              <div className="notification-dropdown__empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleMarkRead}
                  onRemove={handleRemove}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
