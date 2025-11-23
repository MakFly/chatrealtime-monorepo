/**
 * Message Badge Button for Navbar
 * Displays unread message count with real-time updates
 */

'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { useTotalUnreadCount } from '@/lib/features/chat-v2'
import { cn } from '@/lib/utils'

type MessageBadgeButtonProps = {
  className?: string
}

export function MessageBadgeButton({ className }: MessageBadgeButtonProps) {
  const [isMounted, setIsMounted] = useState(false)
  const { totalUnread, isLoading } = useTotalUnreadCount({ enabled: isMounted })

  // Prevent hydration mismatch by only rendering badge after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <Link
      href="/marketplace-chat"
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'icon' }),
        'relative h-11 w-11 rounded-full transition-all duration-300 hover:scale-110 hover:bg-primary/10 group',
        className
      )}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <MessageSquare className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />

      {/* Unread badge - only render after mount to prevent hydration mismatch */}
      {isMounted && !isLoading && totalUnread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-[10px] font-bold rounded-full ring-2 ring-background shadow-lg animate-in zoom-in-50 duration-300"
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </Badge>
      )}

      <span className="sr-only">Messages</span>
    </Link>
  )
}
