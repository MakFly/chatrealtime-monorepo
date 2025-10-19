'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import type { User } from '@/types/auth'
import { apiGet } from '@/lib/api/client'
import { logoutAction } from '@/lib/actions/auth'

/**
 * Hook to manage authentication state in client components
 */
export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch current user from API
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User | null>({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const userData = await apiGet<User>('/me')
        return userData
      } catch (err) {
        // If unauthorized, return null (not logged in)
        if (err instanceof Error && 'status' in err && (err as any).status === 401) {
          return null
        }
        throw err
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const isAuthenticated = !!user && !isError

  /**
   * Logout and clear all cached data
   */
  const logout = async () => {
    try {
      await logoutAction()
      // Clear all queries
      queryClient.clear()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  /**
   * Refresh user data
   */
  const refresh = () => {
    refetch()
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    isError,
    error,
    logout,
    refresh,
  }
}
