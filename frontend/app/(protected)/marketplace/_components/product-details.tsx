'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Calendar, Package, User } from 'lucide-react'
import Image from 'next/image'
import type { Product } from '@/types/product'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

type ProductDetailsProps = {
  product: Product
  onContactClick?: () => void
  showContactButton?: boolean
  compact?: boolean
}

export function ProductDetails({
  product,
  onContactClick,
  showContactButton = true,
  compact = false,
}: ProductDetailsProps) {
  return (
    <div className={compact ? '' : 'space-y-6'}>
      {/* Images Gallery */}
      {!compact && product.images && product.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.images.map((image, index) => (
            <div
              key={index}
              className="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden"
            >
              <Image
                src={image}
                alt={`${product.title} - Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Product Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{product.title}</CardTitle>
              <Badge variant="secondary" className="w-fit">
                {product.category}
              </Badge>
            </div>
            <div className="text-3xl font-bold text-primary">
              {product.price.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">État</p>
                <p className="text-sm text-muted-foreground">
                  {product.condition}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Localisation</p>
                <p className="text-sm text-muted-foreground">
                  {product.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Publié</p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(product.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </div>

            {product.seller && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Vendeur</p>
                  <p className="text-sm text-muted-foreground">
                    {product.seller.username || product.seller.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          {showContactButton && onContactClick && (
            <>
              <Separator />
              <Button onClick={onContactClick} size="lg" className="w-full">
                Contacter le vendeur
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
