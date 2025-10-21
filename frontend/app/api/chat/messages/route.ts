/**
 * API Route for Chat Messages
 * Proxies requests to Symfony backend with server-side cookie access
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
const API_URL = `${API_BASE_URL}/api/v1`

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies (server-side only)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    console.log('[Messages API Route] 🍪 All cookies:', cookieStore.getAll().map(c => c.name))
    console.log('[Messages API Route] 🔑 Access token present:', !!accessToken)
    console.log('[Messages API Route] 🔑 Access token (first 50 chars):', accessToken?.substring(0, 50))

    if (!accessToken) {
      console.error('[Messages API Route] ❌ No access token in cookies!')
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    // Get query parameters from request URL
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = queryString
      ? `${API_URL}/messages?${queryString}`
      : `${API_URL}/messages`

    // Forward request to Symfony backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

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

export async function POST(request: NextRequest) {
  try {
    // Get access token from cookies (server-side only)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()

    // Forward request to Symfony backend
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

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
