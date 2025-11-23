/**
 * Chat rooms hook with real-time updates
 * Combines TanStack Query for initial data and Mercure for real-time updates
 * Subscribes to user-specific and global public room topics for instant synchronization
 */

'use client'

import { useMemo, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMercureTyped } from '@/lib/features/shared'
import { useMercureToken } from './use-mercure-token'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import type {
  ChatRoomFilters,
  PaginationParams,
  ChatRoomCollection,
  ChatRoom,
} from '../types'

type UseChatRoomsOptions = {
  filters?: ChatRoomFilters
  pagination?: PaginationParams
  enabled?: boolean
  mercureToken?: string | null // Optional: if provided, skip client-side token fetch
}
/**
 * Hook for fetching and subscribing to chat rooms
 *
 * Features:
 * - Fetches initial chat rooms via API
 * - Subscribes to Mercure for real-time updates
 * - Hybrid topic strategy:
 *   * User-specific: /chat/rooms/user/{userId} (private/group rooms)
 *   * Global: /chat/rooms (public rooms visible to all)
 * - Deduplicates rooms by ID
 * - Handles optimistic updates
 *
 * @param options Configuration options
 * @returns Chat rooms data, loading state, and query methods
 *
 * @example
 * ```tsx
 * const { rooms, isLoading, error, connected } = useChatRooms({
 *   filters: { type: 'group' },
 *   enabled: true
 * })
 * ```
 */
export function useChatRooms(options: UseChatRoomsOptions = {}) {
  const { filters, pagination, enabled = true, mercureToken: externalToken } = options

  const queryClient = useQueryClient()

  // Fetch current user to get userId for topic subscription
  const { data: currentUser } = useCurrentUser()
  const userId = currentUser?.id

  // Fetch Mercure JWT token only if not provided externally
  const { data: fetchedToken } = useMercureToken(
    !externalToken && enabled
  )

  // Use external token if provided, otherwise use fetched token
  const mercureToken = externalToken || fetchedToken

  // Fetch initial chat rooms via Next.js API Route
  const {
    data: roomsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chatRooms', filters, pagination],
    queryFn: async () => {
      console.log('[useChatRooms] 🔍 Fetching chat rooms from API...')

      // Build query parameters
      const params = new URLSearchParams()

      if (filters?.type) params.append('type', filters.type)
      if (filters?.participant) params.append('participant', filters.participant)
      if (pagination?.page) params.append('page', pagination.page.toString())
      if (pagination?.limit) params.append('itemsPerPage', pagination.limit.toString())

      const query = params.toString() ? `?${params.toString()}` : ''
      const url = `/api/chat/rooms${query}`
      console.log('[useChatRooms] 📡 Request URL:', url)

      // Call Next.js API Route (which handles cookies server-side)
      const response = await fetch(url)

      if (!response.ok) {
        console.error('[useChatRooms] ❌ Failed:', response.status, response.statusText)
        throw new Error(`Failed to fetch rooms: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('[useChatRooms] ✅ Fetched from API:', data.member?.length, 'rooms')

      return data as ChatRoomCollection
    },
    enabled,
    // CRITICAL: staleTime must match server QueryClient config to prevent refetch after SSR
    staleTime: 1000 * 60, // 60 seconds - matches server config
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false, // Don't refetch on mount (SSR data is fresh)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect (Mercure handles updates)
  })

  const rooms = roomsData?.member || []

  // Memoize topics to prevent infinite loop
  // Subscribe to both user-specific and global topics
  const topics = useMemo(() => {
    const topicList: string[] = []

    // User-specific topic (for private/group rooms where user is participant)
    if (userId) {
      topicList.push(`/chat/rooms/user/${userId}`)
    }

    // Global topic (for public rooms visible to all authenticated users)
    topicList.push('/chat/rooms')

    console.log('[useChatRooms] 📡 Subscribing to Mercure topics:', topicList)
    return topicList
  }, [userId])

  // Memoize onMessage callback to prevent infinite loop
  const handleMercureRoom = useCallback(
    (update: ChatRoom) => {
      console.log('[useChatRooms] 📥 Received Mercure update for room:', update.id, update.name)

      // Add new room to cache
      queryClient.setQueryData(
        ['chatRooms', filters, pagination],
        (old: ChatRoomCollection | undefined) => {
          if (!old) return old

          const existingRoom = old.member.find(
            (room) => room.id === update.id
          )

          // Don't add duplicate
          if (existingRoom) {
            console.log('[useChatRooms] ⏭️  Room already exists, skipping:', update.id)
            return old
          }

          // Add new room
          console.log('[useChatRooms] ➕ Adding new room to cache:', update.id, update.name, update.type)

          return {
            ...old,
            member: [update, ...old.member], // Add at beginning for newest-first
            totalItems: old.totalItems + 1,
          }
        }
      )
    },
    [queryClient, filters, pagination]
  )

  // Subscribe to Mercure for real-time updates (only if we have userId and token)
  const { connected, error: mercureError } = useMercureTyped<ChatRoom>({
    topics,
    token: mercureToken,
    onMessage: handleMercureRoom,
    reconnect: true,
    reconnectDelay: 3000,
  })

  // ✅ Log only when data changes (not on every render)
  useEffect(() => {
    if (rooms.length > 0) {
      console.log('[useChatRooms] 🏠 Extracted rooms:', rooms.length, 'rooms')
    }
  }, [rooms.length])

  useEffect(() => {
    console.log('[useChatRooms] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
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
