/**
 * Hook to fetch Mercure JWT token from API Route
 */

'use client'

import { useQuery } from '@tanstack/react-query'

type MercureTokenResponse = {
  token: string
}

/**
 * Fetches the Mercure JWT token for subscribing to real-time updates
 *
 * @param enabled - Whether to fetch the token
 * @returns Query result with the Mercure token
 */
export function useMercureToken(enabled = true) {
  return useQuery({
    queryKey: ['mercure', 'token'],
    queryFn: async () => {
      const response = await fetch('/api/mercure/token')

      if (!response.ok) {
        throw new Error('Failed to fetch Mercure token')
      }

      const data: MercureTokenResponse = await response.json()
      return data.token
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 5.5, // 5.5 hours (token expires in 6 hours)
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
    retry: 3,
  })
}
