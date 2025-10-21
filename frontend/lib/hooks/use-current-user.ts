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
      const response = await fetch('/api/users/me')

      if (!response.ok) {
        throw new Error('Failed to fetch current user')
      }

      return response.json() as Promise<User>
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (user data changes rarely)
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3,
  })
}
