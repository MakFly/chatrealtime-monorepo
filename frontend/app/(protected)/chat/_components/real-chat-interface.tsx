/**
 * Real Chat Interface Component
 * Integrates real chat data from Symfony API with Mercure real-time updates
 */

'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useChatStore } from '@/lib/stores/use-chat-store'
import { useChatMessages } from '@/lib/hooks/use-chat-messages'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useMercureConnectionMonitor } from '@/lib/hooks/use-mercure-connection-monitor'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'
import { AppSidebar } from './app-sidebar'
import { MercureConnectionLostDialog } from './mercure-connection-lost-dialog'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

type RealChatInterfaceProps = {
  initialMercureToken: string | null
}

export function RealChatInterface({ initialMercureToken }: RealChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Get current authenticated user
  const { data: currentUser } = useCurrentUser()

  // Get current room from store
  const { currentRoomId, currentRoom } = useChatStore()

  // Debug: Log room changes
  useEffect(() => {
    console.log('[ChatInterface] currentRoomId changed:', currentRoomId)
    console.log('[ChatInterface] Will fetch messages?', currentRoomId !== null && currentRoomId > 0)
  }, [currentRoomId])

  // Fetch messages for current room with Mercure real-time updates
  // TanStack Query handles enabled: false by not executing the query
  const {
    messages,
    isLoading,
    error,
    connected,
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

  // Force refetch when room changes
  // React Query doesn't always refetch when a query goes from disabled to enabled
  useEffect(() => {
    if (currentRoomId && currentRoomId > 0) {
      console.log('[ChatInterface] 🔄 Force refetch messages for room:', currentRoomId)
      // Invalidate the query to force fresh data
      queryClient.invalidateQueries({ queryKey: ['messages', currentRoomId] })
    }
  }, [currentRoomId, queryClient])

  // Debug: Log messages changes
  useEffect(() => {
    console.log('[ChatInterface] messages count:', messages.length, 'for room:', currentRoomId)
    console.log('[ChatInterface] isLoading:', isLoading, 'error:', error)
  }, [messages.length, currentRoomId, isLoading, error])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  /**
   * ✅ CRITICAL: Callback after message sent
   * Invalidates React Query cache to refetch messages
   */
  const handleMessageSent = () => {
    console.log('[ChatInterface] 📤 Message sent, invalidating cache for room:', currentRoomId)
    if (currentRoomId) {
      queryClient.invalidateQueries({ queryKey: ['messages', currentRoomId] })
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <div className="flex h-screen flex-col">
          {/* Header with room info and Mercure connection status */}
          <ChatHeader
            currentRoom={currentRoom}
            connected={connected}
          />

          {/* Messages display */}
          {currentRoom ? (
            <>
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                currentUserId={currentUser?.id || null}
                messagesEndRef={messagesEndRef}
              />

              {/* Input for sending messages */}
              <ChatInput
                roomId={currentRoomId}
                onMessageSent={handleMessageSent}
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
