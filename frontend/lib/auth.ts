import { cookies } from 'next/headers'
import type { Session, User } from '@/types/auth'

const ACCESS_TOKEN_COOKIE = 'access_token'
const REFRESH_TOKEN_COOKIE = 'refresh_token'
const ACCESS_TOKEN_EXPIRES_AT_COOKIE = 'access_token_expires_at'
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

const baseSecureFlag = process.env.NODE_ENV === 'production'

const accessTokenCookieOptions = {
  httpOnly: false,
  secure: baseSecureFlag,
  sameSite: 'lax' as const,
  path: '/',
}

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: baseSecureFlag,
  sameSite: 'strict' as const,
  path: '/', // Path remains / so SSR pages receive the cookie for server-side validation
}

/**
 * Get the current user session from cookies
 * Returns null if no valid session exists
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()

    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
    const accessTokenExpiresAt = cookieStore.get(ACCESS_TOKEN_EXPIRES_AT_COOKIE)?.value

    if (!accessToken || !refreshToken || !accessTokenExpiresAt) {
      return null
    }

    // Validate token strings
    if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
      console.error('Invalid token types:', { accessToken: typeof accessToken, refreshToken: typeof refreshToken })
      return null
    }

    const expiresAtSeconds = Number.parseInt(accessTokenExpiresAt, 10)
    if (Number.isNaN(expiresAtSeconds) || expiresAtSeconds <= 0) {
      console.error('Invalid token expiration:', accessTokenExpiresAt)
      return null
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAtSeconds * 1000,
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
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

  // Validate token before making API call
  if (!session.accessToken || typeof session.accessToken !== 'string') {
    console.error('Invalid access token:', session.accessToken)
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
      console.error('API response not ok:', response.status, response.statusText)
      return null
    }

    const userData = await response.json()
    
    // Validate response data
    if (!userData || typeof userData !== 'object') {
      console.error('Invalid user data received:', userData)
      return null
    }

    return userData
  } catch (error) {
    console.error('Failed to fetch current user:', error)
    return null
  }
}

/**
 * Create or update a session by setting secure cookies
 * Only stores tokens - user data is fetched from API when needed
 */
export async function setSession(
  accessToken: string,
  refreshToken: string,
  expiresIn: number = 300 // Default: 5 minutes in seconds
): Promise<void> {
  const cookieStore = await cookies()

  const normalizedExpiresIn = Math.max(1, expiresIn)
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + normalizedExpiresIn
  const accessTokenExpiry = new Date(expiresAtSeconds * 1000)
  const refreshTokenExpiry = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE * 1000)

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...accessTokenCookieOptions,
    maxAge: normalizedExpiresIn,
    expires: accessTokenExpiry,
  })

  cookieStore.set(
    ACCESS_TOKEN_EXPIRES_AT_COOKIE,
    expiresAtSeconds.toString(),
    {
      httpOnly: false,
      secure: baseSecureFlag,
      sameSite: 'lax',
      path: '/',
      maxAge: normalizedExpiresIn,
      expires: accessTokenExpiry,
    }
  )

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...refreshTokenCookieOptions,
    maxAge: REFRESH_TOKEN_MAX_AGE,
    expires: refreshTokenExpiry,
  })
}

/**
 * Clear the session by removing all auth cookies
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
  cookieStore.delete(ACCESS_TOKEN_EXPIRES_AT_COOKIE)
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
