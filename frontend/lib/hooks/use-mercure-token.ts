/**
 * Hook to fetch Mercure JWT token using Server Action
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getMercureToken } from '@/lib/actions/mercure'

/**
 * Fetches the Mercure JWT token for subscribing to real-time updates
 *
 * @param enabled - Whether to fetch the token
 * @returns Query result with the Mercure token
 */
export function useMercureToken(enabled = true) {
  return useQuery({
    queryKey: ['mercure', 'token'],
    queryFn: getMercureToken,
    enabled,
    staleTime: 1000 * 60 * 60 * 5.5, // 5.5 hours (token expires in 6 hours)
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
    retry: 3,
  })
}
