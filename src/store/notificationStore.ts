import { create } from 'zustand'

export type NotificationType = 'draw' | 'winner' | 'subscription' | 'system'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
}

interface NotificationStore {
  notifications: AppNotification[]
  addNotification: (type: NotificationType, title: string, message: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [
    {
      id: '1',
      type: 'draw',
      title: 'Monthly Draw Results',
      message: 'The April 2025 draw has been published. Check if you won!',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: '2',
      type: 'subscription',
      title: 'Subscription Active',
      message: 'Your subscription is active. Good luck in the next draw!',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: '3',
      type: 'system',
      title: 'Welcome to Digital Heroes!',
      message: 'Subscribe, log your scores, and make an impact. Check out the charities page.',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],

  addNotification: (type, title, message) => {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    }
    set(state => ({ notifications: [newNotif, ...state.notifications] }))
  },

  markRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }))
  },

  markAllRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }))
  },

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter(n => !n.read).length,
}))
