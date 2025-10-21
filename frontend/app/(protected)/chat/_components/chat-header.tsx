/**
 * Chat Header Component
 * Displays current chat room information and connection status
 */

'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Users, Settings, LogOut } from 'lucide-react'
import type { ChatRoom } from '@/types/chat'
import { cn } from '@/lib/utils'

type ChatHeaderProps = {
  currentRoom: ChatRoom | null
  connected?: boolean
  onOpenSettings?: () => void
  onLeaveRoom?: () => void
}

/**
 * Get room display name based on type
 */
function getRoomDisplayName(room: ChatRoom): string {
  return room.name
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
 * Get room type badge variant
 */
function getRoomTypeBadgeVariant(type: ChatRoom['type']): 'default' | 'secondary' | 'outline' {
  switch (type) {
    case 'direct':
      return 'default'
    case 'group':
      return 'secondary'
    case 'public':
      return 'outline'
    default:
      return 'secondary'
  }
}

export function ChatHeader({
  currentRoom,
  connected = true,
  onOpenSettings,
  onLeaveRoom,
}: ChatHeaderProps) {
  // Empty state - no room selected
  if (!currentRoom) {
    return (
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted">?</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground">
              Aucune conversation sélectionnée
            </h2>
          </div>
        </div>
      </header>
    )
  }

  const participantCount = currentRoom.participants?.length || 0

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      {/* Room Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>{getRoomInitials(currentRoom)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold truncate">
              {getRoomDisplayName(currentRoom)}
            </h2>
            <Badge variant={getRoomTypeBadgeVariant(currentRoom.type)} className="text-xs shrink-0">
              {currentRoom.type === 'direct' && 'Direct'}
              {currentRoom.type === 'group' && 'Groupe'}
              {currentRoom.type === 'public' && 'Public'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {/* Connection Status */}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  connected ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
              <span>{connected ? 'En ligne' : 'Hors ligne'}</span>
            </div>

            {/* Participant Count */}
            {currentRoom.type !== 'direct' && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>
                    {participantCount} participant{participantCount > 1 ? 's' : ''}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Options de la conversation</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onOpenSettings && (
            <DropdownMenuItem onClick={onOpenSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
          )}
          {currentRoom.type !== 'direct' && onLeaveRoom && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLeaveRoom} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Quitter la conversation
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
