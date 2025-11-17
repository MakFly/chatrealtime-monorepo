/**
 * Notifications Dialog Component
 * Displays a modal dialog with unread notifications when clicking the Bell icon
 */

'use client'

import React from 'react'
import { Bell, MessageSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotificationStore } from '@/lib/stores/notification-store'
import { useChatRooms } from '@/lib/hooks/chat-v1/use-chat-rooms'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ChatRoom } from '@/types/chat'

type NotificationsDialogProps = {
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

/**
 * Format time for notification preview
 */
function formatNotificationTime(dateString?: string): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days}j`
  
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  })
}

export function NotificationsDialog({ className }: NotificationsDialogProps) {
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

  // Fetch chat rooms to get room details
  const { data: chatRooms } = useChatRooms()
  const rooms = chatRooms?.member || []
  const initializeFromRooms = useNotificationStore((state) => state.initializeFromRooms)

  // Debug logging
  React.useEffect(() => {
    console.log('[NotificationsDialog] 🔔 Current notifications:', {
      count: notificationCount,
      notifications: allNotifications,
      roomsCount: rooms.length,
      roomIds: rooms.map((r) => r.id),
    })
  }, [notificationCount, allNotifications, rooms])

  // Initialize notifications from rooms when they're loaded
  React.useEffect(() => {
    if (rooms.length > 0) {
      console.log('[NotificationsDialog] 🔄 Initializing notifications from', rooms.length, 'rooms')
      initializeFromRooms(
        rooms.map((room) => ({
          id: room.id,
          unreadCount: room.unreadCount || 0,
          lastMessage: room.messages && room.messages.length > 0 
            ? { content: room.messages[room.messages.length - 1].content }
            : undefined,
        }))
      )
    }
  }, [rooms, initializeFromRooms])

  // Handle notification click - navigate to room and clear its notifications
  const handleNotificationClick = (roomId: number) => {
    router.push(`/chat?roomId=${roomId}`)
    clearNotifications(roomId)
    setOpen(false) // Close dialog after click
  }

  // Handle clear all
  const handleClearAll = () => {
    clearAllNotifications()
    setOpen(false) // Close dialog after clearing all
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative", className)}
        >
          <Bell className="h-4 w-4" />
          {mounted && notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm animate-in zoom-in-50 duration-200">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
          <span className="sr-only">
            {notificationCount} notification{notificationCount > 1 ? 's' : ''}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-semibold">
                Notifications
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {notificationCount > 0 
                  ? `${notificationCount} notification${notificationCount > 1 ? 's' : ''} non lue${notificationCount > 1 ? 's' : ''}`
                  : 'Aucune notification'
                }
              </DialogDescription>
            </div>
            {notificationCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={handleClearAll}
              >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Tout effacer
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Notifications List */}
        <ScrollArea className="max-h-[500px]">
          {notificationCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                Aucune notification
              </h3>
              <p className="text-xs text-muted-foreground max-w-[280px]">
                Vous serez notifié lorsque vous recevrez de nouveaux messages
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allNotifications.map(({ roomId, count, lastMessagePreview }) => {
                const room = rooms.find((r) => r.id === roomId)
                
                // Debug log
                console.log('[NotificationsDialog] 🔍 Rendering notification:', {
                  roomId,
                  count,
                  lastMessagePreview,
                  roomFound: !!room,
                  roomName: room?.name,
                  allRoomIds: rooms.map((r) => r.id),
                })

                // Fallback if room not found yet
                const roomName = room?.name || `Room #${roomId}`

                return (
                  <button
                    key={roomId}
                    onClick={() => handleNotificationClick(roomId)}
                    className={cn(
                      "w-full flex items-start gap-3 px-5 py-4",
                      "hover:bg-accent/50 active:bg-accent",
                      "transition-colors duration-150",
                      "text-left group",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 ring-2 ring-background group-hover:ring-primary/20 transition-all">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                          {room ? getRoomInitials(room) : roomId.toString().slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      {count > 0 && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive border-2 border-background flex items-center justify-center">
                          <span className="text-[9px] font-bold text-destructive-foreground">
                            {count > 9 ? '9+' : count}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {roomName}
                          </h4>
                          {lastMessagePreview && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                              {lastMessagePreview}
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant="destructive" 
                          className="shrink-0 h-5 min-w-[20px] px-1.5 text-[10px] font-bold shadow-sm"
                        >
                          {count > 99 ? '99+' : count}
                        </Badge>
                      </div>
                      
                      {!lastMessagePreview && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3 shrink-0" />
                          <span>
                            {count} nouveau{count > 1 ? 'x' : ''} message{count > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

