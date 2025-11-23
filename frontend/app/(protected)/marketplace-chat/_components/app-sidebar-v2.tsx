/**
 * App Sidebar V2 Component
 * Sidebar with product details for product-based chat
 */

'use client'

import * as React from 'react'
import {
  Search,
  Settings,
  MoreHorizontal,
  Loader2,
  User as UserIcon,
  LogOut,
  ArrowLeft,
  Package,
  Store,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useChatRoomsV2 } from '@/lib/features/chat-v2/hooks/use-chat-rooms-v2'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useChatStoreV2 } from '@/lib/stores/use-chat-store-v2'
import type { ChatRoomV2 } from '@/lib/features/chat-v2'
import type { Product } from '@/types/product'
import { SettingsDialog } from '@/app/(protected)/chat/_components/settings-dialog'
import { logoutAction } from '@/lib/actions/auth'
import { ProductDetails } from '@/app/(protected)/marketplace/_components/product-details'
import { leaveChatRoomV2Client } from '@/lib/features/chat-v2/api/product-chat-client'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type AppSidebarV2Props = React.ComponentProps<typeof Sidebar> & {
  product: Product | null
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
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function getRoomInitials(productTitle: string): string {
  return productTitle
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getUserInitials(name: string | null | undefined, email: string): string {
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

export function AppSidebarV2({ product, ...props }: AppSidebarV2Props) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false)
  const [showInitialSkeleton, setShowInitialSkeleton] = React.useState(true)
  const [roomToDelete, setRoomToDelete] = React.useState<ChatRoomV2 | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch current user
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()

  // Get sidebar state from store
  const { isProductDetailsOpen, toggleProductDetails } = useChatStoreV2()

  // Fetch chat rooms V2
  const { rooms, isLoading, error } = useChatRoomsV2({
    enabled: true,
  })

  // Hide initial skeleton after first data load or after minimum display time
  React.useEffect(() => {
    // Always show skeleton for at least 500ms for better UX
    const minDisplayTimer = setTimeout(() => {
      setShowInitialSkeleton(false)
    }, 500)

    return () => clearTimeout(minDisplayTimer)
  }, [])

  // Also hide skeleton when data successfully loads
  React.useEffect(() => {
    if (!isLoading && rooms.length > 0) {
      setShowInitialSkeleton(false)
    }
  }, [isLoading, rooms.length])

  // Filter rooms
  const filteredRooms = React.useMemo(() => {
    if (!rooms) return []

    return rooms.filter((room: ChatRoomV2) =>
      room.productTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [rooms, searchQuery])

  const handleRoomSelect = (room: ChatRoomV2) => {
    // Navigate to room based on productId and sellerId
    // Find the other participant (not the current user)
    const currentUserId = currentUser ? parseInt(currentUser.id, 10) : 0

    const seller = room.participants?.find((p) => {
      // p.user can be either an IRI string ("/api/v1/users/2") or a User object
      let participantId: number

      if (typeof p.user === 'string') {
        // Extract ID from IRI: "/api/v1/users/2" -> 2
        const match = p.user.match(/\/(\d+)$/)
        participantId = match ? parseInt(match[1], 10) : 0
      } else {
        // User object with id property
        participantId = parseInt(p.user.id, 10)
      }

      return participantId !== currentUserId && participantId > 0
    })

    if (room.productId && seller) {
      // Extract userId from seller
      let userId: string
      if (typeof seller.user === 'string') {
        // Extract ID from IRI
        const match = seller.user.match(/\/(\d+)$/)
        userId = match ? match[1] : ''
      } else {
        userId = seller.user.id
      }

      if (userId) {
        router.push(`/marketplace-chat?productId=${room.productId}&userId=${userId}`)
      }
    }
  }

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return

    setIsDeleting(true)
    try {
      await leaveChatRoomV2Client(roomToDelete.id)

      // Invalidate rooms cache to refetch the list
      queryClient.invalidateQueries({ queryKey: ['chatRoomsV2'] })

      // Close dialog
      setRoomToDelete(null)

      // If we're currently viewing this room, redirect to marketplace
      router.push('/marketplace-chat')
    } catch (error) {
      console.error('Failed to delete room:', error)
      // TODO: Show error toast
    } finally {
      setIsDeleting(false)
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
                      <AvatarImage
                        src={currentUser.picture}
                        alt={currentUser.name || currentUser.email}
                      />
                    )}
                    <AvatarFallback>
                      {getUserInitials(currentUser.name, currentUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span
                      className="text-sm font-semibold truncate"
                      title={currentUser.name || currentUser.email}
                    >
                      {currentUser.name || currentUser.email}
                    </span>
                    <span
                      className="text-xs text-muted-foreground truncate"
                      title={currentUser.email}
                    >
                      {currentUser.name ? currentUser.email : 'En ligne'}
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

        {/* Back to Marketplace Button */}
        <div className="px-2 pb-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => router.push('/marketplace')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la marketplace
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Product Details Section (collapsible) */}
        {product && isProductDetailsOpen && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-4 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Détails du produit</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <ScrollArea className="h-[400px] px-2">
                <ProductDetails product={product} compact showContactButton={false} />
              </ScrollArea>
            </SidebarGroupContent>
            <Separator className="my-2" />
          </SidebarGroup>
        )}

        {/* Chat Rooms Section */}
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
              Mes Conversations Produits
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            {/* Priority 1: Show skeleton during initial load */}
            {showInitialSkeleton ? (
              <div className="px-3 space-y-3">
                {/* Show 3 skeleton items while loading */}
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* Priority 2: Show error if present after skeleton disappears */
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Erreur lors du chargement
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            ) : filteredRooms.length === 0 ? (
              /* Priority 3: Show empty state */
              <div className="px-4 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Aucune conversation trouvée'
                    : 'Aucune conversation pour ce produit'}
                </p>
              </div>
            ) : (
              /* Priority 4: Show rooms */
              <SidebarMenu>
                {filteredRooms.map((room) => (
                  <SidebarMenuItem key={room.id}>
                    <div className="group relative flex items-center">
                      <SidebarMenuButton
                        onClick={() => handleRoomSelect(room)}
                        className="h-auto py-3 px-3 hover:bg-accent flex-1"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <Package className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-semibold truncate">
                                {room.productTitle}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                {room.unreadCount > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="h-5 min-w-[20px] px-1.5 text-xs font-bold"
                                  >
                                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                                  </Badge>
                                )}
                                {room.updatedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatTime(room.updatedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                <Store className="h-3 w-3 mr-1" />
                                Produit
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setRoomToDelete(room)}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer la conversation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      <SettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
      />

      {/* Delete Room Confirmation Dialog */}
      <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la conversation de votre liste. L'autre utilisateur conservera la conversation de son côté.
              {roomToDelete && (
                <span className="block mt-2 font-semibold">
                  Conversation: {roomToDelete.productTitle}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRoom}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}
