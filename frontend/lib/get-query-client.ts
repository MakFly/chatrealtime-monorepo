/**
 * QueryClient factory for Server Components
 * Uses React cache() to ensure single instance per request
 *
 * CRITICAL: Do NOT create a global QueryClient - use this factory
 * to prevent data leaks between different user requests
 */

import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

/**
 * Create a QueryClient instance for server-side usage
 *
 * React's cache() ensures we get the same instance within a single request,
 * but a new instance for each different request (preventing data leaks)
 *
 * @returns QueryClient configured for SSR with optimal settings
 */
export const getQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // CRITICAL: staleTime must be > 0 for SSR to prevent immediate refetch on client
        staleTime: 60 * 1000, // 60 seconds - data stays fresh after hydration

        // Cache garbage collection time (how long to keep unused data)
        gcTime: 5 * 60 * 1000, // 5 minutes

        // Disable automatic refetching for SSR (data is already fresh from server)
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  })
})
