/**
 * Global chat notification hook
 * Listens to Mercure unread count updates and shows toast notifications
 * Works across all pages when user is authenticated
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMercureTyped } from './use-mercure'
import { useMercureTokenV2 } from '@/lib/features/chat-v2/hooks/use-mercure-token-v2'
import { useCurrentUser } from './use-current-user'
import { toast } from 'sonner'
import { usePathname, useRouter } from 'next/navigation'
import type { ChatRoomV2Collection, ChatRoomV2 } from '@/types/marketplace-chat'

type UnreadUpdateV2 = {
  roomId: number
  userId: number
  unreadCount: number
  timestamp: string
}

type UseGlobalChatNotificationsOptions = {
  enabled?: boolean
}

/**
 * Hook for global chat notifications across the entire app
 *
 * Features:
 * - Subscribes to /marketplace-chat/unread/user/{userId} globally
 * - Shows Sonner toast when new messages arrive
 * - Skips notifications when user is on the chat page for that room
 * - Auto-dismisses toasts after 5 seconds
 *
 * @param options Configuration options
 */
export function useGlobalChatNotifications(
  options: UseGlobalChatNotificationsOptions = {}
) {
  const { enabled = true } = options
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: user } = useCurrentUser()

  // Fetch Mercure token for authenticated user
  const { data: mercureToken } = useMercureTokenV2(enabled && !!user)

  // Build topic for current user (matches backend: /chat-v2/unread/user/{id})
  const topic = user ? `/chat-v2/unread/user/${user.id}` : null

  // Extract current room ID from URL (if on chat page)
  const getCurrentRoomId = useCallback((): number | null => {
    // Check if on chat-v2 page
    if (!pathname.startsWith('/marketplace-chat')) {
      return null
    }

    // Try to find room ID from rooms cache by matching productId and userId
    if (typeof window === 'undefined') return null

    const url = new URL(window.location.href)
    const productIdParam = url.searchParams.get('productId')
    const userIdParam = url.searchParams.get('userId')

    if (!productIdParam || !userIdParam) return null

    // Get rooms from cache to find matching room
    const roomsData = queryClient.getQueryData<ChatRoomV2Collection>(['chatRoomsV2'])
    if (!roomsData) return null

    const productId = parseInt(productIdParam, 10)
    const userId = parseInt(userIdParam, 10)
    const currentUserId = user ? parseInt(user.id, 10) : 0

    const matchingRoom = roomsData.member.find((room) => {
      if (room.productId !== productId) return false

      // Check if both current user and seller are participants
      const participantIds = room.participants?.map((p) => {
        const participantUserId = typeof p.user === 'string' 
          ? parseInt(p.user.match(/\/(\d+)$/)?.[1] || '0', 10)
          : parseInt(p.user.id, 10)
        return participantUserId
      }).filter((id): id is number => id > 0) || []

      return participantIds.includes(currentUserId) && participantIds.includes(userId)
    })

    return matchingRoom?.id || null
  }, [pathname, queryClient, user])

  const handleUnreadUpdate = useCallback(
    (update: UnreadUpdateV2) => {
      console.log('[useGlobalChatNotifications] 📨 Received unread update:', update)

      // Update TanStack Query cache with new unread count
      queryClient.setQueryData<ChatRoomV2Collection>(
        ['chatRoomsV2'],
        (oldData) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            member: oldData.member.map((room) =>
              room.id === update.roomId
                ? { ...room, unreadCount: update.unreadCount }
                : room
            ),
          }
        }
      )

      console.log('[useGlobalChatNotifications] 🔄 Updated cache for room', update.roomId, 'with unread count:', update.unreadCount)

      // Skip toast notification if unread count is 0 (message was read)
      if (update.unreadCount === 0) {
        console.log('[useGlobalChatNotifications] ⏭️  Unread count is 0, skipping toast notification')
        return
      }

      // Get current room ID
      const currentRoomId = getCurrentRoomId()

      // Skip if user is currently viewing this room
      if (currentRoomId === update.roomId) {
        console.log(
          '[useGlobalChatNotifications] ⏭️  User is viewing room, skipping toast notification'
        )
        return
      }

      // ✅ Get room details from cache to build proper URL
      const roomsData = queryClient.getQueryData<ChatRoomV2Collection>(['chatRoomsV2'])
      const room = roomsData?.member.find((r) => r.id === update.roomId)

      if (!room) {
        console.warn('[useGlobalChatNotifications] ⚠️  Room not found in cache:', update.roomId)
        return
      }

      // Find seller ID (the other participant, not the current user)
      const currentUserId = user ? parseInt(user.id, 10) : 0
      const seller = room.participants?.find((p) => {
        const participantId = typeof p.user === 'string'
          ? parseInt(p.user.match(/\/(\d+)$/)?.[1] || '0', 10)
          : parseInt(p.user.id, 10)
        return participantId !== currentUserId && participantId > 0
      })

      if (!seller || !room.productId) {
        console.warn('[useGlobalChatNotifications] ⚠️  Could not find seller or productId for room:', update.roomId)
        return
      }

      // Extract seller userId
      const sellerUserId = typeof seller.user === 'string'
        ? seller.user.match(/\/(\d+)$/)?.[1] || ''
        : seller.user.id

      if (!sellerUserId) {
        console.warn('[useGlobalChatNotifications] ⚠️  Could not extract seller userId')
        return
      }

      // Build proper URL with productId and userId
      const chatUrl = `/marketplace-chat?productId=${room.productId}&userId=${sellerUserId}`

      // Show toast notification with proper link
      toast.info('Nouveau message', {
        description: `Vous avez ${update.unreadCount} message${
          update.unreadCount > 1 ? 's' : ''
        } non lu${update.unreadCount > 1 ? 's' : ''}`,
        action: {
          label: 'Voir',
          onClick: () => {
            router.push(chatUrl)
          },
        },
        duration: 5000,
      })

      console.log('[useGlobalChatNotifications] 🔔 Toast notification shown for room', update.roomId, '→', chatUrl)
    },
    [getCurrentRoomId, queryClient, user, router]
  )

  // Subscribe to Mercure topic
  const mercureState = useMercureTyped<UnreadUpdateV2>({
    topics: topic ? [topic] : [],
    onMessage: handleUnreadUpdate,
    enabled: enabled && !!topic && !!mercureToken,
    token: mercureToken || undefined,
  })

  // Debug logging
  useEffect(() => {
    if (topic && mercureToken) {
      console.log('[useGlobalChatNotifications] 📡 Subscribed to global notifications:', topic)
    }
  }, [topic, mercureToken])

  useEffect(() => {
    if (mercureState && 'error' in mercureState && mercureState.error) {
      console.error('[useGlobalChatNotifications] ❌ Mercure connection error:', mercureState.error)
    }
  }, [mercureState])

  return mercureState
}
