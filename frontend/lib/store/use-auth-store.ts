'use client'

import { create } from 'zustand'

type AuthStore = {
  isAuthenticated: boolean
  tokenExpiresAt: number | null // Unix timestamp (seconds) when access_token expires
  setAuthenticated: (value: boolean) => void
  setTokenExpiration: (expiresIn: number) => void // Store expires_in from API
  clearTokenExpiration: () => void
}

/**
 * Minimal Zustand store - Authentication status + Token expiration
 *
 * Purpose: Fast reactive updates for navbar/UI + Token refresh scheduling
 * - isAuthenticated: Used by PublicNavbar to show/hide login buttons
 * - tokenExpiresAt: Used by useTokenRefresh to schedule refresh (Unix timestamp in seconds)
 * - No user data stored here (use useUser() from user-context instead)
 * - No localStorage persistence (synced from Server Components + login responses)
 *
 * User data is managed via React Context (see lib/contexts/user-context.tsx)
 */
export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  tokenExpiresAt: null,
  
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  
  // Store token expiration time (expires_in from API response)
  setTokenExpiration: (expiresIn: number) => {
    if (!expiresIn || typeof expiresIn !== 'number' || expiresIn <= 0) {
      console.error('[AuthStore] ❌ Invalid expiresIn:', expiresIn)
      return
    }
    
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn
    console.log('[AuthStore] Token expires at:', new Date(expiresAt * 1000).toISOString(), `(in ${expiresIn}s)`)
    set({ tokenExpiresAt: expiresAt })
  },
  
  clearTokenExpiration: () => set({ tokenExpiresAt: null }),
}))

/**
 * Hook to check authentication status
 * Used by navbar and conditional UI components
 */
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated)

/**
 * Hook to get token expiration timestamp
 * Used by useTokenRefresh to schedule refresh
 */
export const useTokenExpiration = () => useAuthStore((state) => state.tokenExpiresAt)
