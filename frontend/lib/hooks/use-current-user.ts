/**
 * Hook to fetch current authenticated user
 * Uses TanStack Query for caching and automatic refetching
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { User } from '@/types/auth'

/**
 * Fetches the current authenticated user from the API
 *
 * @returns Query result with the current user data
 *
 * @example
 * ```tsx
 * const { data: user, isLoading, error } = useCurrentUser()
 * ```
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      console.log('[useCurrentUser] 🔍 Fetching user from API...')
      const response = await fetch('/api/users/me')

      if (!response.ok) {
        console.error('[useCurrentUser] ❌ Failed:', response.status, response.statusText)
        throw new Error('Failed to fetch current user')
      }

      const user = await response.json() as User
      console.log('[useCurrentUser] ✅ Fetched from API:', user.email)
      return user
    },
    // CRITICAL: staleTime must match server QueryClient config to prevent refetch after SSR
    staleTime: 1000 * 60, // 60 seconds - matches server config
    gcTime: 1000 * 60 * 30, // 30 minutes (user data cached long-term)
    refetchOnMount: false, // Don't refetch on mount (SSR data is fresh)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: 3,
  })
}
