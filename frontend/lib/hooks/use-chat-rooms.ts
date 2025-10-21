/**
 * Chat rooms hook
 * Fetches initial chat rooms via API without Mercure subscription
 * (Mercure is only used for real-time messages in the active room)
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type {
  ChatRoomFilters,
  PaginationParams,
  ChatRoomCollection
} from '@/types/chat'

type UseChatRoomsOptions = {
  filters?: ChatRoomFilters
  pagination?: PaginationParams
  enabled?: boolean
}

/**
 * Hook for fetching chat rooms
 *
 * Features:
 * - Fetches initial chat rooms via API
 * - No Mercure subscription (rooms metadata changes rarely)
 * - Use refetch() to manually update the list
 *
 * @param options Configuration options
 * @returns Chat rooms data, loading state, and query methods
 *
 * @example
 * ```tsx
 * const { rooms, isLoading, error } = useChatRooms({
 *   filters: { type: 'group' },
 *   enabled: true
 * })
 * ```
 */
export function useChatRooms(options: UseChatRoomsOptions = {}) {
  const { filters, pagination, enabled = true } = options

  // Fetch initial chat rooms via Next.js API Route
  const {
    data: roomsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['chatRooms', filters, pagination],
    queryFn: async () => {
      console.log('[useChatRooms] 🔍 Fetching chat rooms...')
      
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
      console.log('[useChatRooms] ✅ Response data:', data)
      console.log('[useChatRooms] 📦 Keys in response:', Object.keys(data))
      console.log('[useChatRooms] 🔢 hydra:member length:', data['hydra:member']?.length)
      console.log('[useChatRooms] 🔢 member length:', (data as any).member?.length)

      return data as ChatRoomCollection
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // ✅ Our API returns 'member', not 'hydra:member'
  const rooms = roomsData?.member || []
  
  console.log('[useChatRooms] 🏠 Extracted rooms:', rooms.length, 'rooms')

  return {
    rooms,
    isLoading,
    error,
    refetch,
    totalItems: roomsData?.totalItems || 0, // ✅ API returns 'totalItems'
  }
}
