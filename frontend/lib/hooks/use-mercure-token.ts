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
    queryFn: async () => {
      console.log('[useMercureToken] 🔍 Fetching Mercure token from server action...')
      const token = await getMercureToken()
      console.log('[useMercureToken] ✅ Fetched token:', token ? 'Present' : 'Null')
      return token
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 5.5, // 5.5 hours (token expires in 6 hours)
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
    refetchOnMount: false, // Don't refetch on mount (SSR token is fresh)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 3,
  })
}
