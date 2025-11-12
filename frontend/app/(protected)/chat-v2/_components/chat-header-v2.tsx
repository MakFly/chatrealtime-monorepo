/**
 * Chat Header V2 Component
 * Displays product-based chat room information and connection status
 * Includes toggle for product details sidebar
 */

'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Package, ChevronRight, ChevronLeft } from 'lucide-react'
import type { ChatRoomV2 } from '@/types/chat-v2'
import type { Product } from '@/types/product'
import { cn } from '@/lib/utils'
import { useChatStoreV2 } from '@/lib/stores/use-chat-store-v2'

type ChatHeaderV2Props = {
  currentRoom: ChatRoomV2 | null
  product: Product | null
  connected?: boolean
}

/**
 * Get room display name (product title)
 */
function getRoomDisplayName(room: ChatRoomV2, product: Product | null): string {
  return product?.title || room.productTitle || 'Produit'
}

/**
 * Get room initials for avatar
 */
function getRoomInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ChatHeaderV2({
  currentRoom,
  product,
  connected = true,
}: ChatHeaderV2Props) {
  const { isProductDetailsOpen, toggleProductDetails } = useChatStoreV2()

  // Empty state - no room selected (show product info if available)
  if (!currentRoom) {
    return (
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted">
              {product ? (
                getRoomInitials(product.title)
              ) : (
                <Package className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div>
            {product ? (
              <>
                <h2 className="text-sm font-semibold">
                  {product.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Nouvelle conversation
                </p>
              </>
            ) : (
              <h2 className="text-sm font-semibold text-muted-foreground">
                Chargement...
              </h2>
            )}
          </div>
        </div>
      </header>
    )
  }

  const displayName = getRoomDisplayName(currentRoom, product)
  const participantCount = currentRoom.participants?.length || 0

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      {/* Room Info with Product Context */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback>
            {product ? (
              getRoomInitials(product.title)
            ) : (
              <Package className="h-4 w-4" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold truncate">{displayName}</h2>
            <Badge variant="secondary" className="text-xs shrink-0">
              <Package className="h-3 w-3 mr-1" />
              Produit
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

            {/* Product Price */}
            {product && (
              <>
                <span>•</span>
                <span className="font-medium">
                  {product.price.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toggle Product Details Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={toggleProductDetails}
        title={
          isProductDetailsOpen
            ? 'Masquer les détails du produit'
            : 'Afficher les détails du produit'
        }
      >
        {isProductDetailsOpen ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        <span className="sr-only">
          {isProductDetailsOpen
            ? 'Masquer les détails du produit'
            : 'Afficher les détails du produit'}
        </span>
      </Button>
    </header>
  )
}
