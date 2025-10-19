import { cookies } from 'next/headers'
import type { Session, User } from '@/types/auth'

const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'

/**
 * Cookie configuration for secure session management
 */
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

/**
 * Get the current user session from cookies
 * Returns null if no valid session exists
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()

  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value

  if (!accessToken || !refreshToken) {
    return null
  }

  // Calculate expiration timestamp (tokens typically expire in 1 hour = 3600 seconds)
  const expiresAt = Date.now() + 3600 * 1000

  return {
    accessToken,
    refreshToken,
    expiresAt,
  }
}

/**
 * Get just the user from the session
 * Fetches user data from the API using the stored access token
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
    const response = await fetch(`${API_URL}/api/v1/user/me`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch current user:', error)
    return null
  }
}

/**
 * Create or update a session by setting secure HTTP-only cookies
 * Only stores tokens - user data is fetched from API when needed
 */
export async function setSession(
  accessToken: string,
  refreshToken: string,
  expiresIn: number = 3600 // Default: 1 hour in seconds
): Promise<void> {
  const cookieStore = await cookies()

  // Calculate expiration date
  const expiresAt = new Date(Date.now() + expiresIn * 1000)

  // Set access token cookie
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...cookieOptions,
    maxAge: expiresIn,
    expires: expiresAt,
  })

  // Set refresh token cookie (30 days)
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })
}

/**
 * Clear the session by removing all auth cookies
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}

/**
 * Check if the user is authenticated
 * Useful for middleware and route protection
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

/**
 * Require authentication or throw an error
 * Useful for protecting server actions and API routes
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized: No valid session found')
  }

  return session
}
