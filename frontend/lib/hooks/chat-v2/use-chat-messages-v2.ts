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
  initialItemsPerPage?: number // Initial number of messages to load (default: 50)
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
  const { roomId, enabled = true, mercureToken: externalToken, initialItemsPerPage = 50 } = options

  const queryClient = useQueryClient()
  const [optimisticMessages, setOptimisticMessages] = useState<MessageV2[]>([])
  const [loadedItemsPerPage, setLoadedItemsPerPage] = useState(initialItemsPerPage)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)

  // Fetch Mercure JWT token only if not provided externally
  const { data: fetchedToken } = useMercureTokenV2(
    !externalToken && enabled && roomId > 0
  )

  // Use external token if provided, otherwise use fetched token
  const mercureToken = externalToken || fetchedToken

  // Debug: log token changes and monitor token invalidation
  useEffect(() => {
    if (mercureToken) {
      console.log('[useChatMessagesV2] 🔑 Mercure token updated:', mercureToken.substring(0, 20) + '...')
      console.log('[useChatMessagesV2] 🔄 Token changed - Mercure will reconnect with new topics')
    } else if (enabled && roomId > 0) {
      console.log('[useChatMessagesV2] ⏳ Waiting for Mercure token...')
    }
  }, [mercureToken, enabled, roomId])

  // ✅ CRITICAL: Reset pagination when room changes - MUST happen before query executes
  // This ensures we always fetch with initialItemsPerPage when switching rooms
  useEffect(() => {
    if (roomId > 0) {
      setLoadedItemsPerPage(initialItemsPerPage)
      setHasMoreMessages(true)
    }
  }, [roomId, initialItemsPerPage])

  // Fetch initial messages via API
  // ✅ CRITICAL FIX: Always use initialItemsPerPage in queryFn when roomId changes
  // When roomId changes, React Query creates a new query, but we need to ensure we fetch ALL messages
  // by using initialItemsPerPage, not the potentially stale loadedItemsPerPage from previous room
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['messagesV2', roomId],
    queryFn: async () => {
      // ✅ CRITICAL: Always use initialItemsPerPage for fetching messages
      // This ensures we fetch ALL messages when switching to a new room
      // loadedItemsPerPage is only used for "load more" functionality
      console.log('[useChatMessagesV2] 🔍 Fetching messages from API for room:', roomId, 'limit:', initialItemsPerPage)
      const response = await getMessagesV2Client(roomId, { itemsPerPage: initialItemsPerPage })
      console.log('[useChatMessagesV2] 📦 Raw API response:', response)
      console.log('[useChatMessagesV2] 📊 response.data:', response.data)
      console.log('[useChatMessagesV2] ✅ Fetched from API:', response.data?.member?.length, 'messages')
      
      // Check if there are more messages to load
      const totalItems = response.data?.totalItems || 0
      const loadedCount = response.data?.member?.length || 0
      setHasMoreMessages(loadedCount < totalItems)
      
      // Return response.data instead of response (ApiResponse wrapper)
      return response.data
    },
    enabled: enabled && roomId > 0,
    // ✅ CRITICAL FIX: Set staleTime to 0 for messages to always fetch fresh data
    // When user navigates from /marketplace to /chat-v2, new messages may have arrived
    // SSR data can be stale, so we need to always refetch to show all messages
    staleTime: 0, // ✅ Always consider data stale - force refetch to get latest messages
    gcTime: 1000 * 60 * 5, // 5 minutes
    // ✅ CRITICAL FIX: Refetch on mount to get latest messages
    refetchOnMount: 'always', // ✅ Always refetch to get latest messages (fixes missing messages bug)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect (Mercure handles updates)
    // ✅ CRITICAL FIX: Network mode to bypass cache completely
    networkMode: 'always', // Always fetch from network, never use cache
  })

  // ✅ Refetch when loadedItemsPerPage changes (for "load more")
  useEffect(() => {
    if (roomId > 0 && loadedItemsPerPage > initialItemsPerPage) {
      console.log('[useChatMessagesV2] 🔄 Loading more messages, new limit:', loadedItemsPerPage)
      refetch()
    }
  }, [loadedItemsPerPage, roomId, initialItemsPerPage, refetch])

  const messages = messagesData?.member || []

  // Memoize topics to prevent infinite loop
  const topics = useMemo(() => [`/chat-v2/room/${roomId}`], [roomId])

  // Memoize onMessage callback to prevent infinite loop
  const handleMercureMessage = useCallback(
    (update: MercureMessageV2Update) => {
      console.log('[useChatMessagesV2] 📥 Received Mercure message:', update.id, 'for room:', roomId)

      // ✅ CRITICAL: Capture current roomId to prevent race condition when switching rooms
      const currentRoomId = roomId

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

      // Add new message to cache (use captured roomId to prevent race condition)
      queryClient.setQueryData(
        ['messagesV2', currentRoomId],
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

          // ✅ CRITICAL: Merge with existing messages and sort by date
          // Don't increment totalItems - it will be updated on next API fetch
          // This prevents inconsistencies when API returns different totalItems
          const mergedMessages = [...old.member, newMessage].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )

          return {
            ...old,
            member: mergedMessages,
            // Keep existing totalItems - don't increment to avoid inconsistencies
            // The API will provide the correct totalItems on next fetch
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

  // ✅ NEW: Cleanup optimistic messages when real messages arrive via API
  // This handles the case where we fetch the message before Mercure delivers it
  useEffect(() => {
    if (messages.length === 0 || optimisticMessages.length === 0) return

    setOptimisticMessages((prev) => {
      const remaining = prev.filter((optMsg) => {
        // Check if this optimistic message exists in the real messages
        // Match by content and author ID (fuzzy match as we don't have the real ID yet)
        const exists = messages.some(
          (realMsg) =>
            realMsg.content === optMsg.content &&
            String(realMsg.author.id) === String(optMsg.author.id) &&
            // Only match if real message is recent (within last 2 minutes)
            new Date(realMsg.createdAt).getTime() >
              new Date(optMsg.createdAt).getTime() - 120000
        )
        return !exists
      })

      if (remaining.length !== prev.length) {
        console.log(
          '[useChatMessagesV2] 🧹 Cleaned up',
          prev.length - remaining.length,
          'optimistic messages found in API'
        )
      }

      return remaining
    })
  }, [messages, optimisticMessages.length])

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
    (messageId: number, status: 'pending' | 'sent' | 'delivered') => {
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

  // Function to load more messages (older messages)
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoading || !roomId) return
    
    const newLimit = loadedItemsPerPage + 50
    console.log('[useChatMessagesV2] 📥 Loading more messages, increasing limit to:', newLimit)
    
    // Fetch more messages
    try {
      const response = await getMessagesV2Client(roomId, { itemsPerPage: newLimit })
      const newMessages = response.data?.member || []
      
      // ✅ CRITICAL: Merge new messages with existing ones
      // API returns messages sorted by date (oldest first), so we need to merge properly
      queryClient.setQueryData<MessageV2Collection>(
        ['messagesV2', roomId],
        (old) => {
          if (!old) {
            return response.data || { member: [], totalItems: 0 }
          }
          
          // Merge: combine existing and new messages, deduplicate by ID, sort by date
          const existingIds = new Set(old.member.map(m => m.id))
          const additionalMessages = newMessages.filter(m => !existingIds.has(m.id))
          const merged = [...old.member, ...additionalMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          
          console.log('[useChatMessagesV2] 🔄 Merged messages:', {
            existing: old.member.length,
            new: additionalMessages.length,
            total: merged.length
          })
          
          // Update hasMoreMessages
          const totalItems = response.data?.totalItems || 0
          setHasMoreMessages(merged.length < totalItems)
          
          return {
            ...old,
            member: merged,
            totalItems: response.data?.totalItems || totalItems,
          }
        }
      )
      
      // Update loaded items count
      setLoadedItemsPerPage(newLimit)
    } catch (error) {
      console.error('[useChatMessagesV2] ❌ Failed to load more messages:', error)
    }
  }, [hasMoreMessages, isLoading, roomId, loadedItemsPerPage, queryClient])

  return {
    messages: allMessages,
    isLoading,
    error: error || (mercureError ? new Error(mercureError) : null),
    connected,
    refetch,
    addOptimisticMessage,
    updateOptimisticMessageStatus,
    removeOptimisticMessage,
    loadMoreMessages,
    hasMoreMessages,
    totalItems: messagesData?.totalItems || 0,
  }
}
