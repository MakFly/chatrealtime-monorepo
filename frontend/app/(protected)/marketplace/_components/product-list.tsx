'use client'

import { useRouter } from 'next/navigation'
import { useProducts } from '@/lib/hooks/use-products'
import { ProductCard } from './product-card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import type { Product } from '@/types/product'

export function ProductList() {
  const router = useRouter()
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser()
  const { data: products, isLoading: isLoadingProducts, error } = useProducts()

  const handleContactClick = (productId: number, sellerId: number) => {
    // Redirect to chat-v2 page with search params
    router.push(`/marketplace-chat?productId=${productId}&userId=${sellerId}`)
  }

  // Wait for both user and products to load to avoid button flash
  if (isLoadingProducts || isLoadingUser) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des produits. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    )
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucun produit disponible pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product: Product) => (
        <ProductCard
          key={product.id}
          product={product}
          onContactClick={handleContactClick}
          showContactButton={currentUser?.id !== product.seller?.id}
        />
      ))}
    </div>
  )
}
