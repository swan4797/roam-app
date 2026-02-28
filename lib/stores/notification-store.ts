import { create } from "zustand"
import type { Notification, NotificationType } from "@/types/notifications"

interface NotificationStore {
  notifications: Notification[]
  toasts: Notification[]
  addNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    action?: { label: string; href: string }
  ) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  dismissToast: (id: string) => void
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

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [] }),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
