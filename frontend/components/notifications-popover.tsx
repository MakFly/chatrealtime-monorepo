/**
 * Notifications Popover Component
 * Displays a list of unread notifications when clicking the Bell icon
 */

'use client'

import React from 'react'
import { Bell, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useChatRooms } from '@/lib/hooks/chat-v1/use-chat-rooms'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { ChatRoom } from '@/types/chat'

type NotificationsPopoverProps = {
  className?: string
}

/**
 * Get room initials for avatar
 */
function getRoomInitials(room: ChatRoom): string {
  return room.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function NotificationsPopover({ className }: NotificationsPopoverProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const notificationCount = useNotificationStore((state) => state.getTotalCount())
  const notificationsMap = useNotificationStore((state) => state.notifications)
  const clearNotifications = useNotificationStore((state) => state.clearNotifications)
  const clearAllNotifications = useNotificationStore((state) => state.clearAllNotifications)

  // Prevent hydration mismatch by only showing notifications after mount
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Convert Map to array - this is stable because we're using the Map reference from zustand
  const allNotifications = Array.from(notificationsMap.entries()).map(([roomId, data]) => ({
    roomId,
    count: data.count,
    lastMessagePreview: data.lastMessagePreview,
  }))

  // Debug logging
  React.useEffect(() => {
    console.log('[NotificationsPopover] 🔔 Current notifications:', {
      count: notificationCount,
      notifications: allNotifications,
    })
  }, [notificationCount, allNotifications])

  // Fetch chat rooms to get room details
  const { data: chatRooms } = useChatRooms()
  const rooms = chatRooms?.member || []

  // Handle notification click - navigate to room and clear its notifications
  const handleNotificationClick = (roomId: number) => {
    router.push(`/chat?room=${roomId}`)
    clearNotifications(roomId)
    setOpen(false) // Close popover after click
  }

  // Handle clear all
  const handleClearAll = () => {
    clearAllNotifications()
    setOpen(false) // Close popover after clearing all
  }

  // Don't render notification badge during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className={className}>
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
          <span className="sr-only">
            {notificationCount} notification{notificationCount > 1 ? 's' : ''}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {notificationCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleClearAll}
            >
              Tout effacer
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {notificationCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {allNotifications.map(({ roomId, count, lastMessagePreview }) => {
                const room = rooms.find((r) => r.id === roomId)
                if (!room) return null

                return (
                  <button
                    key={roomId}
                    onClick={() => handleNotificationClick(roomId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback>{getRoomInitials(room)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold truncate">{room.name}</span>
                        <Badge variant="destructive" className="shrink-0 h-5 min-w-5 px-1.5">
                          {count}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lastMessagePreview ? (
                          <p className="truncate">{lastMessagePreview}</p>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <MessageSquare className="h-3 w-3" />
                            <span>
                              {count} nouveau{count > 1 ? 'x' : ''} message{count > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
