/**
 * Real Chat Interface V2 Component
 * Product-based chat with Mercure real-time updates
 * Includes product details sidebar
 */

'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useChatStoreV2 } from '@/lib/stores/use-chat-store-v2'
import { useChatMessagesV2 } from '@/lib/features/chat-v2/hooks/use-chat-messages-v2'
import { useChatRoomsV2 } from '@/lib/features/chat-v2/hooks/use-chat-rooms-v2'
import { useUnreadNotificationsV2 } from '@/lib/features/chat-v2/hooks/use-unread-notifications-v2'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useProduct } from '@/lib/hooks/use-products'
import { useMercureConnectionMonitor } from '@/lib/hooks/use-mercure-connection-monitor'
import { createProductChatClient, markChatRoomReadV2Client } from '@/lib/features/chat-v2/api/product-chat-client'
import { ChatHeaderV2 } from './chat-header-v2'
import { ChatMessagesV2 } from './chat-messages-v2'
import { ChatInputV2 } from './chat-input-v2'
import { AppSidebarV2 } from './app-sidebar-v2'
import { MercureConnectionLostDialog } from '@/app/(protected)/chat/_components/mercure-connection-lost-dialog'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import type { User } from '@/types/auth'
import type { Product } from '@/types/product'
import type { ChatRoomV2, MessageV2 } from '@/lib/features/marketplace-chat'

type RealChatInterfaceV2Props = {
  initialMercureToken: string | null
  initialProductId: number | null
  initialSellerId: number | null
  initialUser: User | null
  initialProduct: Product | null
  initialRoomId?: number | null
}

