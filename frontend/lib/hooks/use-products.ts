'use client'

/**
 * TanStack Query hooks for products
 */

import { useQuery } from '@tanstack/react-query'
import {
  getProductsClient,
  getProductClient,
  getProductsByCategoryClient,
  getProductsBySellerClient,
} from '@/lib/api/product-client'
import type { Product, ProductCategory } from '@/types/product'

/**
 * Query keys for products
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: { category?: ProductCategory; sellerId?: number }) =>
    [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
}

/**
 * Hook to fetch all products
 */
export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: async () => {
      const response = await getProductsClient()

      // Handle error response
      if (!response.data) {
        throw new Error(response.error?.message || 'Failed to fetch products')
      }

      // Handle both hydra:member and member formats
      const data = response.data as any
      return ('hydra:member' in data ? data['hydra:member'] : data.member) || []
    },
  })
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(category: ProductCategory) {
  return useQuery({
    queryKey: productKeys.list({ category }),
    queryFn: async () => {
      const response = await getProductsByCategoryClient(category)

      if (!response.data) {
        throw new Error(response.error?.message || 'Failed to fetch products')
      }

      const data = response.data as any
      return ('hydra:member' in data ? data['hydra:member'] : data.member) || []
    },
  })
}

/**
 * Hook to fetch products by seller
 */
export function useProductsBySeller(sellerId: number) {
  return useQuery({
    queryKey: productKeys.list({ sellerId }),
    queryFn: async () => {
      const response = await getProductsBySellerClient(sellerId)

      if (!response.data) {
        throw new Error(response.error?.message || 'Failed to fetch products')
      }

      const data = response.data as any
      return ('hydra:member' in data ? data['hydra:member'] : data.member) || []
    },
    enabled: !!sellerId, // Only fetch if sellerId is provided
  })
}

/**
 * Hook to fetch a single product
 */
export function useProduct(productId: number) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: async () => {
      const response = await getProductClient(productId)

      if (!response.data) {
        throw new Error(response.error?.message || 'Failed to fetch product')
      }

      return response.data
    },
    enabled: !!productId, // Only fetch if productId is provided
  })
}
