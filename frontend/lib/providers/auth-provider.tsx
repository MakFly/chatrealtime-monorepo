'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/use-auth-store'
import { UserProvider } from '@/lib/contexts/user-context'
import { useTokenRefresh } from '@/lib/hooks/use-token-refresh'
import type { User } from '@/types/auth'

type AuthProviderProps = {
  children: React.ReactNode
  initialUser: User | null
}

// Decode JWT to extract expiration
function decodeJWT(token: string): { exp: number } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { exp: payload.exp || 0 }
  } catch {
    return null
  }
}

// Get access_token from cookie
function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))
  
  return cookie ? cookie.split('=')[1] : null
}

/**
 * AuthProvider - Unified provider for all pages (public + protected)
 *
 * Responsibilities:
 * 1. Provides user data via Context (accessible everywhere with useUser())
 * 2. Syncs isAuthenticated to Zustand (for navbar reactive updates)
 * 3. Extracts token expiration from JWT cookie and stores in Zustand
 * 4. Starts automatic token refresh timer when user is logged in
 *
 * Architecture:
 * - User data: React Context (no persistence, SSR-friendly)
 * - Auth status + Token expiration: Zustand (minimal, no persistence)
 * - Both synced from Server Component (user) and Cookie (token expiration)
 *
 * Note: Redirection logic is handled in Server Components (layouts)
 */
export function AuthProvider({ children, initialUser }: AuthProviderProps) {
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
    
    // Extract token expiration from cookie JWT
    const token = getAccessTokenFromCookie()
    if (!token) {
      console.log('[AuthProvider] ⚠️  User authenticated but no access_token cookie found')
      return
    }
    
    const decoded = decodeJWT(token)
    if (!decoded) {
      console.log('[AuthProvider] ⚠️  Failed to decode JWT')
      return
    }
    
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = decoded.exp - now
    
    console.log('[AuthProvider] ✅ User authenticated, extracting token expiration from JWT')
    console.log('[AuthProvider] Token expires at:', new Date(decoded.exp * 1000).toISOString())
    console.log('[AuthProvider] Time until expiration:', expiresIn, 's')
    
    setTokenExpiration(expiresIn)
  }, [initialUser, setAuthenticated, setTokenExpiration, clearTokenExpiration])
  
  // Timer automatique de refresh (s'active quand tokenExpiresAt est défini)
  useTokenRefresh()

  return (
    <UserProvider user={initialUser}>
      {children}
    </UserProvider>
  )
}
