/**
 * Chat messages V2 hook with real-time updates for marketplace chats
 * Combines TanStack Query for initial data and Mercure for real-time updates
 */

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMercureTyped } from '../use-mercure'
import { useMercureTokenV2 } from './use-mercure-token-v2'
import { getMessagesV2Client } from '@/lib/api/chat-client-v2'
import type {
  MessageV2,
  MercureMessageV2Update,
  MessageV2Collection,
} from '@/types/chat-v2'

type UseChatMessagesV2Options = {
  roomId: number
  enabled?: boolean
  mercureToken?: string | null // Optional: if provided, skip client-side token fetch
}

/**
 * Hook for fetching and subscribing to chat messages V2 (marketplace product chats)
 *
 * Features:
 * - Fetches initial messages via API
 * - Subscribes to Mercure for real-time updates on /chat-v2/room/{roomId}
 * - Deduplicates messages by ID
 * - Sorts messages by creation time
 * - Handles optimistic updates
 *
 * @param options Configuration options
 * @returns Messages data, loading state, and query methods
 */
export function useChatMessagesV2(options: UseChatMessagesV2Options) {
  const { roomId, enabled = true, mercureToken: externalToken } = options

  const queryClient = useQueryClient()
  const [optimisticMessages, setOptimisticMessages] = useState<MessageV2[]>([])

  // Fetch Mercure JWT token only if not provided externally
  const { data: fetchedToken } = useMercureTokenV2(
    !externalToken && enabled && roomId > 0
  )

  // Use external token if provided, otherwise use fetched token
  const mercureToken = externalToken || fetchedToken

  // Debug: log token changes
  useEffect(() => {
    if (mercureToken) {
      console.log('[useChatMessagesV2] 🔑 Mercure token updated:', mercureToken.substring(0, 20) + '...')
    }
  }, [mercureToken])

  // Fetch initial messages via API
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messagesV2', roomId, undefined],
    queryFn: async () => {
      console.log('[useChatMessagesV2] 🔍 Fetching messages from API for room:', roomId)
      const response = await getMessagesV2Client(roomId)
      console.log('[useChatMessagesV2] 📦 Raw API response:', response)
      console.log('[useChatMessagesV2] 📊 response.data:', response.data)
      console.log('[useChatMessagesV2] ✅ Fetched from API:', response.data?.member?.length, 'messages')
      // Return response.data instead of response (ApiResponse wrapper)
      return response.data
    },
    enabled: enabled && roomId > 0,
    // CRITICAL: Must match server QueryClient config to prevent refetch after SSR
    staleTime: 1000 * 60, // 60 seconds - matches server config
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false, // Don't refetch on mount (SSR data is fresh)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect (Mercure handles updates)
  })

  const messages = messagesData?.member || []

  // Memoize topics to prevent infinite loop
  const topics = useMemo(() => [`/chat-v2/room/${roomId}`], [roomId])

  // Memoize onMessage callback to prevent infinite loop
  const handleMercureMessage = useCallback(
    (update: MercureMessageV2Update) => {
      console.log('[useChatMessagesV2] 📥 Received Mercure message:', update.id)

      // Remove matching optimistic message (by content + author, not ID)
      setOptimisticMessages((prev) => {
        const matchingOptimistic = prev.find((msg) => {
          const contentMatch = msg.content === update.content
          const authorMatch = String(msg.author.id) === String(update.author.id)
          return contentMatch && authorMatch
        })

        if (matchingOptimistic) {
          console.log(
            '[useChatMessagesV2] 🗑️  Removing optimistic message:',
            matchingOptimistic.id
          )
          return prev.filter((msg) => msg.id !== matchingOptimistic.id)
        }

        return prev
      })

      // Add new message to cache
      queryClient.setQueryData(
        ['messagesV2', roomId, undefined],
        (old: MessageV2Collection | undefined) => {
          if (!old) return old

          const existingMessage = old.member.find((msg) => msg.id === update.id)

          // Don't add duplicate (by ID)
          if (existingMessage) {
            console.log('[useChatMessagesV2] ⏭️  Message already exists:', update.id)
            return old
          }

          // Add new message
          const newMessage: MessageV2 = {
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
              '@id': update.chatRoom,
              '@type': 'ChatRoomV2',
              name: '',
            },
            createdAt: update.createdAt,
            updatedAt: update.updatedAt,
            status: 'delivered',
          }

          console.log('[useChatMessagesV2] ➕ Adding message to cache:', update.id)

          return {
            ...old,
            member: [...old.member, newMessage].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
            totalItems: (old.totalItems || 0) + 1,
          }
        }
      )
    },
    [roomId, queryClient]
  )

  // Subscribe to Mercure for real-time updates
  // ✅ CRITICAL: Only connect if roomId > 0 to prevent /chat-v2/room/0 subscription
  const { connected, error: mercureError } = useMercureTyped<MercureMessageV2Update>({
    topics,
    token: roomId > 0 ? mercureToken : null, // Block connection if roomId is invalid
    onMessage: handleMercureMessage,
    reconnect: true,
    reconnectDelay: 3000,
  })

  // Combine server messages with optimistic messages
  const allMessages = useMemo(() => {
    return [...messages, ...optimisticMessages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [messages, optimisticMessages])

  // Function to add optimistic message
  const addOptimisticMessage = useCallback((message: MessageV2) => {
    console.log('[useChatMessagesV2] ➕ Adding optimistic message:', message.id)
    setOptimisticMessages((prev) => [...prev, message])
  }, [])

  // Function to update optimistic message status
  const updateOptimisticMessageStatus = useCallback(
    (messageId: number, status: 'sending' | 'delivered' | 'error') => {
      console.log('[useChatMessagesV2] 🔄 Updating optimistic message status:', messageId, status)
      setOptimisticMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
      )
    },
    []
  )

  // Function to remove optimistic message
  const removeOptimisticMessage = useCallback((messageId: number) => {
    console.log('[useChatMessagesV2] 🗑️  Removing optimistic message:', messageId)
    setOptimisticMessages((prev) => prev.filter((msg) => msg.id !== messageId))
  }, [])

  // ✅ Log only when data changes (not on every render)
  useEffect(() => {
    if (allMessages.length > 0 && roomId > 0) {
      console.log('[useChatMessagesV2] 💬 Messages for room', roomId, ':', allMessages.length)
    }
  }, [allMessages.length, roomId])

  useEffect(() => {
    console.log('[useChatMessagesV2] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
  }, [connected])

  return {
    messages: allMessages,
    isLoading,
    error: error || (mercureError ? new Error(mercureError) : null),
    connected,
    refetch,
    addOptimisticMessage,
    updateOptimisticMessageStatus,
    removeOptimisticMessage,
  }
}
