'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { JWT_CONFIG } from '@/lib/config/jwt'
import { useAuthStore, useTokenExpiration } from '@/lib/stores/use-auth-store'

/**
 * BroadcastChannel message types for cross-tab communication
 */
type RefreshMessage =
  | { type: 'REFRESH_SUCCESS'; expiresIn: number; timestamp: number }
  | { type: 'REFRESH_FAILED'; timestamp: number }
  | { type: 'LEADER_PING'; timestamp: number }
  | { type: 'LEADER_ACK'; timestamp: number }

function hasAccessTokenCookie(): boolean {
  if (typeof document === 'undefined') return false
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='))

  return !!cookie
}

/**
 * useTokenRefresh - JWT token refresh with cross-tab synchronization
 *
 * Features:
 * - BroadcastChannel for cross-tab communication
 * - Leader election: only one tab refreshes tokens
 * - Other tabs listen and sync their state
 * - Prevents race conditions and token rotation conflicts
 */
export function useTokenRefresh() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const bcRef = useRef<BroadcastChannel | null>(null)
  const isLeaderRef = useRef(false)
  const leaderCheckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  const tokenExpiresAt = useTokenExpiration()
  const setTokenExpiration = useAuthStore((state) => state.setTokenExpiration)

  /**
   * Refresh token (only called by leader tab)
   */
  const refreshToken = useCallback(async () => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      console.log('[TokenRefresh] 🔄 Already refreshing, skipping...')
      return
    }

    // Only leader should refresh
    if (!isLeaderRef.current) {
      console.log('[TokenRefresh] ⏸️  Not leader, skipping refresh')
      return
    }

    isRefreshingRef.current = true

    try {
      console.log('[TokenRefresh] 🔄 [LEADER] Refreshing token...')

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })

      if (!res.ok) {
        console.error('[TokenRefresh] ❌ [LEADER] Failed, redirecting to login')

        // Broadcast failure to other tabs
        bcRef.current?.postMessage({
          type: 'REFRESH_FAILED',
          timestamp: Date.now()
        } satisfies RefreshMessage)

        router.push('/login')
        return
      }

      const data = await res.json()
      console.log('[TokenRefresh] ✅ [LEADER] Success! Response:', data)

      // Store new expiration in store
      if (data.expires_in) {
        setTokenExpiration(data.expires_in)

        // Broadcast success to other tabs
        bcRef.current?.postMessage({
          type: 'REFRESH_SUCCESS',
          expiresIn: data.expires_in,
          timestamp: Date.now()
        } satisfies RefreshMessage)
      } else {
        console.error('[TokenRefresh] ⚠️  [LEADER] No expires_in in response!')
      }

      router.refresh() // Refresh Server Components

    } catch (error) {
      console.error('[TokenRefresh] ❌ [LEADER] Error:', error)

      // Broadcast failure to other tabs
      bcRef.current?.postMessage({
        type: 'REFRESH_FAILED',
        timestamp: Date.now()
      } satisfies RefreshMessage)

      router.push('/login')
    } finally {
      isRefreshingRef.current = false
    }
  }, [router, setTokenExpiration])

  /**
   * Schedule token refresh
   */
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

    const leaderStatus = isLeaderRef.current ? '[LEADER]' : '[FOLLOWER]'
    console.log(`[TokenRefresh] ⏰ ${leaderStatus} Token state:`, {
      expiresAt: new Date(tokenExpiresAt * 1000).toISOString(),
      timeLeft: `${timeLeft}s`,
      refreshIn: `${refreshIn}s`,
      threshold: `${JWT_CONFIG.REFRESH_THRESHOLD}s`
    })

    if (refreshIn <= 0) {
      console.log(`[TokenRefresh] ⚡ ${leaderStatus} Token expiring soon, refreshing immediately`)
      if (isLeaderRef.current) {
        refreshToken()
      }
      return
    }

    // Only leader schedules refresh
    if (isLeaderRef.current) {
      console.log(`[TokenRefresh] ✅ [LEADER] Scheduling refresh in ${refreshIn}s`)
      timerRef.current = setTimeout(refreshToken, refreshIn * 1000)
    } else {
      console.log(`[TokenRefresh] ⏸️  [FOLLOWER] Not scheduling (waiting for leader)`)
    }
  }, [tokenExpiresAt, refreshToken])

  /**
   * Leader election: first tab to load becomes leader
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Initialize BroadcastChannel
    const bc = new BroadcastChannel(JWT_CONFIG.BROADCAST_CHANNEL)
    bcRef.current = bc

    // Assume leadership initially
    isLeaderRef.current = true
    console.log('[TokenRefresh] 👑 Assuming leadership...')

    // Ping to check if another leader exists
    bc.postMessage({
      type: 'LEADER_PING',
      timestamp: Date.now()
    } satisfies RefreshMessage)

    // Listen for messages from other tabs
    const handleMessage = (event: MessageEvent<RefreshMessage>) => {
      const message = event.data

      switch (message.type) {
        case 'LEADER_PING':
          // Another tab is checking for leader
          if (isLeaderRef.current) {
            console.log('[TokenRefresh] 👑 [LEADER] Responding to ping')
            bc.postMessage({
              type: 'LEADER_ACK',
              timestamp: Date.now()
            } satisfies RefreshMessage)
          }
          break

        case 'LEADER_ACK':
          // Another tab is already leader, step down
          if (isLeaderRef.current) {
            console.log('[TokenRefresh] 👥 [FOLLOWER] Leader exists, stepping down')
            isLeaderRef.current = false

            // Clear any scheduled refresh
            if (timerRef.current) {
              clearTimeout(timerRef.current)
              timerRef.current = null
            }
          }
          break

        case 'REFRESH_SUCCESS':
          // Leader successfully refreshed, sync our store
          console.log('[TokenRefresh] 📡 [FOLLOWER] Received refresh success from leader:', message.expiresIn)
          setTokenExpiration(message.expiresIn)
          router.refresh()
          break

        case 'REFRESH_FAILED':
          // Leader failed to refresh
          console.error('[TokenRefresh] 📡 [FOLLOWER] Received refresh failure from leader')
          router.push('/login')
          break
      }
    }

    bc.addEventListener('message', handleMessage)

    // Periodic leader check (in case leader tab closes)
    leaderCheckTimerRef.current = setInterval(() => {
      if (!isLeaderRef.current) {
        // We're a follower, ping to see if leader still exists
        bc.postMessage({
          type: 'LEADER_PING',
          timestamp: Date.now()
        } satisfies RefreshMessage)

        // If no ACK within 500ms, assume leadership
        setTimeout(() => {
          if (!isLeaderRef.current) {
            console.log('[TokenRefresh] 👑 No leader response, assuming leadership')
            isLeaderRef.current = true
            scheduleRefresh() // Re-schedule with new leadership status
          }
        }, 500)
      }
    }, 10000) // Check every 10 seconds

    // Cleanup
    return () => {
      console.log('[TokenRefresh] 🧹 Cleanup: closing BroadcastChannel')
      bc.removeEventListener('message', handleMessage)
      bc.close()

      if (leaderCheckTimerRef.current) {
        clearInterval(leaderCheckTimerRef.current)
        leaderCheckTimerRef.current = null
      }
    }
  }, [router, setTokenExpiration, scheduleRefresh])

  // Schedule refresh when tokenExpiresAt changes
  useEffect(() => {
    const leaderStatus = isLeaderRef.current ? '[LEADER]' : '[FOLLOWER]'
    console.log(`[TokenRefresh] 🎬 ${leaderStatus} Hook mounted or tokenExpiresAt changed:`, tokenExpiresAt)
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

