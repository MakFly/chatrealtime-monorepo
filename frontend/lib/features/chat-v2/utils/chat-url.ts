/**
 * Utility functions for Marketplace Chat URLs
 */

import type { ChatRoomV2 } from '../types'

/**
 * Extract room ID from URL based on productId and userId
 *
 * @param url - The full URL (e.g., /marketplace-chat?productId=123&userId=456)
 * @param rooms - Array of ChatRoomV2 to search in
 * @param currentUserId - Current user's ID
 * @returns Room ID if found, null otherwise
 */
export function getRoomIdFromUrl(
  url: string,
  rooms: ChatRoomV2[],
  currentUserId: number
): number | null {
  try {
    const urlObj = new URL(url)
    const productId = parseInt(urlObj.searchParams.get('productId') || '0', 10)
    const userId = parseInt(urlObj.searchParams.get('userId') || '0', 10)

    if (!productId || !userId) return null

    const matchingRoom = rooms.find((room) => {
      if (room.productId !== productId) return false

      // Extract participant IDs
      const participantIds =
        room.participants
          ?.map((p) => {
            const pid =
              typeof p.user === 'string'
                ? parseInt(p.user.match(/\/(\d+)$/)?.[1] || '0', 10)
                : parseInt(p.user.id, 10)
            return pid
          })
          .filter((id): id is number => id > 0) || []

      // Check if both current user and seller are participants
      return (
        participantIds.includes(currentUserId) && participantIds.includes(userId)
      )
    })

    return matchingRoom?.id || null
  } catch (error) {
    console.error('[getRoomIdFromUrl] Error parsing URL:', error)
    return null
  }
}
