/**
 * Notification Store
 * Manages unread notifications that should be displayed in the Bell icon
 * Only counts rooms where toast notifications were shown
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type RoomNotification = {
  roomId: number
  count: number
  lastMessagePreview?: string // Preview of the last message (trimmed to ~50 chars)
}

type NotificationData = {
  count: number
  lastMessagePreview?: string
}

type NotificationState = {
  // Map of roomId -> notification data (count + message preview)
  notifications: Map<number, NotificationData>

  // Add a notification for a room with optional message preview
  addNotification: (roomId: number, messagePreview?: string) => void

  // Clear notifications for a specific room
  clearNotifications: (roomId: number) => void

  // Clear all notifications
  clearAllNotifications: () => void

  // Get total notification count
  getTotalCount: () => number

  // Get all notifications as array
  getAllNotifications: () => RoomNotification[]
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: new Map(),

  addNotification: (roomId: number, messagePreview?: string) => {
    console.log('[NotificationStore] 📝 addNotification called with:', { roomId, messagePreview })
    set((state) => {
      const newNotifications = new Map(state.notifications)
      const current = newNotifications.get(roomId)
      const currentCount = current?.count || 0

      // Trim message preview to ~50 chars
      const trimmedPreview = messagePreview
        ? messagePreview.length > 50
          ? messagePreview.substring(0, 50) + '...'
          : messagePreview
        : undefined

      const newData = {
        count: currentCount + 1,
        lastMessagePreview: trimmedPreview || current?.lastMessagePreview,
      }

      console.log('[NotificationStore] 💾 Storing notification:', { roomId, ...newData })

      newNotifications.set(roomId, newData)
      return { notifications: newNotifications }
    })
  },

  clearNotifications: (roomId: number) => {
    set((state) => {
      const newNotifications = new Map(state.notifications)
      newNotifications.delete(roomId)
      return { notifications: newNotifications }
    })
  },

  clearAllNotifications: () => {
    set({ notifications: new Map() })
  },

  getTotalCount: () => {
    const { notifications } = get()
    let total = 0
    notifications.forEach((data) => {
      total += data.count
    })
    return total
  },

      getAllNotifications: () => {
        const { notifications } = get()
        const result: RoomNotification[] = []
        notifications.forEach((data, roomId) => {
          result.push({
            roomId,
            count: data.count,
            lastMessagePreview: data.lastMessagePreview,
          })
        })
        return result
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
      // Custom serialization for Map
      partialize: (state) => {
        const serialized = {
          notifications: Array.from(state.notifications.entries()),
        }
        console.log('[NotificationStore] 💾 Serializing to localStorage:', serialized)
        return serialized
      },
      // Custom deserialization for Map
      merge: (persistedState: any, currentState) => {
        console.log('[NotificationStore] 📂 Loading from localStorage:', persistedState)
        const merged = {
          ...currentState,
          notifications: new Map(persistedState?.notifications || []),
        }
        console.log('[NotificationStore] 🔄 Merged state:', {
          notificationCount: merged.notifications.size,
          notifications: Array.from(merged.notifications.entries()),
        })
        return merged
      },
    }
  )
)
