/**
 * Real Chat Interface Component
 * Integrates real chat data from Symfony API with Mercure real-time updates
 */

'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatStore } from '@/lib/stores/use-chat-store'
import { useChatMessages } from '@/lib/hooks/use-chat-messages'
import { useChatRooms } from '@/lib/hooks/use-chat-rooms'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useMercureConnectionMonitor } from '@/lib/hooks/use-mercure-connection-monitor'
import { joinChatRoomClient } from '@/lib/api/chat-client'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { AppSidebar } from './app-sidebar'
import { MercureConnectionLostDialog } from './mercure-connection-lost-dialog'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

type RealChatInterfaceProps = {
  initialMercureToken: string | null
  initialRoomId: number | null
}

export function RealChatInterface({ initialMercureToken, initialRoomId }: RealChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Get current authenticated user
  const { data: currentUser } = useCurrentUser()

  // Get current room from store
  const { setCurrentRoom, currentRoom } = useChatStore()

  // Fetch all rooms to get the current room details
  const { rooms } = useChatRooms({ enabled: true })

  // Calculate current room from rooms list - memoized to avoid unnecessary re-renders
  const currentRoomData = useMemo(() => {
    if (!initialRoomId) return null
    return rooms.find((room) => room.id === initialRoomId) || null
  }, [initialRoomId, rooms])

  // ✅ Sync URL param (initialRoomId) with store on mount/change
  // Only sync when initialRoomId changes, not when room data updates
  useEffect(() => {
    if (initialRoomId !== null && initialRoomId > 0) {
      setCurrentRoom(initialRoomId, null) // Don't store the object, just the ID
    } else {
      setCurrentRoom(null, null)
    }
  }, [initialRoomId, setCurrentRoom])

  // ✅ Auto-join public rooms when accessing them
  useEffect(() => {
    const autoJoinPublicRoom = async () => {
      if (!currentRoomData || currentRoomData.type !== 'public') {
        return // Only auto-join public rooms
      }

      try {
        console.log(`[RealChatInterface] Auto-joining public room ${currentRoomData.id}...`)
        const response = await joinChatRoomClient(currentRoomData.id)

        if (response.data) {
          console.log(`[RealChatInterface] ✅ Joined room ${currentRoomData.id}, participants: ${response.data.participant_count}`)
          // Invalidate rooms list to refresh participant count
          queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
        }
      } catch (error) {
        console.error('[RealChatInterface] Failed to auto-join public room:', error)
      }
    }

    autoJoinPublicRoom()
  }, [currentRoomData?.id, currentRoomData?.type, queryClient])

  // Fetch messages for current room with Mercure real-time updates
  // TanStack Query handles enabled: false by not executing the query
  const {
    messages,
    isLoading,
    error,
    connected,
    addOptimisticMessage,
    updateOptimisticMessageStatus,
    removeOptimisticMessage,
  } = useChatMessages({
    roomId: initialRoomId || 0,
    mercureToken: initialMercureToken,
    enabled: initialRoomId !== null && initialRoomId > 0,
  })

  // Monitor Mercure connection and show dialog if connection lost
  const {
    showDialog,
    handleContinue,
    handleQuit,
  } = useMercureConnectionMonitor({ error })

  // Force refetch when room changes
  // React Query doesn't always refetch when a query goes from disabled to enabled
  useEffect(() => {
    if (initialRoomId && initialRoomId > 0) {
      // Invalidate the query to force fresh data
      queryClient.invalidateQueries({ queryKey: ['messages', initialRoomId] })
    }
  }, [initialRoomId, queryClient])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  /**
   * ✅ Callback after message sent
   * With optimistic updates, we don't need to invalidate cache anymore
   * The message appears immediately (optimistic) and Mercure will update it with the real message
   */
  const handleMessageSent = () => {
    // No need to invalidate cache - Mercure handles real-time updates
    // The optimistic message was already shown, and will be replaced by the real one via Mercure
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <div className="flex h-full flex-col">
          {/* Header with room info and Mercure connection status */}
          <ChatHeader
            currentRoom={currentRoomData}
            connected={connected}
          />

          {/* Messages display */}
          {initialRoomId !== null && initialRoomId > 0 ? (
            <>
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                currentUserId={currentUser?.id || null}
                messagesEndRef={messagesEndRef}
              />

              {/* Input for sending messages */}
              <ChatInput
                roomId={initialRoomId}
                onMessageSent={handleMessageSent}
                addOptimisticMessage={addOptimisticMessage}
                updateOptimisticMessageStatus={updateOptimisticMessageStatus}
                removeOptimisticMessage={removeOptimisticMessage}
                currentUser={currentUser}
                disabled={!connected || isLoading}
              />
            </>
          ) : (
            <div className="flex h-full flex-1 items-center justify-center bg-background">
              <div className="text-center">
                <h2 className="text-2xl font-medium text-muted-foreground">
                  Sélectionnez une conversation
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Choisissez une conversation dans la barre latérale pour commencer à discuter
                </p>
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
