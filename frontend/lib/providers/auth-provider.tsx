'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/use-auth-store'
import { UserProvider } from '@/lib/contexts/user-context'
import { useTokenRefresh } from '@/lib/hooks/use-token-refresh'
import type { User } from '@/types/auth'

type AuthProviderProps = {
  children: React.ReactNode
  initialUser: User | null
  initialTokenExpiresAt: number | null
}

/**
 * AuthProvider - Unified provider for all pages (public + protected)
 *
 * Responsibilities:
 * 1. Provides user data via Context (accessible everywhere with useUser())
 * 2. Syncs isAuthenticated to Zustand (for navbar reactive updates)
 * 3. Extracts token expiration from cookie metadata and stores in Zustand
 * 4. Starts automatic token refresh timer when user is logged in
 *
 * Architecture:
 * - User data: React Context (no persistence, SSR-friendly)
 * - Auth status + Token expiration: Zustand (minimal, no persistence)
 * - Both synced from Server Component (user) and Cookie (token expiration)
 *
 * Note: Redirection logic is handled in Server Components (layouts)
 */
export function AuthProvider({ children, initialUser, initialTokenExpiresAt }: AuthProviderProps) {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setTokenExpiration = useAuthStore((state) => state.setTokenExpiration)
  const clearTokenExpiration = useAuthStore((state) => state.clearTokenExpiration)
  
  // Sync authentication status to Zustand store
  useEffect(() => {
    const isAuth = !!initialUser
    setAuthenticated(isAuth)
    
    if (!isAuth) {
      clearTokenExpiration()
      console.log('[AuthProvider] ❌ User not authenticated, cleared token expiration')
      return
    }
    
    // Extract token expiration from cookie metadata
    const expiresAt = initialTokenExpiresAt
    if (!expiresAt) {
      console.log('[AuthProvider] ⚠️  User authenticated but no access_token_expires_at value found')
      return
    }
    
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = expiresAt - now
    if (expiresIn <= 0) {
      console.log('[AuthProvider] ⚠️  access_token_expires_at already passed, skipping store update')
      return
    }
    
    console.log('[AuthProvider] ✅ User authenticated, extracting token expiration from cookie metadata')
    console.log('[AuthProvider] Token expires at:', new Date(expiresAt * 1000).toISOString())
    console.log('[AuthProvider] Time until expiration:', expiresIn, 's')
    
    setTokenExpiration(expiresIn)
  }, [initialUser, initialTokenExpiresAt, setAuthenticated, setTokenExpiration, clearTokenExpiration])
  
  // Timer automatique de refresh (s'active quand tokenExpiresAt est défini)
  useTokenRefresh()

  return (
    <UserProvider user={initialUser}>
      {children}
    </UserProvider>
  )
}
