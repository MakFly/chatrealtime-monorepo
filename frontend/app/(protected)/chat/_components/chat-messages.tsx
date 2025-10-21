/**
 * Chat Messages Component
 * Displays real-time chat messages with author info and timestamps
 */

'use client'

import type React from 'react'
import type { Message } from '@/types/chat'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

type ChatMessagesProps = {
  messages: Message[]
  isLoading?: boolean
  currentUserId?: string | null
  messagesEndRef: React.RefObject<HTMLDivElement>
}

/**
 * Format timestamp to human-readable format
 * Example: "14:32" or "Hier 14:32" or "12/01 14:32"
 */
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (hours < 24) {
    return timeStr
  }

  if (days === 1) {
    return `Hier ${timeStr}`
  }

  if (days < 7) {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get initials from user name or email
 */
function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

/**
 * Loading skeleton for messages
 */
function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-in fade-in">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16 w-full max-w-md" />
      </div>
    </div>
  )
}

export function ChatMessages({
  messages,
  isLoading = false,
  currentUserId,
  messagesEndRef,
}: ChatMessagesProps) {
  // Empty state
  if (!isLoading && messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center px-4">
          <h1 className="mb-2 text-2xl md:text-3xl font-semibold">
            Bienvenue dans le chat
          </h1>
          <p className="text-sm text-muted-foreground">
            Commencez une conversation en envoyant un message
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-2 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6">
        {messages.map((message) => {
          // ✅ API now returns full User object with serialization groups
          const author = message.author
          
          // Convert IDs to strings for comparison (backend IDs are numbers, frontend currentUserId might be string)
          const isCurrentUser = currentUserId !== null && String(currentUserId) === String(author.id)
          const initials = getInitials(author.name, author.email)

          return (
            <div
              key={message.id}
              className={cn(
                'flex gap-2 md:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300',
                isCurrentUser ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              {/* Author Avatar */}
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback
                  className={cn(
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Message Content */}
              <div
                className={cn(
                  'flex-1 min-w-0 flex flex-col gap-1',
                  isCurrentUser ? 'items-end' : 'items-start'
                )}
              >
                {/* Author Name & Timestamp */}
                <div
                  className={cn(
                    'flex items-center gap-2 px-1',
                    isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <span className="text-xs font-medium text-foreground">
                    {author.name || author.email.split('@')[0]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(message.createdAt)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    'rounded-2xl px-3 md:px-4 py-2 md:py-2.5 max-w-[85%] md:max-w-[70%] wrap-break-word',
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
