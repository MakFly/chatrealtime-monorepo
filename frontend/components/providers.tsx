'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // CRITICAL: Must match server QueryClient config to prevent refetch after SSR
            staleTime: 60 * 1000, // 60 seconds - matches server config
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnMount: false, // Don't refetch on mount (SSR data is fresh)
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnReconnect: false, // Don't refetch on reconnect
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
    </QueryClientProvider>
  )
}
