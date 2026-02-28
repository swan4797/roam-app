export type NotificationType = "success" | "error" | "warning" | "info"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    href: string
  }
}
