import { ProductList } from './_components/product-list'

export default function MarketplacePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez tous les produits disponibles
        </p>
      </div>

      <ProductList />
    </div>
  )
}