export function RealChatInterfaceV2({
  initialMercureToken,
  initialProductId,
  initialSellerId,
  initialUser,
  initialProduct,
  initialRoomId = null,
}: RealChatInterfaceV2Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const [roomId, setRoomId] = useState<number | null>(initialRoomId)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)

  // ✅ Get productId and userId from URL search params for instant client-side navigation
  const urlProductId = parseInt(searchParams.get('productId') || '0', 10)
  const urlUserId = parseInt(searchParams.get('userId') || '0', 10)

  const currentProductId = urlProductId > 0 ? urlProductId : initialProductId
  const currentSellerId = urlUserId > 0 ? urlUserId : initialSellerId

  // Get current authenticated user (use initialUser from server as fallback)
  const { data: currentUser } = useCurrentUser()
  const effectiveUser = currentUser ?? initialUser

  // Fetch product details (use initialProduct from server as fallback)
  const { data: product, isLoading: isLoadingProduct, error: productError } = useProduct(currentProductId || 0)
  const effectiveProduct = product ?? initialProduct

  // Get current room and sidebar state from store
  const { setCurrentRoom, currentRoom, isProductDetailsOpen } = useChatStoreV2()

  // Fetch all rooms to get the current room details
  // ✅ CRITICAL: Always enabled to ensure rooms are loaded for room finding
  const { rooms, isLoading: isLoadingRooms } = useChatRoomsV2({ enabled: true })

  // Calculate current room from rooms list OR use currentRoom from store if available
  // This fixes the "Loading conversation..." issue when room is just created
  const currentRoomData = useMemo(() => {
    if (!roomId) return null
    // First try to find in rooms list
    const roomInList = rooms.find((room: ChatRoomV2) => room.id === roomId)
    // If not found, use currentRoom from store (happens when room just created)
    return roomInList || currentRoom
  }, [roomId, rooms, currentRoom])

  // ✅ NEW WORKFLOW: Don't create room on mount - wait for first message
  // Just validate that we have the required data
  useEffect(() => {
    if (!effectiveUser || !currentProductId || !currentSellerId) {
      console.log('[RealChatInterfaceV2] ⏸️ Missing data - waiting...')
      return
    }

    // Prevent self-chat
    const currentUserIdNum = parseInt(effectiveUser.id, 10)
    if (currentUserIdNum === currentSellerId) {
      console.log('[RealChatInterfaceV2] ❌ Self-chat prevented')
      setRoomError('Vous ne pouvez pas discuter avec vous-même.')
      return
    }

    // Clear any previous errors
    setRoomError(null)
    console.log('[RealChatInterfaceV2] ✅ Ready to create room on first message', {
      productId: currentProductId,
      sellerId: currentSellerId,
    })
  }, [effectiveUser, currentProductId, currentSellerId])

  // Try to find existing room from rooms list
  // ✅ CRITICAL: Only run when product/seller/user changes, NOT when rooms updates
  // If we include 'rooms' in dependencies, this effect runs on EVERY Mercure update,
  // causing roomId to be reset unnecessarily
  // ✅ CRITICAL FIX: Also run when rooms finish loading to find room if it wasn't found initially
  useEffect(() => {
    if (!currentProductId || !currentSellerId || !effectiveUser) return
    // ✅ Wait for rooms to load before searching (prevents missing room on initial navigation)
    if (isLoadingRooms && rooms.length === 0) {
      console.log('[RealChatInterfaceV2] ⏳ Waiting for rooms to load before searching...')
      return
    }

    // ✅ CRITICAL FIX: Ensure ALL IDs are properly parsed as numbers for consistent comparison
    const currentUserId = parseInt(String(effectiveUser.id), 10)
    const sellerIdNum = parseInt(String(currentSellerId), 10)

    // ✅ DEBUG: Log search criteria with types
    console.log('[RealChatInterfaceV2] 🔍 Searching for room with:', {
      productId: currentProductId,
      productIdType: typeof currentProductId,
      sellerId: sellerIdNum,
      sellerIdType: typeof sellerIdNum,
      currentUserId,
      currentUserIdType: typeof currentUserId,
      totalRooms: rooms.length
    })
    console.log('[RealChatInterfaceV2] 📋 Available rooms:', rooms.map(r => ({
      id: r.id,
      productId: r.productId,
      productTitle: r.productTitle,
      participants: r.participants?.map(p => ({
        id: p.user.id,
        idType: typeof p.user.id,
        email: p.user.email
      }))
    })))

    // Find existing room for this product + seller combination
    // Must check that both current user and seller are participants
    const existingRoom = rooms.find((room: ChatRoomV2) => {
      console.log('[RealChatInterfaceV2] 🔎 Checking room:', {
        roomId: room.id,
        roomProductId: room.productId,
        searchingProductId: currentProductId,
        productMatch: room.productId === currentProductId,
        participants: room.participants,
      })

      if (room.productId !== currentProductId) {
        console.log('[RealChatInterfaceV2] ❌ Product ID mismatch')
        return false
      }

      // ✅ CRITICAL FIX: Ensure participant IDs are properly parsed as numbers
      // API might return strings, so we force conversion with String() wrapper
      console.log('[RealChatInterfaceV2] 🔍 DEBUG participants for room', room.id, ':', {
        participants: room.participants,
        participantsCount: room.participants?.length,
        participantsStructure: room.participants?.map(p => ({
          hasUser: !!p.user,
          userId: p.user?.id,
          userIdType: typeof p.user?.id,
          userEmail: p.user?.email,
          fullParticipant: p,
        }))
      })

      const participantIds = room.participants?.map((p) => {
        const userId = p.user?.id
        if (!userId) {
          console.error('[RealChatInterfaceV2] ❌ Participant has no user.id:', p)
          return null
        }
        const parsed = parseInt(String(userId), 10)
        if (isNaN(parsed)) {
          console.error('[RealChatInterfaceV2] ❌ Failed to parse user ID:', userId, 'for participant:', p)
          return null
        }
        return parsed
      }).filter((id): id is number => id !== null) || []

      const hasCurrentUser = participantIds.includes(currentUserId)
      const hasSeller = participantIds.includes(sellerIdNum)

      console.log('[RealChatInterfaceV2] 👥 Participant check:', {
        roomId: room.id,
        participantIds: JSON.stringify(participantIds),
        participantIdsTypes: participantIds.map(id => typeof id),
        currentUserId: JSON.stringify(currentUserId),
        currentUserIdType: typeof currentUserId,
        sellerIdNum: JSON.stringify(sellerIdNum),
        sellerIdType: typeof sellerIdNum,
        hasCurrentUser,
        hasSeller,
        MATCH: hasCurrentUser && hasSeller,
        // Manual check with strict equality
        manualCheck: participantIds.map(id => ({
          id: JSON.stringify(id),
          type: typeof id,
          matchesUser: id === currentUserId,
          matchesSeller: id === sellerIdNum,
          strictUserMatch: id === currentUserId && typeof id === 'number',
          strictSellerMatch: id === sellerIdNum && typeof id === 'number',
        }))
      })

      return hasCurrentUser && hasSeller
    })

    if (existingRoom) {
      console.log('[RealChatInterfaceV2] 📦 Found existing room:', existingRoom.id)
      setRoomId(existingRoom.id)
      setCurrentRoom(existingRoom.id, existingRoom)
    } else {
      console.log('[RealChatInterfaceV2] 📭 No existing room - will create on first message')

      // ✅ CRITICAL: Explicitly reset current room state
      // This handles switching from a product WITH a room to a product WITHOUT a room
      setRoomId(null)
      setCurrentRoom(null, null)

      // ✅ CRITICAL: Invalidate Mercure token when switching to a new product without an existing room
      // This ensures we get a fresh token that will include the new room's topic after creation
      console.log('[RealChatInterfaceV2] 🔄 Invalidating Mercure token to prepare for new room')
      queryClient.invalidateQueries({ queryKey: ['mercure', 'token', 'v2'] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProductId, currentSellerId, effectiveUser, setCurrentRoom, queryClient, isLoadingRooms])

  // Fetch messages for current room with Mercure real-time updates
  // ✅ CRITICAL: Only fetch when we have a valid roomId
  const {
    messages,
    isLoading: isLoadingMessages,
    error: messagesError,
    connected,
    addOptimisticMessage,
    updateOptimisticMessageStatus,
    removeOptimisticMessage,
    loadMoreMessages,
    hasMoreMessages,
    totalItems,
  } = useChatMessagesV2({
    roomId: roomId || 0, // Pass 0 if null, hook will disable fetching via enabled flag
    // Don't pass initialMercureToken - let the hook fetch its own token that auto-refreshes
    enabled: roomId !== null && roomId > 0,
    initialItemsPerPage: 50, // Load last 50 messages initially
  })

  // ✅ CRITICAL: Clear messages when no valid room is selected to prevent showing stale data
  const displayMessages = useMemo(() => {
    // If no valid room, show empty array
    if (!roomId || roomId <= 0) return []
    // Otherwise show messages from the hook
    return messages
  }, [roomId, messages])

  // Monitor Mercure connection and show dialog if connection lost
  const { showDialog, handleContinue, handleQuit } = useMercureConnectionMonitor({
    error: messagesError,
  })

  // Real-time unread count updates
  useUnreadNotificationsV2({
    userId: effectiveUser ? parseInt(effectiveUser.id, 10) : undefined,
    currentRoomId: roomId || undefined,
    mercureToken: initialMercureToken,
    enabled: !!effectiveUser && !!initialMercureToken,
  })

  // ✅ CRITICAL FIX: Force refetch when room changes to ensure ALL messages are loaded
  // This is especially important when user clicks on a notification for another conversation
  // We need to explicitly invalidate and refetch to get ALL messages from that room
  useEffect(() => {
    if (roomId && roomId > 0) {
      console.log('[RealChatInterfaceV2] 🔄 Room changed, forcing messages refetch for room:', roomId)
      // ✅ CRITICAL: Invalidate the query cache for this room to force a fresh fetch
      // This ensures we get ALL messages when switching to a different conversation
      queryClient.invalidateQueries({ queryKey: ['messagesV2', roomId] })
      // Also explicitly refetch to ensure data is loaded immediately
      queryClient.refetchQueries({ 
        queryKey: ['messagesV2', roomId],
        type: 'active' // Only refetch active queries
      })
    }
  }, [roomId, queryClient])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (displayMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [displayMessages])

  // Mark room as read when entering and maintain with heartbeat
  useEffect(() => {
    if (!roomId || roomId <= 0) return

    // Mark as read immediately when entering room
    const markAsRead = async () => {
      try {
        await markChatRoomReadV2Client(roomId)
        console.log('[RealChatInterfaceV2] ✅ Marked room as read:', roomId)
        
        // ✅ CRITICAL FIX: Update rooms cache to remove notification badge immediately
        // This ensures the notification disappears right away when user enters the room
        queryClient.setQueryData<ChatRoomV2Collection>(
          ['chatRoomsV2'],
          (oldData) => {
            if (!oldData) return oldData

            const updatedRooms = oldData.member.map((room) =>
              room.id === roomId
                ? { ...room, unreadCount: 0 } // Clear unread count for current room
                : room
            )

            console.log(
              `[RealChatInterfaceV2] 🔄 Updated rooms cache - cleared unread count for room #${roomId}`
            )

            return {
              ...oldData,
              member: updatedRooms,
            }
          }
        )
      } catch (error) {
        console.error('[RealChatInterfaceV2] ❌ Failed to mark room as read:', error)
      }
    }

    markAsRead()

    // Set up heartbeat to maintain "read" status (every 3 seconds)
    // This prevents false unread counts when user is actively viewing
    const heartbeatInterval = setInterval(() => {
      markAsRead()
    }, 3000) // 3 seconds

    return () => {
      clearInterval(heartbeatInterval)
    }
  }, [roomId, queryClient])

  /**
   * Callback after message sent
   * ✅ CRITICAL FIX: Do NOT invalidate after every message!
   * - Messages are already added via Mercure real-time updates
   * - Invalidating causes a refetch that returns only 30 messages (pagination)
   * - This overwrites newer messages in cache, causing them to disappear
   * - Only invalidate in special cases (e.g., first message in new room)
   */
  const handleMessageSent = useCallback(() => {
    // ✅ REMOVED: Automatic invalidation causes message loss
    // Messages are already added via Mercure, so no refetch needed
    console.log('[RealChatInterfaceV2] 📨 Message sent - relying on Mercure for real-time update')
  }, [])

  /**
   * Callback when room is created
   * Handles room state update, cache management, and message prefetching
   */
  const handleRoomCreated = useCallback(async (room: ChatRoomV2) => {
    console.log('[RealChatInterfaceV2] ✅ Room created:', room.id)
    setRoomId(room.id)
    setCurrentRoom(room.id, room)
    // Add to sidebar cache
    queryClient.setQueryData(['chatRoomsV2'], (old: any) => {
      if (!old) return { member: [room], totalItems: 1 }
      const exists = old.member?.find((r: ChatRoomV2) => r.id === room.id)
      if (exists) return old
      return {
        ...old,
        member: [room, ...(old.member || [])],
        totalItems: (old.totalItems || 0) + 1,
      }
    })
    queryClient.invalidateQueries({ queryKey: ['chatRoomsV2'] })
    // ✅ CRITICAL: Invalidate Mercure token to get updated token with new room's topic
    console.log('[RealChatInterfaceV2] 🔄 Room created - invalidating Mercure token to include new room topic')
    queryClient.invalidateQueries({ queryKey: ['mercure', 'token', 'v2'] })
    // ✅ CRITICAL: Prefetch messages for the new room
    queryClient.prefetchQuery({
      queryKey: ['messagesV2', room.id],
      queryFn: async () => {
        const { getMessagesV2Client } = await import('@/lib/api/chat-client-v2')
        const response = await getMessagesV2Client(room.id)
        return response.data
      },
    })
  }, [setCurrentRoom, queryClient])

  /**
   * Adapter function to convert MessageV2 to ChatInputV2 optimistic message format
   */
  const handleAddOptimisticMessage = useCallback((message: {
    id: number
    content: string
    author: {
      id: string
      email: string
      name: string | null
    }
    createdAt: string
  }) => {
    // Convert to full MessageV2 format with complete User object
    const fullAuthor: User = {
      id: message.author.id,
      email: message.author.email,
      name: message.author.name,
      picture: effectiveUser?.picture || null,
      roles: effectiveUser?.roles || [],
      created_at: effectiveUser?.created_at || null,
      has_google_account: effectiveUser?.has_google_account || false,
    }

    const fullMessage: MessageV2 = {
      ...message,
      author: fullAuthor,
      chatRoom: { '@id': `/api/v2/chat_rooms/${roomId}`, '@type': 'ChatRoomV2', name: '' },
      status: 'pending',
    }
    addOptimisticMessage(fullMessage)
  }, [addOptimisticMessage, roomId, effectiveUser])

  /**
   * Adapter function to convert status from ChatInputV2 ('sent' | 'delivered') to V2 hook format
   */
  const handleUpdateOptimisticMessageStatus = useCallback((messageId: number, status: 'sent' | 'delivered') => {
    // Map 'sent' to 'delivered' (both mean the same in our context)
    updateOptimisticMessageStatus(messageId, status === 'sent' ? 'delivered' : 'delivered')
  }, [updateOptimisticMessageStatus])

  // Show loading state while creating room or loading product
  if (isCreatingRoom || isLoadingProduct) {
    return (
      <SidebarProvider>
        <AppSidebarV2 product={effectiveProduct} />
        <SidebarInset>
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <Skeleton className="h-8 w-64" />
              <p className="text-sm text-muted-foreground mt-2">
                {isCreatingRoom ? 'Création de la conversation...' : 'Chargement du produit...'}
              </p>
            </div>
            <div className="flex-1 p-4 space-y-4">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="h-16 w-2/3 ml-auto" />
              <Skeleton className="h-16 w-3/4" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Show error if room creation failed or product not found
  if (roomError || productError) {
    return (
      <SidebarProvider>
        <AppSidebarV2 product={effectiveProduct} />
        <SidebarInset>
          <div className="flex h-full items-center justify-center p-4">
            <div className="max-w-md space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {roomError || 'Produit introuvable.'}
                </AlertDescription>
              </Alert>

              {/* Debug info */}
              <Alert>
                <AlertDescription className="text-xs space-y-1">
                  <p><strong>Debug:</strong></p>
                  <p>Product ID: {currentProductId}</p>
                  <p>Seller ID: {currentSellerId}</p>
                  <p>Current User: {effectiveUser ? `${effectiveUser.id} (${effectiveUser.email})` : 'Not loaded'}</p>
                  <p>Room ID: {roomId || 'null'}</p>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // Show chat interface
  return (
    <SidebarProvider>
      <AppSidebarV2 product={effectiveProduct} />

      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {/* Header with product info and Mercure connection status - Fixed at top */}
        <div className="shrink-0">
          <ChatHeaderV2
            currentRoom={currentRoomData}
            product={effectiveProduct}
            connected={connected}
          />
        </div>

        {/* Messages display or empty state - Scrollable middle section */}
        {/* ✅ NEW: Show chat interface even without roomId if we have productId + sellerId (will create room on first message) */}
        {roomId !== null && roomId > 0 ? (
          <>
            {/* Existing room - show messages */}
            <div className="flex-1 min-h-0">
              <ChatMessagesV2
                messages={displayMessages}
                isLoading={isLoadingMessages}
                currentUserId={effectiveUser?.id || null}
                messagesEndRef={messagesEndRef}
                onLoadMore={loadMoreMessages}
                hasMoreMessages={hasMoreMessages}
                totalItems={totalItems}
              />
            </div>

            {/* Input for sending messages - Fixed at bottom */}
            <div className="shrink-0">
              <ChatInputV2
                roomId={roomId}
                productId={currentProductId}
                sellerId={currentSellerId}
                onRoomCreated={handleRoomCreated}
                onMessageSent={handleMessageSent}
                addOptimisticMessage={handleAddOptimisticMessage}
                updateOptimisticMessageStatus={handleUpdateOptimisticMessageStatus}
                removeOptimisticMessage={removeOptimisticMessage}
                currentUser={effectiveUser}
                disabled={isLoadingMessages}
              />
            </div>
          </>
        ) : currentProductId && currentSellerId ? (
          <>
            {/* No room yet, but ready to create on first message */}
            <div className="flex-1 min-h-0 flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-2">
                <p className="text-lg text-muted-foreground">
                  Aucun message pour le moment
                </p>
                <p className="text-sm text-muted-foreground">
                  Envoyez votre premier message pour démarrer la conversation
                </p>
              </div>
            </div>

            {/* Input for creating room and sending first message */}
            <div className="shrink-0">
              <ChatInputV2
                roomId={roomId}
                productId={currentProductId}
                sellerId={currentSellerId}
                onRoomCreated={handleRoomCreated}
                onMessageSent={handleMessageSent}
                addOptimisticMessage={handleAddOptimisticMessage}
                updateOptimisticMessageStatus={handleUpdateOptimisticMessageStatus}
                removeOptimisticMessage={removeOptimisticMessage}
                currentUser={effectiveUser}
                disabled={false}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-background">
            <div className="text-center space-y-4">
              {effectiveProduct ? (
                <>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">
                      {effectiveProduct.title}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {effectiveProduct.price} €
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Chargement de la conversation pour ce produit...
                  </p>
                </>
              ) : (
                <h2 className="text-2xl font-medium text-muted-foreground">
                  Chargement de la conversation...
                </h2>
              )}
            </div>
          </div>
        )}
      </SidebarInset>

      {/* Mercure Connection Lost Dialog */}
      <MercureConnectionLostDialog
        open={showDialog}
        onContinue={handleContinue}
        onQuit={handleQuit}
      />
    </SidebarProvider>
  )
}
