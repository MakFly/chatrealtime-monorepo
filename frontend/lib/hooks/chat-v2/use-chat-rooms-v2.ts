/**
 * Chat rooms V2 hook with real-time updates for marketplace chats
 * Combines TanStack Query for initial data and Mercure for real-time updates
 * Subscribes to user-specific topics for instant synchronization
 */

'use client'

import { useMemo, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMercureTyped } from '../use-mercure'
import { useMercureTokenV2 } from './use-mercure-token-v2'
import { useCurrentUser } from '../use-current-user'
import { getChatRoomsV2Client, getUnreadCountsV2Client } from '@/lib/api/chat-client-v2'
import type { ChatRoomV2, ChatRoomV2Collection, ChatUnreadCountV2 } from '@/types/chat-v2'

type UseChatRoomsV2Options = {
  enabled?: boolean
  mercureToken?: string | null // Optional: if provided, skip client-side token fetch
}

/**
 * Hook for fetching and subscribing to chat rooms V2 (marketplace product chats)
 *
 * Features:
 * - Fetches initial chat rooms via API
 * - Subscribes to Mercure for real-time updates
 * - User-specific topic: /chat-v2/rooms/user/{userId}
 * - Deduplicates rooms by ID
 * - Handles optimistic updates
 *
 * @param options Configuration options
 * @returns Chat rooms data, loading state, and query methods
 */
export function useChatRoomsV2(options: UseChatRoomsV2Options = {}) {
  const { enabled = true, mercureToken: externalToken } = options

  const queryClient = useQueryClient()

  // Fetch current user to get userId for topic subscription
  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id

  // Fetch Mercure JWT token only if not provided externally
  const { data: fetchedToken } = useMercureTokenV2(!externalToken && enabled)

  // Use external token if provided, otherwise use fetched token
  const mercureToken = externalToken || fetchedToken

  // Fetch initial chat rooms via API
  const {
    data: roomsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chatRoomsV2'],
    queryFn: async () => {
      console.log('[useChatRoomsV2] 🔍 Fetching chat rooms V2 from API...')
      const response = await getChatRoomsV2Client()
      console.log('[useChatRoomsV2] 📦 Raw API response:', response)
      console.log('[useChatRoomsV2] 📊 response.data:', response.data)
      console.log('[useChatRoomsV2] ✅ Fetched from API:', response.data?.member?.length, 'rooms')
      // Return response.data instead of response (ApiResponse wrapper)
      return response.data
    },
    enabled,
    // CRITICAL: Refetch on mount to get latest unread counts
    // SSR data may be stale if messages arrived between SSR fetch and client mount
    staleTime: 1000 * 60, // 60 seconds - matches server config
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: 'always', // ✅ Refetch to get latest unread counts (fixes notification badge issue)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect (Mercure handles updates)
  })

  const rooms = roomsData?.member || []

  // Memoize topics to prevent infinite loop
  const topics = useMemo(() => {
    const topicList: string[] = []

    // User-specific topic for V2 chat rooms
    if (userId) {
      topicList.push(`/chat-v2/rooms/user/${userId}`)
    }

    // Global topic for public room discovery (all users receive new public room notifications)
    topicList.push('/chat-v2/rooms')

    console.log('[useChatRoomsV2] 📡 Subscribing to Mercure topics:', topicList)
    return topicList
  }, [userId])

  // Memoize onMessage callback to prevent infinite loop
  const handleMercureRoom = useCallback(
    (update: ChatRoomV2) => {
      console.log(
        '[useChatRoomsV2] 📥 Received Mercure update for room:',
        update.id,
        update.name,
        'Product:',
        update.productTitle
      )

      // Add new room to cache
      queryClient.setQueryData(
        ['chatRoomsV2'],
        (old: ChatRoomV2Collection | undefined) => {
          if (!old) return old

          const existingRoom = old.member.find((room) => room.id === update.id)

          // Don't add duplicate
          if (existingRoom) {
            console.log('[useChatRoomsV2] ⏭️  Room already exists, skipping:', update.id)
            return old
          }

          // Add new room
          console.log('[useChatRoomsV2] ➕ Adding new room to cache:', update.id)

          // ✅ NOTE: Token invalidation is handled in chat-input-v2.tsx when user creates room
          // Don't invalidate here to prevent reconnection storms when receiving room updates

          return {
            ...old,
            member: [update, ...old.member],
            totalItems: (old.totalItems || 0) + 1,
          }
        }
      )
    },
    [queryClient]
  )

  // Subscribe to Mercure for real-time updates
  const { connected, error: mercureError } = useMercureTyped<ChatRoomV2>({
    topics,
    token: mercureToken,
    onMessage: handleMercureRoom,
    reconnect: true,
    reconnectDelay: 3000,
  })

  // ✅ Log only when data changes (not on every render)
  useEffect(() => {
    if (rooms.length > 0) {
      console.log('[useChatRoomsV2] 🏠 Extracted rooms:', rooms.length, 'rooms')
    }
  }, [rooms.length])

  useEffect(() => {
    console.log('[useChatRoomsV2] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
  }, [connected])

  return {
    rooms,
    isLoading,
    error: error || (mercureError ? new Error(mercureError) : null),
    refetch,
    totalItems: roomsData?.totalItems || 0,
    connected, // Expose connection status
  }
}
