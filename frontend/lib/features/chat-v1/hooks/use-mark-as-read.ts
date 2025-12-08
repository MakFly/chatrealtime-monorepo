/**
 * Hook to mark a chat room as read (V1)
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markChatRoomAsRead } from '@/lib/api/mark-read'

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (roomId: number) => markChatRoomAsRead(roomId),
    onSuccess: (_data, roomId) => {
      // Clear unread count locally for a snappy UX
      queryClient.setQueriesData(
        { queryKey: ['chatRooms'] },
        (old: { member: Array<{ id: number; unreadCount?: number }> } | undefined) => {
          if (!old?.member) return old

          return {
            ...old,
            member: old.member.map((room) =>
              room.id === roomId ? { ...room, unreadCount: 0 } : room
            ),
          }
        }
      )
    },
  })

  return mutation
}

