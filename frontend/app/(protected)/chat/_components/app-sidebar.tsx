"use client"

import * as React from "react"
import { Search, Settings, MoreHorizontal, Plus, Loader2 } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useChatRooms } from "@/lib/hooks/use-chat-rooms"
import { useChatStore } from "@/lib/stores/use-chat-store"
import type { ChatRoom } from "@/types/chat"
import { CreateRoomDialog } from "./create-room-dialog"

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

function truncateMessage(message: string | undefined, maxLength = 40): string {
  if (!message) return "Aucun message"
  if (message.length <= maxLength) return message
  return message.slice(0, maxLength) + "..."
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}j`
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

function getRoomDisplayName(room: ChatRoom): string {
  return room.name
}

function getRoomLastMessage(room: ChatRoom): string {
  if (!room.messages || room.messages.length === 0) {
    return "Aucun message"
  }
  
  // Check if messages are IRI references (strings) or full objects
  const lastMessage = room.messages[room.messages.length - 1]
  
  // If it's a string (IRI), we can't get the content
  if (typeof lastMessage === 'string') {
    return "Message disponible"
  }
  
  // If it's an object, get the content
  return lastMessage.content || "Message sans contenu"
}

function getRoomInitials(room: ChatRoom): string {
  return room.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)

  // Fetch chat rooms
  const { rooms, isLoading, error } = useChatRooms({
    enabled: true,
  })

  // Debug: Log rooms
  React.useEffect(() => {
    console.log('[AppSidebar] 🏠 Rooms:', rooms)
    console.log('[AppSidebar] 🔢 Rooms count:', rooms?.length)
    console.log('[AppSidebar] ⏳ Is loading:', isLoading)
    console.log('[AppSidebar] ❌ Error:', error)
  }, [rooms, isLoading, error])

  // Global state
  const { currentRoomId, setCurrentRoom } = useChatStore()

  // Filter rooms based on search
  const filteredRooms = React.useMemo(() => {
    if (!rooms) return []
    console.log('[AppSidebar] 🔍 Filtering rooms:', rooms.length, 'with query:', searchQuery)
    const filtered = rooms.filter((room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    console.log('[AppSidebar] ✅ Filtered rooms:', filtered.length)
    return filtered
  }, [rooms, searchQuery])

  const handleRoomSelect = (room: ChatRoom) => {
    setCurrentRoom(room.id, room)
  }

  const handleCreateRoom = () => {
    setIsCreateDialogOpen(true)
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">Chat</span>
                <span className="text-xs text-muted-foreground">En ligne</span>
              </div>
              <SidebarMenuButton size="sm" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between px-4 mb-2">
            <SidebarGroupLabel className="text-xs font-semibold p-0">
              Messages
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCreateRoom}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <SidebarGroupContent>
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Erreur lors du chargement des conversations
                </p>
              </div>
            )}

            {!isLoading && !error && filteredRooms.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Aucune conversation trouvée" : "Aucune conversation"}
                </p>
              </div>
            )}

            {!isLoading && !error && filteredRooms.length > 0 && (
              <SidebarMenu>
                {filteredRooms.map((room) => (
                  <SidebarMenuItem key={room.id}>
                    <SidebarMenuButton
                      onClick={() => handleRoomSelect(room)}
                      className={cn(
                        "h-auto py-3 px-3 hover:bg-accent",
                        currentRoomId === room.id && "bg-accent"
                      )}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{getRoomInitials(room)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold truncate">
                              {getRoomDisplayName(room)}
                            </span>
                            {room.updatedAt && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatTime(room.updatedAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {truncateMessage(getRoomLastMessage(room))}
                            </p>
                            {room.type === "group" && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs shrink-0">
                                {room.participants?.length || 0}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      <CreateRoomDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Sidebar>
  )
}
