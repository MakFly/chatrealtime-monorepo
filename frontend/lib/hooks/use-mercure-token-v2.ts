/**
 * Hook to fetch Mercure JWT token for V2 chat using Server Action
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { getMercureTokenV2 } from '@/lib/actions/mercure'

/**
 * Fetches the Mercure JWT token for subscribing to V2 real-time updates
 *
 * @param enabled - Whether to fetch the token
 * @returns Query result with the Mercure token
 */
export function useMercureTokenV2(enabled = true) {
  return useQuery({
    queryKey: ['mercure', 'token', 'v2'],
    queryFn: async () => {
      console.log('[useMercureTokenV2] 🔍 Fetching Mercure token V2 from server action...')
      const token = await getMercureTokenV2()
      console.log('[useMercureTokenV2] ✅ Fetched token:', token ? 'Present' : 'Null')
      return token
    },
    enabled,
    staleTime: 1000 * 60 * 60 * 5.5, // 5.5 hours (token expires in 6 hours)
    gcTime: 1000 * 60 * 60 * 6, // 6 hours
    refetchOnMount: false, // Don't refetch on mount (token valid for 6 hours)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 3,
  })
}
