/**
 * Hook to calculate total unread messages count across all rooms
 */

'use client'

import { useMemo } from 'react'
import { useChatRooms } from './use-chat-rooms'

export function useTotalUnreadCount() {
  const { rooms } = useChatRooms({ enabled: true })

  const totalUnread = useMemo(() => {
    return rooms.reduce((total, room) => {
      return total + (room.unreadCount || 0)
    }, 0)
  }, [rooms])

  return totalUnread
}
