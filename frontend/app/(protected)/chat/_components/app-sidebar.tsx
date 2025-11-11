"use client"

import * as React from "react"
import { Search, Settings, MoreHorizontal, Plus, Loader2, User as UserIcon, LogOut, Trash2, Edit } from "lucide-react"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useChatRooms } from "@/lib/hooks/use-chat-rooms"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { useChatStore } from "@/lib/stores/use-chat-store"
import { isGlobalAdmin } from "@/lib/utils/roles"
import type { ChatRoom } from "@/types/chat"
import type { User } from "@/types/auth"
import { CreateRoomDialog } from "./create-room-dialog"
import { SettingsDialog } from "./settings-dialog"
import { DeleteRoomDialog } from "./delete-room-dialog"
import { logoutAction } from "@/lib/actions/auth"
import { deleteChatRoomClient } from "@/lib/api/chat-client"
import { useQueryClient } from "@tanstack/react-query"

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

function getUserInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  // Fallback to first 2 letters of email
  return email.slice(0, 2).toUpperCase()
}

/**
 * Check if current user can delete a room
 * - Public rooms: Only ROLE_ADMIN can delete
 * - Private/Group rooms: Room admin can delete
 */
function canDeleteRoom(room: ChatRoom, currentUser: User | null | undefined): boolean {
  if (!currentUser) return false

  // For public rooms, only global admins can delete
  if (room.type === 'public') {
    return isGlobalAdmin(currentUser)
  }

  // For private/group rooms, check if user is room admin
  const currentUserParticipant = room.participants?.find(
    (p) => p.user.id === currentUser.id
  )

  return currentUserParticipant?.role === 'admin'
}

export function AppSidebar({ ...props }: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false)
  const [roomToDelete, setRoomToDelete] = React.useState<ChatRoom | null>(null)

  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  // Fetch current user
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()

  // Fetch chat rooms
  const { rooms, isLoading, error } = useChatRooms({
    enabled: true,
  })

  // ✅ Extract currentRoomId from URL pathname
  const currentRoomId = React.useMemo(() => {
    const match = pathname.match(/\/chat\/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }, [pathname])

  // Filter and separate rooms by type
  const { myRooms, publicRooms } = React.useMemo(() => {
    if (!rooms) return { myRooms: [], publicRooms: [] }

    console.log('[AppSidebar] 🔍 Filtering rooms:', rooms.length, 'with query:', searchQuery)

    const filtered = rooms.filter((room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const my = filtered.filter((room) => room.type !== 'public')
    const pub = filtered.filter((room) => room.type === 'public')

    console.log('[AppSidebar] ✅ My rooms:', my.length, 'Public rooms:', pub.length)

    return {
      myRooms: my,
      publicRooms: pub
    }
  }, [rooms, searchQuery])

  const handleRoomSelect = (room: ChatRoom) => {
    // ✅ Navigate to room URL instead of using store
    router.push(`/chat/${room.id}`)
  }

  const handleCreateRoom = () => {
    setIsCreateDialogOpen(true)
  }

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return

    try {
      await deleteChatRoomClient(roomToDelete.id)

      // Invalidate chat rooms cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['chat-rooms'] })

      // If the deleted room was the current room, navigate to /chat
      if (currentRoomId === roomToDelete.id) {
        router.push('/chat')
      }

      console.log(`[AppSidebar] Room ${roomToDelete.id} deleted successfully`)
    } catch (error) {
      console.error('[AppSidebar] Error deleting room:', error)
      throw error
    }
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3">
              {isUserLoading ? (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate">Chargement...</span>
                    <span className="text-xs text-muted-foreground">---</span>
                  </div>
                </>
              ) : currentUser ? (
                <>
                  <Avatar className="h-10 w-10">
                    {currentUser.picture && (
                      <AvatarImage src={currentUser.picture} alt={currentUser.name || currentUser.email} />
                    )}
                    <AvatarFallback>
                      {getUserInitials(currentUser.name, currentUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate" title={currentUser.name || currentUser.email}>
                      {currentUser.name || currentUser.email}
                    </span>
                    <span className="text-xs text-muted-foreground truncate" title={currentUser.email}>
                      {currentUser.name ? currentUser.email : "En ligne"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>??</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate">Utilisateur</span>
                    <span className="text-xs text-muted-foreground">---</span>
                  </div>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="sm" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logoutAction()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

        {/* My Conversations Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 mb-2">
            <SidebarGroupLabel className="text-xs font-semibold p-0">
              Mes Conversations
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleCreateRoom}
              title="Créer une conversation"
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
                  Erreur lors du chargement
                </p>
              </div>
            )}

            {!isLoading && !error && myRooms.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Aucune conversation trouvée" : "Aucune conversation"}
                </p>
              </div>
            )}

            {!isLoading && !error && myRooms.length > 0 && (
              <SidebarMenu>
                {myRooms.map((room) => (
                  <SidebarMenuItem key={room.id}>
                    <div className="group relative">
                      <SidebarMenuButton
                        onClick={() => handleRoomSelect(room)}
                        className={cn(
                          "h-auto py-3 px-3 hover:bg-accent w-full",
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
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/chat/${room.id}/settings`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Paramètres du salon
                            </DropdownMenuItem>
                            {canDeleteRoom(room, currentUser) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setRoomToDelete(room)
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Public Rooms Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 mb-2">
            <SidebarGroupLabel className="text-xs font-semibold p-0">
              Salons Publics
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            {!isLoading && !error && publicRooms.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Aucun salon trouvé" : "Aucun salon public"}
                </p>
              </div>
            )}

            {!isLoading && !error && publicRooms.length > 0 && (
              <SidebarMenu>
                {publicRooms.map((room) => (
                  <SidebarMenuItem key={room.id}>
                    <div className="group relative">
                      <SidebarMenuButton
                        onClick={() => handleRoomSelect(room)}
                        className={cn(
                          "h-auto py-3 px-3 hover:bg-accent w-full",
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
                              <Badge variant="default" className="h-5 px-1.5 text-xs shrink-0">
                                Public
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </SidebarMenuButton>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/chat/${room.id}/settings`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Paramètres du salon
                            </DropdownMenuItem>
                            {canDeleteRoom(room, currentUser) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setRoomToDelete(room)
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
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
            <SidebarMenuButton onClick={() => setIsSettingsDialogOpen(true)}>
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

      <SettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />

      <DeleteRoomDialog
        room={roomToDelete}
        open={!!roomToDelete}
        onOpenChange={(open) => !open && setRoomToDelete(null)}
        onConfirm={handleDeleteRoom}
      />
    </Sidebar>
  )
}
