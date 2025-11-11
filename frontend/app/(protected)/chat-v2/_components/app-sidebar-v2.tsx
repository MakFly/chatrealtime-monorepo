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
import { cn } from '@/lib/utils'
import { useChatRoomsV2 } from '@/lib/hooks/use-chat-rooms-v2'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { useChatStoreV2 } from '@/lib/stores/use-chat-store-v2'
import type { ChatRoomV2 } from '@/types/chat-v2'
import type { Product } from '@/types/product'
import { SettingsDialog } from '@/app/(protected)/chat/_components/settings-dialog'
import { logoutAction } from '@/lib/actions/auth'
import { ProductDetails } from '@/app/(protected)/marketplace/_components/product-details'

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

  const router = useRouter()

  // Fetch current user
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()

  // Get sidebar state from store
  const { isProductDetailsOpen, toggleProductDetails } = useChatStoreV2()

  // Fetch chat rooms V2
  const { rooms, isLoading, error } = useChatRoomsV2({
    enabled: true,
  })

  // Filter rooms
  const filteredRooms = React.useMemo(() => {
    if (!rooms) return []

    return rooms.filter((room) =>
      room.productTitle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [rooms, searchQuery])

  const handleRoomSelect = (room: ChatRoomV2) => {
    if (!product) return
    // Navigate to room based on product and seller
    const seller = room.participants?.find((p) => p.role === 'member')
    if (seller) {
      router.push(`/chat-v2/${product.id}/${seller.user.id}`)
    }
  }

  return (
    <Sidebar {...props} collapsible="none">
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

            {!isLoading && !error && filteredRooms.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Aucune conversation trouvée'
                    : 'Aucune conversation pour ce produit'}
                </p>
              </div>
            )}

            {!isLoading && !error && filteredRooms.length > 0 && (
              <SidebarMenu>
                {filteredRooms.map((room) => (
                  <SidebarMenuItem key={room.id}>
                    <SidebarMenuButton
                      onClick={() => handleRoomSelect(room)}
                      className="h-auto py-3 px-3 hover:bg-accent w-full"
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
                            {room.updatedAt && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatTime(room.updatedAt)}
                              </span>
                            )}
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
    </Sidebar>
  )
}
