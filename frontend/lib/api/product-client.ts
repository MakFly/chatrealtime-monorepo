/**
 * Product API client functions - CLIENT-SIDE ONLY
 * Use these in Client Components
 */

import type { Product, ProductCollection } from '@/types/product'

// Client-side imports ONLY (no server imports)
import { clientGetV2 } from './client-v2'

/**
 * API Endpoints for V2
 * Note: API_URL already includes /api, so endpoints should be /v2/...
 */
const ENDPOINTS = {
  PRODUCTS: '/v2/products',
} as const

/**
 * Get all products (client-side)
 */
export async function getProductsClient() {
  return clientGetV2<ProductCollection>(ENDPOINTS.PRODUCTS)
}

/**
 * Get a single product (client-side)
 */
export async function getProductClient(productId: number) {
  return clientGetV2<Product>(`${ENDPOINTS.PRODUCTS}/${productId}`)
}

/**
 * Get products by category (client-side)
 */
export async function getProductsByCategoryClient(category: string) {
  const params = new URLSearchParams()
  params.append('category', category)

  return clientGetV2<ProductCollection>(`${ENDPOINTS.PRODUCTS}?${params.toString()}`)
}

/**
 * Get products by seller (client-side)
 */
export async function getProductsBySellerClient(sellerId: number) {
  const params = new URLSearchParams()
  params.append('seller', sellerId.toString())

  return clientGetV2<ProductCollection>(`${ENDPOINTS.PRODUCTS}?${params.toString()}`)
}
