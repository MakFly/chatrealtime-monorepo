'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { JWT_CONFIG } from '@/lib/config/jwt'
import { useAuthStore, useTokenExpiration } from '@/lib/store/use-auth-store'

function hasAccessTokenCookie(): boolean {
  if (typeof document === 'undefined') return false
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))
  
  return !!cookie
}

export function useTokenRefresh() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const tokenExpiresAt = useTokenExpiration() // Get expiration from store
  const setTokenExpiration = useAuthStore((state) => state.setTokenExpiration)

  const refreshToken = useCallback(async () => {
    try {
      console.log('[TokenRefresh] 🔄 Refreshing token...')
      
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        console.error('[TokenRefresh] ❌ Failed, redirecting to login')
        router.push('/login')
        return
      }

      const data = await res.json()
      console.log('[TokenRefresh] ✅ Success! Response:', data)
      
      // Store new expiration in store
      if (data.expires_in) {
        setTokenExpiration(data.expires_in)
      } else {
        console.error('[TokenRefresh] ⚠️  No expires_in in response!')
      }
      
      router.refresh() // Refresh Server Components
      
      // Re-schedule next refresh will happen via useEffect watching tokenExpiresAt
    } catch (error) {
      console.error('[TokenRefresh] ❌ Error:', error)
      router.push('/login')
    }
  }, [router, setTokenExpiration])

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Check if cookie exists
    const hasCookie = hasAccessTokenCookie()
    console.log('[TokenRefresh] 🔍 Cookie present:', hasCookie)
    
    if (!hasCookie) {
      console.log('[TokenRefresh] ⚠️  No access_token cookie, skipping refresh schedule')
      return
    }

    // Check if we have expiration in store
    if (!tokenExpiresAt) {
      console.log('[TokenRefresh] ⚠️  No token expiration in store, skipping refresh schedule')
      console.log('[TokenRefresh] 💡 This is normal on first page load - expiration will be set after login')
      return
    }

    const now = Math.floor(Date.now() / 1000)
    const timeLeft = tokenExpiresAt - now
    const refreshIn = timeLeft - JWT_CONFIG.REFRESH_THRESHOLD

    console.log('[TokenRefresh] ⏰ Token state:', {
      expiresAt: new Date(tokenExpiresAt * 1000).toISOString(),
      timeLeft: `${timeLeft}s`,
      refreshIn: `${refreshIn}s`,
      threshold: `${JWT_CONFIG.REFRESH_THRESHOLD}s`
    })

    if (refreshIn <= 0) {
      console.log('[TokenRefresh] ⚡ Token expiring soon, refreshing immediately')
      refreshToken()
      return
    }

    console.log(`[TokenRefresh] ✅ Scheduling refresh in ${refreshIn}s`)
    timerRef.current = setTimeout(refreshToken, refreshIn * 1000)
  }, [tokenExpiresAt, refreshToken])

  // Schedule refresh when tokenExpiresAt changes
  useEffect(() => {
    console.log('[TokenRefresh] 🎬 Hook mounted or tokenExpiresAt changed:', tokenExpiresAt)
    scheduleRefresh()
    
    return () => {
      console.log('[TokenRefresh] 🧹 Cleanup: clearing timer')
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [tokenExpiresAt, scheduleRefresh])

  return { refreshToken }
}

