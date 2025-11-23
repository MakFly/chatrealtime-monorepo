/**
 * Hook to get total unread count across all chat rooms V2
 * Aggregates unread counts from all rooms for navbar badge
 */

'use client'

import { useMemo } from 'react'
import { useChatRoomsV2 } from './use-chat-rooms-v2'

type UseTotalUnreadCountOptions = {
  enabled?: boolean
}

/**
 * Hook for getting total unread message count across all chat V2 rooms
 *
 * Features:
 * - Aggregates unread counts from all accessible rooms
 * - Updates in real-time via Mercure
 * - Returns total count for navbar badge
 *
 * @param options Configuration options
 * @returns Total unread count
 */
export function useTotalUnreadCount(options: UseTotalUnreadCountOptions = {}) {
  const { enabled = true } = options

  // Fetch all rooms (with real-time updates via Mercure)
  const { rooms, isLoading } = useChatRoomsV2({ enabled })

  // Calculate total unread count
  const totalUnread = useMemo(() => {
    if (!rooms || rooms.length === 0) return 0

    return rooms.reduce((total, room) => {
      const roomUnread = room.unreadCount || 0
      return total + roomUnread
    }, 0)
  }, [rooms])

  return {
    totalUnread,
    isLoading,
  }
}
