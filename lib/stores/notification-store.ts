import { create } from "zustand"
import type { Notification, NotificationType } from "@/types/notifications"

// Optimistic update state
type OptimisticState = "pending" | "confirmed" | "failed"

interface OptimisticNotification extends Notification {
  _optimisticState?: OptimisticState
  _previousRead?: boolean
}

interface NotificationStore {
  notifications: OptimisticNotification[]
  toasts: Notification[]

  // Core actions
  addNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    action?: { label: string; href: string }
  ) => void
  removeNotification: (id: string) => void
  dismissToast: (id: string) => void

  // Optimistic actions with rollback
  markAsRead: (id: string) => void
  markAsReadOptimistic: (id: string, serverAction: () => Promise<boolean>) => Promise<void>
  markAllAsRead: () => void
  markAllAsReadOptimistic: (serverAction: () => Promise<boolean>) => Promise<void>
  clearAll: () => void
  clearAllOptimistic: (serverAction: () => Promise<boolean>) => Promise<void>

  // Rollback helpers
  _rollbackNotification: (id: string) => void
  _confirmNotification: (id: string) => void
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  toasts: [],

  addNotification: (type, title, message, action) => {
    const notification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      action,
    }

    set((state) => ({
      notifications: [notification, ...state.notifications],
      toasts: [...state.toasts, notification],
    }))

    // Auto-dismiss toast after 5 seconds
    setTimeout(() => {
      get().dismissToast(notification.id)
    }, 5000)
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Simple mark as read (no server sync)
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  // Optimistic mark as read with server sync and rollback
  markAsReadOptimistic: async (id, serverAction) => {
    const notification = get().notifications.find((n) => n.id === id)
    if (!notification || notification.read) return

    // Optimistically update UI immediately
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id
          ? { ...n, read: true, _optimisticState: "pending" as OptimisticState, _previousRead: n.read }
          : n
      ),
    }))

    try {
      // Call server action in background
      const success = await serverAction()

      if (success) {
        get()._confirmNotification(id)
      } else {
        get()._rollbackNotification(id)
      }
    } catch {
      // Rollback on error
      get()._rollbackNotification(id)
    }
  },

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  // Optimistic mark all as read
  markAllAsReadOptimistic: async (serverAction) => {
    const previousStates = new Map(
      get().notifications.map((n) => [n.id, n.read])
    )

    // Optimistically update all
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        read: true,
        _optimisticState: "pending" as OptimisticState,
        _previousRead: n.read,
      })),
    }))

    try {
      const success = await serverAction()

      if (success) {
        // Confirm all
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            _optimisticState: "confirmed" as OptimisticState,
          })),
        }))
      } else {
        // Rollback all
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            read: previousStates.get(n.id) ?? n.read,
            _optimisticState: "failed" as OptimisticState,
          })),
        }))
      }
    } catch {
      // Rollback all on error
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          read: previousStates.get(n.id) ?? n.read,
          _optimisticState: "failed" as OptimisticState,
        })),
      }))
    }
  },

  clearAll: () => set({ notifications: [] }),

  // Optimistic clear all
  clearAllOptimistic: async (serverAction) => {
    const previousNotifications = [...get().notifications]

    // Optimistically clear
    set({ notifications: [] })

    try {
      const success = await serverAction()

      if (!success) {
        // Rollback - restore notifications
        set({ notifications: previousNotifications })
      }
    } catch {
      // Rollback on error
      set({ notifications: previousNotifications })
    }
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Internal rollback helper
  _rollbackNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id
          ? { ...n, read: n._previousRead ?? n.read, _optimisticState: "failed" as OptimisticState }
          : n
      ),
    })),

  // Internal confirm helper
  _confirmNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, _optimisticState: "confirmed" as OptimisticState } : n
      ),
    })),
}))
