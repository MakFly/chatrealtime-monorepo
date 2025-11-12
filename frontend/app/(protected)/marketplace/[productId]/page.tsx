'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useProduct } from '@/lib/hooks/use-products'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { ProductDetails } from '../_components/product-details'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>
}) {
  const router = useRouter()
  const { productId } = use(params)
  const productIdNum = parseInt(productId, 10)
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser()
  const { data: product, isLoading: isLoadingProduct, error } = useProduct(productIdNum)

  const handleContactClick = () => {
    if (product?.seller) {
      router.push(`/chat-v2?productId=${productIdNum}&userId=${product.seller.id}`)
    }
  }

  // Wait for both user and product to load to avoid button flash
  if (isLoadingProduct || isLoadingUser) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du produit. Il est peut-être introuvable.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/marketplace">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la marketplace
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOwnProduct = currentUser?.id === product.seller?.id

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/marketplace">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la marketplace
        </Link>
      </Button>

      {isOwnProduct && (
        <Alert className="mb-6">
          <AlertDescription>
            Ceci est votre propre annonce. Vous ne pouvez pas vous contacter
            vous-même.
          </AlertDescription>
        </Alert>
      )}

      <ProductDetails
        product={product}
        onContactClick={handleContactClick}
        showContactButton={!isOwnProduct}
      />
    </div>
  )
}
