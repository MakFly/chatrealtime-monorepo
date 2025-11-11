/**
 * Real Chat Interface V2 Component
 * Product-based chat with Mercure real-time updates
 * Includes product details sidebar
 */

'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatStoreV2 } from '@/lib/stores/use-chat-store-v2'
import { useChatMessagesV2 } from '@/lib/hooks/use-chat-messages-v2'
import { useChatRoomsV2 } from '@/lib/hooks/use-chat-rooms-v2'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useProduct } from '@/lib/hooks/use-products'
import { useMercureConnectionMonitor } from '@/lib/hooks/use-mercure-connection-monitor'
import { createProductChatClient } from '@/lib/api/chat-client-v2'
import { ChatHeaderV2 } from './chat-header-v2'
import { ChatMessagesV2 } from './chat-messages-v2'
import { ChatInputV2 } from './chat-input-v2'
import { AppSidebarV2 } from './app-sidebar-v2'
import { MercureConnectionLostDialog } from '@/app/(protected)/chat/_components/mercure-connection-lost-dialog'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type RealChatInterfaceV2Props = {
  initialMercureToken: string | null
  productId: number
  sellerId: number
}

export function RealChatInterfaceV2({
  initialMercureToken,
  productId,
  sellerId,
}: RealChatInterfaceV2Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const [roomId, setRoomId] = useState<number | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)

  // Get current authenticated user
  const { data: currentUser } = useCurrentUser()

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct, error: productError } = useProduct(productId)

  // Get current room and sidebar state from store
  const { setCurrentRoom, currentRoom, isProductDetailsOpen } = useChatStoreV2()

  // Fetch all rooms to get the current room details
  const { rooms } = useChatRoomsV2({ enabled: true })

  // Calculate current room from rooms list - memoized to avoid unnecessary re-renders
  const currentRoomData = useMemo(() => {
    if (!roomId) return null
    return rooms.find((room) => room.id === roomId) || null
  }, [roomId, rooms])

  // Create or find room on mount
  useEffect(() => {
    const initializeRoom = async () => {
      console.log('[RealChatInterfaceV2] 🔍 Initializing room...', {
        hasCurrentUser: !!currentUser,
        currentUserId: currentUser?.id,
        productId,
        sellerId,
      })

      if (!currentUser || !productId || !sellerId) {
        console.log('[RealChatInterfaceV2] ⏸️ Skipping - missing data')
        return
      }

      // Prevent self-chat (convert currentUser.id to number for comparison)
      const currentUserIdNum = parseInt(currentUser.id, 10)
      if (currentUserIdNum === sellerId) {
        console.log('[RealChatInterfaceV2] ❌ Self-chat prevented')
        setRoomError('Vous ne pouvez pas discuter avec vous-même.')
        return
      }

      setIsCreatingRoom(true)
      setRoomError(null)

      try {
        console.log(`[RealChatInterfaceV2] 📞 Calling createProductChatClient(${productId}, ${sellerId})...`)
        const response = await createProductChatClient(productId, sellerId)

        console.log('[RealChatInterfaceV2] 📥 API Response:', {
          hasData: !!response.data,
          hasError: !!response.error,
          status: response.status,
          data: response.data,
          error: response.error,
        })

        if (response.data) {
          console.log(`[RealChatInterfaceV2] ✅ Room created/found: ${response.data.id}`)
          setRoomId(response.data.id)
          setCurrentRoom(response.data.id, response.data)
          // Invalidate rooms list to refresh
          queryClient.invalidateQueries({ queryKey: ['chatRoomsV2'] })
        } else if (response.error) {
          // Enhanced error handling with specific messages based on status code
          const status = response.error.status
          let errorMsg = response.error.message

          // Provide user-friendly messages for common errors
          if (status === 401) {
            errorMsg = 'Votre session a expiré. Veuillez vous reconnecter.'
          } else if (status === 403) {
            errorMsg = 'Vous n\'avez pas l\'autorisation d\'accéder à cette conversation.'
          } else if (status === 404) {
            errorMsg = 'Produit introuvable. Il a peut-être été supprimé.'
          } else if (status === 400) {
            errorMsg = 'Requête invalide. Veuillez réessayer.'
          } else if (status >= 500) {
            errorMsg = 'Erreur du serveur. Veuillez réessayer plus tard.'
          }

          console.error('[RealChatInterfaceV2] ❌ API Error:', {
            status,
            message: errorMsg,
            details: response.error.details,
          })

          setRoomError(errorMsg)
        } else {
          setRoomError('Impossible de créer la conversation. Veuillez réessayer.')
        }
      } catch (error) {
        console.error('[RealChatInterfaceV2] ❌ Exception:', error)
        setRoomError('Erreur réseau. Vérifiez votre connexion et réessayez.')
      } finally {
        setIsCreatingRoom(false)
      }
    }

    initializeRoom()
  }, [currentUser, productId, sellerId, setCurrentRoom, queryClient])

  // Fetch messages for current room with Mercure real-time updates
  const {
    messages,
    isLoading: isLoadingMessages,
    error: messagesError,
    connected,
    addOptimisticMessage,
    updateOptimisticMessageStatus,
    removeOptimisticMessage,
  } = useChatMessagesV2({
    roomId: roomId || 0,
    mercureToken: initialMercureToken,
    enabled: roomId !== null && roomId > 0,
  })

  // Monitor Mercure connection and show dialog if connection lost
  const { showDialog, handleContinue, handleQuit } = useMercureConnectionMonitor({
    error: messagesError,
  })

  // Force refetch when room changes
  useEffect(() => {
    if (roomId && roomId > 0) {
      queryClient.invalidateQueries({ queryKey: ['messagesV2', roomId] })
    }
  }, [roomId, queryClient])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  /**
   * Callback after message sent
   * With optimistic updates, we don't need to invalidate cache anymore
   */
  const handleMessageSent = () => {
    // No need to invalidate cache - Mercure handles real-time updates
  }

  // Show loading state while creating room or loading product
  if (isCreatingRoom || isLoadingProduct) {
    return (
      <SidebarProvider>
        <AppSidebarV2 product={product || null} />
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
        <AppSidebarV2 product={product || null} />
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
                  <p>Product ID: {productId}</p>
                  <p>Seller ID: {sellerId}</p>
                  <p>Current User: {currentUser ? `${currentUser.id} (${currentUser.email})` : 'Not loaded'}</p>
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
      <AppSidebarV2 product={product || null} />

      <SidebarInset>
        <div className="flex h-full flex-col">
          {/* Header with product info and Mercure connection status */}
          <ChatHeaderV2
            currentRoom={currentRoomData}
            product={product || null}
            connected={connected}
          />

          {/* Messages display */}
          {roomId !== null && roomId > 0 ? (
            <>
              <ChatMessagesV2
                messages={messages}
                isLoading={isLoadingMessages}
                currentUserId={currentUser?.id || null}
                messagesEndRef={messagesEndRef}
              />

              {/* Input for sending messages */}
              <ChatInputV2
                roomId={roomId}
                onMessageSent={handleMessageSent}
                addOptimisticMessage={addOptimisticMessage}
                updateOptimisticMessageStatus={updateOptimisticMessageStatus}
                removeOptimisticMessage={removeOptimisticMessage}
                currentUser={currentUser}
                disabled={!connected || isLoadingMessages}
              />
            </>
          ) : (
            <div className="flex h-full flex-1 items-center justify-center bg-background">
              <div className="text-center">
                <h2 className="text-2xl font-medium text-muted-foreground">
                  Chargement de la conversation...
                </h2>
              </div>
            </div>
          )}
        </div>
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
