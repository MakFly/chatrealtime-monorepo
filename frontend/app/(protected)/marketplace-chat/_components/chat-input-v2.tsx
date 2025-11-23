/**
 * Chat Input V2 Component
 * Handles message input and sending for product-based conversations
 */

'use client'

import type React from 'react'
import { useState, useRef } from 'react'
import { ArrowUp, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { sendMessageV2Client, createProductChatClient } from '@/lib/features/chat-v2/api/product-chat-client'
import type { ChatRoomV2 } from '@/lib/features/marketplace-chat'

type ChatInputV2Props = {
  roomId: number | null
  productId?: number | null // For creating room on first message
  sellerId?: number | null // For creating room on first message
  onRoomCreated?: (room: ChatRoomV2) => void // Callback when room is created
  onMessageSent?: () => void
  addOptimisticMessage?: (message: {
    id: number
    content: string
    author: {
      id: string
      email: string
      name: string | null
    }
    createdAt: string
  }) => void
  updateOptimisticMessageStatus?: (messageId: number, status: 'sent' | 'delivered') => void
  removeOptimisticMessage?: (messageId: number) => void
  currentUser?: {
    id: string
    email: string
    name: string | null
  } | null
  disabled?: boolean
}

export function ChatInputV2({
  roomId,
  productId,
  sellerId,
  onRoomCreated,
  onMessageSent,
  addOptimisticMessage,
  updateOptimisticMessageStatus,
  removeOptimisticMessage,
  currentUser,
  disabled = false,
}: ChatInputV2Props) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!input.trim()) return
    if (disabled || isSending) return

    const content = input.trim()
    setInput('')
    setError(null)
    setIsSending(true)

    // Generate temporary ID for optimistic message (with random to prevent collisions)
    // IMPORTANT: Must be declared BEFORE try-catch to use in error handler
    const optimisticId = -Date.now() - Math.floor(Math.random() * 1000)

    try {
      // ✅ NEW WORKFLOW: Create room on first message if it doesn't exist
      let effectiveRoomId = roomId

      if (!effectiveRoomId && productId && sellerId) {
        console.log('[ChatInputV2] 📦 Creating room for product:', productId, 'seller:', sellerId)

        const roomResponse = await createProductChatClient(productId, sellerId)

        if (!roomResponse.data) {
          throw new Error('Impossible de créer la conversation')
        }

        effectiveRoomId = roomResponse.data.id
        console.log('[ChatInputV2] ✅ Room created:', effectiveRoomId)

        // Notify parent component that room was created
        if (onRoomCreated) {
          onRoomCreated(roomResponse.data)
        }
      }

      // Ensure we have a room ID before sending
      if (!effectiveRoomId) {
        throw new Error('Aucune conversation sélectionnée')
      }

      // Add optimistic message IMMEDIATELY (before fetch)
      if (addOptimisticMessage && currentUser) {
        addOptimisticMessage({
          id: optimisticId,
          content,
          author: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
          },
          createdAt: new Date().toISOString(),
        })
      }

      // Send message via V2 API
      const response = await sendMessageV2Client({
        content,
        chatRoom: `/api/v2/chat_rooms/${effectiveRoomId}`, // IRI format for API Platform
      })

      if (!response.data) {
        throw new Error('Erreur lors de l\'envoi du message')
      }

      // Update status to 'sent' (message accepted by server)
      if (updateOptimisticMessageStatus) {
        updateOptimisticMessageStatus(optimisticId, 'sent')
      }

      // Success - call callback
      onMessageSent?.()

      // Focus back on textarea
      textareaRef.current?.focus()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de l\'envoi du message'
      )

      // Remove optimistic message on error (use captured ID from above)
      if (removeOptimisticMessage) {
        removeOptimisticMessage(optimisticId)
      }

      // Restore input on error
      setInput(content)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const charCount = input.length
  const isInputEmpty = !input.trim()
  // ✅ Allow sending even without roomId if we have productId and sellerId (will create room on send)
  const isDisabled = disabled || isSending || (!roomId && (!productId || !sellerId))

  return (
    <div className="border-t bg-background">
      <div className="mx-auto max-w-4xl px-2 md:px-4 py-3 md:py-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="relative rounded-2xl border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring transition-all">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !roomId && (!productId || !sellerId)
                  ? 'Sélectionnez une conversation...'
                  : 'Écrire un message au vendeur...'
              }
              disabled={isDisabled}
              className="min-h-[60px] md:min-h-[80px] max-h-[200px] resize-none border-0 bg-transparent px-3 md:px-4 pt-3 md:pt-3.5 pb-12 md:pb-14 text-sm focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
            />

            {/* Bottom Bar */}
            <div className="absolute bottom-2 md:bottom-3 left-3 md:left-4 right-3 md:right-4 flex items-center justify-between">
              {/* Character Count */}
              <div className="text-xs text-muted-foreground">
                {charCount > 0 && (
                  <span className={cn(charCount > 500 && 'text-destructive')}>
                    {charCount}
                  </span>
                )}
              </div>

              {/* Send Button */}
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full"
                disabled={isDisabled || isInputEmpty}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
                <span className="sr-only">Envoyer le message</span>
              </Button>
            </div>
          </div>

          {/* Helper Text */}
          {!roomId && (!productId || !sellerId) && (
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Sélectionnez une conversation pour commencer à discuter
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
