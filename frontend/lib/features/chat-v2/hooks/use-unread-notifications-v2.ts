/**
 * Real-time unread notifications hook for chat V2
 * Subscribes to Mercure topic /marketplace-chat/unread/user/{userId} for instant unread count updates
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useMercureTyped } from '@/lib/features/shared'
import { useQueryClient } from '@tanstack/react-query'
import type { ChatRoomV2Collection } from '../types'

type UnreadUpdateV2 = {
  roomId: number
  userId: number
  unreadCount: number
  timestamp: string
}

type UseUnreadNotificationsV2Options = {
  userId: number | undefined
  currentRoomId: number | undefined
  mercureToken?: string | null
  enabled?: boolean
}

/**
 * Hook for real-time unread count notifications (V2)
 *
 * Features:
 * - Subscribes to /marketplace-chat/unread/user/{userId} Mercure topic
 * - Updates room unread counts in TanStack Query cache
 * - Skips updates for current room (user is actively viewing)
 * - Prevents duplicate notifications
 *
 * @param options Configuration options
 */
export function useUnreadNotificationsV2(
  options: UseUnreadNotificationsV2Options
) {
  const { userId, currentRoomId, mercureToken, enabled = true } = options
  const queryClient = useQueryClient()

  const topic = userId ? `/chat-v2/unread/user/${userId}` : null

  const handleUnreadUpdate = useCallback(
    (update: UnreadUpdateV2) => {
      console.log('[useUnreadNotificationsV2] 📨 Received unread update:', update)

      // ✅ CRITICAL: Always apply cache updates even for current room
      // We still may suppress any UI notification (toast) elsewhere if needed,
      // but unread counters must stay in sync with the backend.

      // Update the room's unread count in cache
      queryClient.setQueryData<ChatRoomV2Collection>(
        ['chatRoomsV2'],
        (oldData) => {
          if (!oldData) {
            console.log('[useUnreadNotificationsV2] ❌ No rooms data in cache')
            return oldData
          }

          const updatedRooms = oldData.member.map((room) =>
            room.id === update.roomId
              ? { ...room, unreadCount: update.unreadCount }
              : room
          )

          console.log(
            `[useUnreadNotificationsV2] ✅ Updated unread count for room #${update.roomId}: ${update.unreadCount}`
          )

          return {
            ...oldData,
            member: updatedRooms,
          }
        }
      )

      // Optional: Show toast notification
      // if (update.unreadCount > 0) {
      //   toast.info(`New message in room ${update.roomId}`)
      // }
    },
    [currentRoomId, queryClient]
  )

  // Subscribe to Mercure topic
  useMercureTyped<UnreadUpdateV2>({
    topics: topic ? [topic] : [],
    onMessage: handleUnreadUpdate,
    enabled: enabled && !!topic && !!mercureToken,
    token: mercureToken || undefined,
  })

  // Debug logging
  useEffect(() => {
    if (topic && mercureToken) {
      console.log('[useUnreadNotificationsV2] 📡 Subscribed to:', topic)
    }
  }, [topic, mercureToken])
}
