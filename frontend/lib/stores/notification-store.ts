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
  // If unreadCount is provided, it will be used instead of incrementing
  addNotification: (roomId: number, messagePreview?: string, unreadCount?: number) => void

  // Clear notifications for a specific room
  clearNotifications: (roomId: number) => void

  // Clear all notifications
  clearAllNotifications: () => void

  // Initialize notifications from rooms with unreadCount > 0
  initializeFromRooms: (rooms: Array<{ id: number; unreadCount: number; lastMessage?: { content: string } }>) => void

  // Get total notification count
  getTotalCount: () => number

  // Get all notifications as array
  getAllNotifications: () => RoomNotification[]
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: new Map(),

  addNotification: (roomId: number, messagePreview?: string, unreadCount?: number) => {
    console.log('[NotificationStore] 📝 addNotification called with:', { roomId, messagePreview, unreadCount })
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

      // If unreadCount is provided, use it directly (sync with backend)
      // Otherwise, increment the current count (new message arrived)
      const newCount = unreadCount !== undefined ? unreadCount : currentCount + 1

      const newData = {
        count: newCount,
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

  initializeFromRooms: (rooms) => {
    console.log('[NotificationStore] 🔄 Initializing from rooms:', rooms.length)
    set((state) => {
      const newNotifications = new Map(state.notifications)
      
      // Initialize notifications for rooms with unreadCount > 0
      rooms.forEach((room) => {
        if (room.unreadCount > 0) {
          const existing = newNotifications.get(room.id)
          // Only initialize if not already set (preserve existing notifications)
          if (!existing) {
            const messagePreview = room.lastMessage?.content
              ? room.lastMessage.content.length > 50
                ? room.lastMessage.content.substring(0, 50) + '...'
                : room.lastMessage.content
              : undefined
            
            newNotifications.set(room.id, {
              count: room.unreadCount,
              lastMessagePreview: messagePreview,
            })
            console.log('[NotificationStore] ✅ Initialized notification for room', room.id, ':', room.unreadCount)
          }
        }
      })
      
      return { notifications: newNotifications }
    })
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
