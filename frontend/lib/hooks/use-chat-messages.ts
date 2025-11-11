/**
 * Chat messages hook with real-time updates
 * Combines TanStack Query for initial data and Mercure for real-time updates
 */

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMercureTyped } from './use-mercure'
import { useMercureToken } from './use-mercure-token'
import type {
  Message,
  MercureMessageUpdate,
  PaginationParams,
  MessageCollection
} from '@/types/chat'

type UseChatMessagesOptions = {
  roomId: number
  pagination?: PaginationParams
  enabled?: boolean
  mercureToken?: string | null // Optional: if provided, skip client-side token fetch
}

/**
 * Hook for fetching and subscribing to chat messages
 *
 * Features:
 * - Fetches initial messages via API
 * - Subscribes to Mercure for real-time updates
 * - Deduplicates messages by ID
 * - Sorts messages by creation time
 * - Handles optimistic updates
 *
 * @param options Configuration options
 * @returns Messages data, loading state, and query methods
 *
 * @example
 * ```tsx
 * const { messages, isLoading, error } = useChatMessages({
 *   roomId: 1,
 *   pagination: { page: 1, limit: 50 }
 * })
 * ```
 */
export function useChatMessages(options: UseChatMessagesOptions) {
  const { roomId, pagination, enabled = true, mercureToken: externalToken } = options

  const queryClient = useQueryClient()
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([])

  // Fetch Mercure JWT token only if not provided externally
  const { data: fetchedToken } = useMercureToken(
    !externalToken && enabled && roomId > 0
  )

  // Use external token if provided, otherwise use fetched token
  const mercureToken = externalToken || fetchedToken

  // Fetch initial messages via Next.js API Route
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messages', roomId, pagination],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams()
      // API Platform SearchFilter expects IRI format, not just the ID
      params.append('chatRoom', `/api/v1/chat_rooms/${roomId}`)

      if (pagination?.page) params.append('page', pagination.page.toString())
      if (pagination?.limit) params.append('itemsPerPage', pagination.limit.toString())

      const url = `/api/chat/messages?${params.toString()}`

      // Call Next.js API Route (which handles cookies server-side)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }

      const data = await response.json()
      return data as MessageCollection
    },
    enabled: enabled && roomId > 0,
    staleTime: 1000 * 60, // 1 minute
  })

  const messages = messagesData?.member || []

  // Memoize topics to prevent infinite loop
  const topics = useMemo(() => [`/chat/room/${roomId}`], [roomId])

  // Memoize onMessage callback to prevent infinite loop
  const handleMercureMessage = useCallback(
    (update: MercureMessageUpdate) => {
      // ✅ Remove matching optimistic message (by content + author, not ID)
      // Optimistic messages have negative IDs, real messages have positive IDs
      setOptimisticMessages((prev) => {
        const matchingOptimistic = prev.find(
          (msg) => {
            const contentMatch = msg.content === update.content
            // ✅ Compare both as strings to handle type inconsistencies
            const authorMatch = String(msg.author.id) === String(update.author.id)
            return contentMatch && authorMatch
          }
        )

        if (matchingOptimistic) {
          return prev.filter((msg) => msg.id !== matchingOptimistic.id)
        }

        return prev
      })

      // Add new message to cache
      queryClient.setQueryData(
        ['messages', roomId, pagination],
        (old: MessageCollection | undefined) => {
          if (!old) return old

          const existingMessage = old.member.find(
            (msg) => msg.id === update.id
          )

          // Don't add duplicate (by ID)
          if (existingMessage) {
            return old
          }

          // Add new message
          // ✅ Mercure update now always has full User object
          const newMessage: Message = {
            id: update.id,
            content: update.content,
            author: {
              id: String(update.author.id),
              email: update.author.email,
              name: update.author.name,
              picture: update.author.picture,
              roles: [],
              created_at: null,
              has_google_account: false,
            },
            chatRoom: {
              '@id': `/api/v1/chat_rooms/${roomId}`,
              '@type': 'ChatRoom',
              name: '',
            },
            createdAt: update.createdAt,
            updatedAt: update.updatedAt,
          }

          return {
            ...old,
            member: [...old.member, newMessage],
            totalItems: old.totalItems + 1,
          }
        }
      )
    },
    [queryClient, roomId, pagination]
  )

  // Subscribe to Mercure for real-time updates
  const { connected, error: mercureError } = useMercureTyped<MercureMessageUpdate>({
    topics,
    token: mercureToken,
    onMessage: handleMercureMessage,
    reconnect: true,
    reconnectDelay: 3000,
  })

  /**
   * Add an optimistic message (before server confirmation)
   */
  const addOptimisticMessage = (message: Message) => {
    setOptimisticMessages((prev) => [...prev, { ...message, status: 'pending' }])
  }

  /**
   * Update optimistic message status (when server responds)
   */
  const updateOptimisticMessageStatus = (messageId: number, status: 'sent' | 'delivered') => {
    setOptimisticMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
    )
  }

  /**
   * Remove an optimistic message (if send failed)
   */
  const removeOptimisticMessage = (messageId: number) => {
    setOptimisticMessages((prev) =>
      prev.filter((msg) => msg.id !== messageId)
    )
  }

  /**
   * Combine fetched messages with optimistic messages
   * Sort by creation time
   */
  const allMessages = [...messages, ...optimisticMessages].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime()
    const timeB = new Date(b.createdAt).getTime()
    return timeA - timeB
  })

  /**
   * Deduplicate messages by ID (in case of race conditions)
   */
  const uniqueMessages = allMessages.filter(
    (message, index, self) =>
      index === self.findIndex((m) => m.id === message.id)
  )

  return {
    messages: uniqueMessages,
    isLoading,
    error: error || (mercureError ? new Error(mercureError) : null),
    connected,
    refetch,
    addOptimisticMessage,
    updateOptimisticMessageStatus,
    removeOptimisticMessage,
  }
}
