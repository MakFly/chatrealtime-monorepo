import { cookies } from 'next/headers'
import type { Session, User } from '@/types/auth'

const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'
const USER_COOKIE = 'user'

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
  const userCookie = cookieStore.get(USER_COOKIE)?.value

  if (!accessToken || !refreshToken || !userCookie) {
    return null
  }

  try {
    const user: User = JSON.parse(userCookie)

    // Calculate expiration timestamp (tokens typically expire in 1 hour = 3600 seconds)
    const expiresAt = Date.now() + 3600 * 1000

    return {
      user,
      accessToken,
      refreshToken,
      expiresAt,
    }
  } catch (error) {
    console.error('Failed to parse user cookie:', error)
    return null
  }
}

/**
 * Get just the user from the session
 * Convenient helper for when you only need user data
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  return session?.user || null
}

/**
 * Create or update a session by setting secure HTTP-only cookies
 */
export async function setSession(
  accessToken: string,
  refreshToken: string,
  user: User,
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

  // Set user data cookie (same expiration as access token)
  cookieStore.set(USER_COOKIE, JSON.stringify(user), {
    ...cookieOptions,
    maxAge: expiresIn,
    expires: expiresAt,
  })
}

/**
 * Clear the session by removing all auth cookies
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
  cookieStore.delete(USER_COOKIE)
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
