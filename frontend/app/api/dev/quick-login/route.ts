import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'

type AuthResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  user: {
    id: string
    email: string
    name: string | null
  }
}

/**
 * POST /api/dev/quick-login
 *
 * Development-only endpoint for quick login with 20-second access token expiration.
 * This allows testing of automatic token refresh functionality.
 *
 * Body:
 * {
 *   "email": "user@test.com",
 *   "password": "password"
 * }
 *
 * ⚠️ Only works in development mode
 * ⚠️ Overrides access_token cookie with 20-second expiration
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Call Symfony login endpoint
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      // In dev, accept self-signed certificates
      ...(process.env.NODE_ENV === 'development' && {
        agent: { rejectUnauthorized: false },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: errorData.message || 'Login failed',
          status: response.status,
        },
        { status: response.status }
      )
    }

    const authData: AuthResponse = await response.json()

    const cookieStore = await cookies()

    // Set access_token with TTL from API (respects backend JWT_TOKEN_TTL)
    const accessTokenExpiresAt = Math.floor(Date.now() / 1000) + authData.expires_in

    cookieStore.set('access_token', authData.access_token, {
      httpOnly: false,
      secure: false, // Dev only, always false
      sameSite: 'lax',
      maxAge: authData.expires_in,
      path: '/',
      expires: new Date(accessTokenExpiresAt * 1000),
    })

    cookieStore.set('access_token_expires_at', accessTokenExpiresAt.toString(), {
      httpOnly: false,
      secure: false, // Dev only, always false
      sameSite: 'lax',
      maxAge: authData.expires_in,
      path: '/',
      expires: new Date(accessTokenExpiresAt * 1000),
    })

    // Set refresh_token with normal 7-day expiration
    cookieStore.set('refresh_token', authData.refresh_token, {
      httpOnly: true,
      secure: false, // Dev only, always false
      sameSite: 'strict',
      maxAge: 604800, // 7 days
      path: '/',
      expires: new Date(Date.now() + 604800 * 1000),
    })

    return NextResponse.json({
      success: true,
      message: `Quick login successful - access_token expires in ${authData.expires_in} seconds`,
      user: authData.user,
      expires_in: authData.expires_in,
    })
  } catch (error) {
    console.error('Quick login error:', error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
