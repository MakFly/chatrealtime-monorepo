/**
 * Real Chat Interface Component
 * Integrates real chat data from Symfony API with Mercure real-time updates
 */

'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useChatStore } from '@/lib/stores/use-chat-store'
import { useChatMessages } from '@/lib/features/chat-v1/hooks/use-chat-messages'
import { useChatRooms } from '@/lib/features/chat-v1/hooks/use-chat-rooms'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useMercureConnectionMonitor } from '@/lib/hooks/use-mercure-connection-monitor'
import { useUnreadNotifications } from '@/lib/features/chat-v1/hooks/use-unread-notifications'
import { joinChatRoomClient } from '@/lib/features/chat-v1/api/chat-client'
import { markChatRoomAsRead } from '@/lib/api/mark-read'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { AppSidebar } from './app-sidebar'
import { MercureConnectionLostDialog } from './mercure-connection-lost-dialog'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import type { User } from '@/types/auth'

// Backend grace window is 15s (ChatUnreadV1Repository); keep heartbeat comfortably below
const HEARTBEAT_INTERVAL_MS = 10000

type RealChatInterfaceProps = {
  initialMercureToken: string | null
  initialRoomId: number | null
  initialUser: User | null
}

export function RealChatInterface({ initialMercureToken, initialRoomId, initialUser }: RealChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()

  // ✅ Get roomId from URL search params for instant client-side navigation
  const urlRoomId = parseInt(searchParams.get('roomId') || '0', 10)
  const currentRoomId = urlRoomId > 0 ? urlRoomId : initialRoomId

  // Get current authenticated user (use initialUser from server as fallback)
  const { data: currentUser } = useCurrentUser()
  const effectiveUser = currentUser ?? initialUser

  // Get current room from store
  const { setCurrentRoom, currentRoom } = useChatStore()

  // Fetch all rooms to get the current room details
  // Pass Mercure token to avoid duplicate token fetch
  // Cache is hydrated by HydrationBoundary from server, so no fetch will happen
  const { rooms } = useChatRooms({
    enabled: true,
    mercureToken: initialMercureToken
  })

  // Calculate current room from rooms list - memoized to avoid unnecessary re-renders
  const currentRoomData = useMemo(() => {
    if (!currentRoomId) return null
    return rooms.find((room) => room.id === currentRoomId) || null
  }, [currentRoomId, rooms])

  // ✅ Sync URL param (currentRoomId) with store on mount/change
  // Only sync when currentRoomId changes, not when room data updates
  useEffect(() => {
    if (currentRoomId !== null && currentRoomId > 0) {
      setCurrentRoom(currentRoomId, null) // Don't store the object, just the ID
    } else {
      setCurrentRoom(null, null)
    }
  }, [currentRoomId, setCurrentRoom])

  // ✅ Auto-join public rooms when accessing them
  useEffect(() => {
    const autoJoinPublicRoom = async () => {
      // Wait for user to be loaded before attempting to join
      // This ensures the access_token cookie is available and valid
      if (!effectiveUser) {
        console.log('[RealChatInterface] Waiting for user to be loaded before joining room...')
        return
      }

      if (!currentRoomData || currentRoomData.type !== 'public') {
        return // Only auto-join public rooms
      }

      try {
        console.log(`[RealChatInterface] Auto-joining public room ${currentRoomData.id}...`)
        const response = await joinChatRoomClient(currentRoomData.id)

        if (response.data) {
          console.log(`[RealChatInterface] ✅ Joined room ${currentRoomData.id}, participants: ${response.data.participant_count}`)
          // Invalidate rooms list to refresh participant count
          // FIX: Use exact: false to match all chatRooms queries (with/without filters)
          queryClient.invalidateQueries({ queryKey: ['chatRooms'], exact: false })
        }
      } catch (error) {
        console.error('[RealChatInterface] Failed to auto-join public room:', error)
      }
    }

    autoJoinPublicRoom()
  }, [currentRoomData?.id, currentRoomData?.type, effectiveUser, queryClient])

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
    roomId: currentRoomId || 0,
    mercureToken: initialMercureToken,
    enabled: currentRoomId !== null && currentRoomId > 0,
  })

  // Monitor Mercure connection and show dialog if connection lost
  const {
    showDialog,
    handleContinue,
    handleQuit,
  } = useMercureConnectionMonitor({ error })

  // ✅ Listen to unread count updates and show toast notifications
  useUnreadNotifications({
    currentRoomId,
    enabled: true,
  })

  // ✅ Mark room as read when opening it + heartbeat every 10 seconds
  // This ensures the backend knows the user is actively viewing the room
  // and prevents false unread count increments
  useEffect(() => {
    if (!currentRoomId || currentRoomId <= 0) {
      return
    }

    // Mark as read immediately when opening
    markChatRoomAsRead(currentRoomId).catch((error) => {
      console.error('[RealChatInterface] Failed to mark room as read:', error)
    })

    // Set up heartbeat to mark as read every 10 seconds while user is in the room
    const heartbeatInterval = setInterval(() => {
      console.log(`[RealChatInterface] 💓 Heartbeat: marking room ${currentRoomId} as read`)
      markChatRoomAsRead(currentRoomId).catch((error) => {
        console.error('[RealChatInterface] Failed to mark room as read (heartbeat):', error)
      })
    }, HEARTBEAT_INTERVAL_MS) // Must stay < backend grace window (15s)

    // Cleanup: clear interval when leaving the room or unmounting
    return () => {
      clearInterval(heartbeatInterval)
      console.log(`[RealChatInterface] 🛑 Stopped heartbeat for room ${currentRoomId}`)
    }
  }, [currentRoomId])

  // Force refetch when room changes
  // React Query doesn't always refetch when a query goes from disabled to enabled
  useEffect(() => {
    if (currentRoomId && currentRoomId > 0) {
      // Invalidate the query to force fresh data
      // FIX: Use exact: false to match partial queryKey (with pagination)
      queryClient.invalidateQueries({
        queryKey: ['messages', currentRoomId],
        exact: false,
      })
    }
  }, [currentRoomId, queryClient])

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
      <AppSidebar rooms={rooms} />

      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        {/* Header with room info and Mercure connection status - Fixed at top */}
        <div className="shrink-0">
          <ChatHeader
            currentRoom={currentRoomData}
            connected={connected}
          />
        </div>

        {/* Messages display or empty state - Scrollable middle section */}
        {currentRoomId !== null && currentRoomId > 0 ? (
          <>
            <div className="flex-1 min-h-0">
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                currentUserId={effectiveUser?.id || null}
                messagesEndRef={messagesEndRef}
              />
            </div>

            {/* Input for sending messages - Fixed at bottom */}
            <div className="shrink-0">
              <ChatInput
                roomId={currentRoomId}
                onMessageSent={handleMessageSent}
                addOptimisticMessage={addOptimisticMessage}
                updateOptimisticMessageStatus={updateOptimisticMessageStatus}
                removeOptimisticMessage={removeOptimisticMessage}
                currentUser={effectiveUser}
                disabled={!connected || isLoading}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-background">
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
