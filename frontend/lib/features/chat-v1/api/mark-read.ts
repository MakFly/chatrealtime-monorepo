/**
 * API client for marking chat rooms as read
 */

'use client'

/**
 * Mark a chat room as read (reset unread count to 0)
 */
export async function markChatRoomAsRead(roomId: number): Promise<void> {
  const response = await fetch(`/api/chat/rooms/${roomId}/mark-read`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to mark room as read' }))
    throw new Error(error.error || 'Failed to mark room as read')
  }

  return response.json()
}
