/**
 * API Route for Current User
 * Proxies request to Symfony backend with server-side cookie access
 */

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
const API_URL = `${API_BASE_URL}/api/v1`

/**
 * Write refreshed tokens in cookies (mirrors /api/auth/refresh route)
 */
function setSessionCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  const accessTokenExpiresAt = Math.floor(Date.now() / 1000) + expiresIn
  const accessExpiryDate = new Date(accessTokenExpiresAt * 1000)

  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiresIn,
    path: '/',
    expires: accessExpiryDate,
  })

  cookieStore.set('access_token_expires_at', accessTokenExpiresAt.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiresIn,
    path: '/',
    expires: accessExpiryDate,
  })

  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 604800, // 7 days
    path: '/',
  })
}

async function fetchUser(accessToken: string) {
  return fetch(`${API_URL}/user/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store', // Always fetch fresh user data
  })
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('access_token')?.value
    const refreshToken = cookieStore.get('refresh_token')?.value

    // Attempt refresh if no access token but refresh exists
    if (!accessToken && refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        accessToken = data.access_token
        setSessionCookies(cookieStore, data.access_token, data.refresh_token, data.expires_in)
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    // Forward request to Symfony backend
    let response = await fetchUser(accessToken)

    // If expired/invalid, try one refresh and retry
    if (response.status === 401 && refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (refreshRes.ok) {
        const data = await refreshRes.json()
        accessToken = data.access_token
        setSessionCookies(cookieStore, data.access_token, data.refresh_token, data.expires_in)
        response = await fetchUser(accessToken)
      }
    }

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: errorText || response.statusText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
