/**
 * Unread Notification Bell Component
 * Displays notification count aligned with toast notifications
 */

'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotificationCount } from '@/lib/hooks/chat-v1/use-notification-count'
import Link from 'next/link'

export function UnreadNotificationBell() {
  const notificationCount = useNotificationCount()

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="relative"
    >
      <Link href="/chat">
        <Bell className="h-4 w-4" />
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {notificationCount > 99 ? '99+' : notificationCount}
          </span>
        )}
        <span className="sr-only">
          {notificationCount} notification{notificationCount > 1 ? 's' : ''}
        </span>
      </Link>
    </Button>
  )
}
