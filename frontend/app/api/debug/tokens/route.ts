import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

type TokenInfo = {
  exp: number
  iat: number
  timeLeft: number
  expired: boolean
}

type DebugResponse = {
  access_token: TokenInfo | null
  refresh_token: TokenInfo | null
  error?: string
}

/**
 * Decode JWT token and extract expiration info
 * Note: This only decodes the payload, does NOT verify signature
 * Safe for debugging since we're just reading expiration times
 */
function decodeJWT(token: string): { exp: number; iat: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    )

    return {
      exp: payload.exp || 0,
      iat: payload.iat || 0,
    }
  } catch {
    return null
  }
}

/**
 * Calculate token info with time remaining
 */
function getTokenInfo(token: string | undefined): TokenInfo | null {
  if (!token) return null

  const decoded = decodeJWT(token)
  if (!decoded) return null

  const now = Math.floor(Date.now() / 1000) // Current time in seconds
  const timeLeft = decoded.exp - now
  const expired = timeLeft <= 0

  return {
    exp: decoded.exp,
    iat: decoded.iat,
    timeLeft,
    expired,
  }
}

/**
 * GET /api/debug/tokens
 *
 * Development-only endpoint to inspect JWT token expiration times.
 * Returns decoded token info (exp, iat, timeLeft) for both access and refresh tokens.
 *
 * ⚠️ Only works in development mode
 */
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const refreshToken = cookieStore.get('refresh_token')?.value

  const response: DebugResponse = {
    access_token: getTokenInfo(accessToken),
    refresh_token: getTokenInfo(refreshToken),
  }

  if (!accessToken && !refreshToken) {
    response.error = 'No tokens found in cookies'
  }

  return NextResponse.json(response)
}
