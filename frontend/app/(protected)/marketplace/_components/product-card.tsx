'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Calendar } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/types/product'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

type ProductCardProps = {
  product: Product
  onContactClick?: (productId: number, sellerId: number) => void
  showContactButton?: boolean
  compact?: boolean
}

export function ProductCard({
  product,
  onContactClick,
  showContactButton = true,
  compact = false,
}: ProductCardProps) {


  const handleContact = (e: React.MouseEvent) => {
    console.log('handleContact', product.id, product.seller?.id)
    e.preventDefault()
    e.stopPropagation() // Empêche la propagation vers le Link parent
    if (onContactClick && product.seller) {
      onContactClick(product.id, product.seller.id)
    }
  }

  const CardWrapper = ({ children }: { children: React.ReactNode }) =>
    compact ? (
      <div className="cursor-pointer hover:shadow-lg transition-shadow">
        {children}
      </div>
    ) : (
      <Link href={`/marketplace/${product.id}`} className="block">
        {children}
      </Link>
    )

  return (
    <CardWrapper>
      <Card className="overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Pas d&apos;image
            </div>
          )}
          <Badge className="absolute top-2 right-2">{product.condition}</Badge>
        </div>

        {/* Content */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2">
              {product.title}
            </h3>
            <div className="text-xl font-bold text-primary shrink-0">
              {product.price.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3 flex-1">
          {!compact && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{product.location}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(product.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
          </div>
        </CardContent>

        {showContactButton && (
          <CardFooter className="pt-0">
            <Button onClick={handleContact} className="w-full cursor-pointer">
              Contacter le vendeur
            </Button>
          </CardFooter>
        )}
      </Card>
    </CardWrapper>
  )
}
