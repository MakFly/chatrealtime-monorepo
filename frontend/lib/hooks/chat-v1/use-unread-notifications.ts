/**
 * Hook for listening to unread count updates via Mercure
 * Shows toast notifications when new messages arrive in other rooms
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMercureTyped } from '../use-mercure'
import { useMercureToken } from './use-mercure-token'
import { useCurrentUser } from '../use-current-user'
import { toast } from 'sonner'
import { useNotificationStore } from '@/lib/stores/notification-store'
import type { ChatRoom } from '@/types/chat'

type UnreadUpdate = {
  roomId: number
  userId: number
  unreadCount: number
  lastMessagePreview?: string
  timestamp: string
}

type UseUnreadNotificationsOptions = {
  currentRoomId?: number | null // Room currently being viewed (don't notify for this one)
  enabled?: boolean
}

/**
 * Hook for unread count notifications
 *
 * Subscribes to user-specific Mercure topics for unread count updates
 * Shows toast notifications when messages arrive in rooms other than the current one
 * Updates TanStack Query cache for real-time badge updates
 */
export function useUnreadNotifications(options: UseUnreadNotificationsOptions = {}) {
  const { currentRoomId, enabled = true } = options

  const queryClient = useQueryClient()
  const { addNotification, clearNotifications } = useNotificationStore()

  // Fetch current user to get userId for topic subscription
  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id

  // Fetch Mercure JWT token
  const { data: mercureToken } = useMercureToken(enabled)

  // Build topics: subscribe to user-specific unread updates
  const topics = userId ? [`/user/${userId}/unread`] : []

  // Track recently marked as read rooms to avoid false notifications
  // Map<roomId, timestamp>
  const recentlyReadRoomsRef = useRef<Map<number, number>>(new Map())

  // When currentRoomId changes, mark it as recently read AND clear notifications for that room
  useEffect(() => {
    if (currentRoomId && currentRoomId > 0) {
      recentlyReadRoomsRef.current.set(currentRoomId, Date.now())
      clearNotifications(currentRoomId) // ✅ Clear Bell notification when opening room
      console.log('[useUnreadNotifications] 📝 Marked room', currentRoomId, 'as recently read & cleared notifications')
    }
  }, [currentRoomId, clearNotifications])

  // Handle Mercure unread count updates
  const handleUnreadUpdate = useCallback(
    (update: UnreadUpdate) => {
      console.log('[useUnreadNotifications] 📥 Received unread update:', update)

      // Always update the unreadCount in the chat rooms cache first
      queryClient.setQueryData(
        ['chatRooms'],
        (old: { member: ChatRoom[] } | undefined) => {
          if (!old?.member) return old

          const updatedMembers = old.member.map((room: ChatRoom) => {
            if (room.id === update.roomId) {
              return {
                ...room,
                unreadCount: update.unreadCount,
              }
            }
            return room
          })

          return {
            ...old,
            member: updatedMembers,
          }
        }
      )

      // Check if this update is for the room the user is currently viewing
      const isCurrentRoom = currentRoomId && update.roomId === currentRoomId

      if (isCurrentRoom) {
        console.log('[useUnreadNotifications] ⏭️  User is in this room, skipping toast notification')
        return
      }

      // Check if room was recently marked as read (within last 2 seconds)
      // This prevents notifications when user just left a room
      const lastReadTime = recentlyReadRoomsRef.current.get(update.roomId)
      const timeSinceRead = lastReadTime ? Date.now() - lastReadTime : Infinity

      if (timeSinceRead < 2000) {
        console.log('[useUnreadNotifications] ⏭️  Room recently read (', timeSinceRead, 'ms ago), skipping notification')
        return
      }

      // Show toast notification only if unreadCount > 0
      if (update.unreadCount > 0) {
        // Get room name from cache
        const rooms = queryClient.getQueryData(['chatRooms']) as { member: ChatRoom[] } | undefined
        const room = rooms?.member?.find((r: ChatRoom) => r.id === update.roomId)
        const roomName = room?.name || `Room #${update.roomId}`

        // ✅ Add notification to Bell counter when showing toast with message preview
        console.log('[useUnreadNotifications] 🔔 Showing notification with preview:', update.lastMessagePreview)
        addNotification(update.roomId, update.lastMessagePreview)

        toast.info(`Nouveau message dans ${roomName}`, {
          description: update.lastMessagePreview || `${update.unreadCount} message${update.unreadCount > 1 ? 's' : ''} non lu${update.unreadCount > 1 ? 's' : ''}`,
          duration: 5000,
          className: 'text-foreground',
          descriptionClassName: 'text-muted-foreground',
        })
      }
    },
    [currentRoomId, queryClient, addNotification]
  )

  // Subscribe to Mercure for real-time unread updates
  const { connected, error } = useMercureTyped<UnreadUpdate>({
    topics,
    token: mercureToken,
    onMessage: handleUnreadUpdate,
    reconnect: true,
    reconnectDelay: 3000,
  })

  useEffect(() => {
    if (enabled && userId) {
      console.log('[useUnreadNotifications] 🔌 Subscribed to unread updates for user:', userId)
    }
  }, [enabled, userId])

  useEffect(() => {
    console.log('[useUnreadNotifications] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
  }, [connected])

  return {
    connected,
    error: error ? new Error(error) : null,
  }
}
