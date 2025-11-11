/**
 * API Route for Chat V2 Messages
 * Proxies requests to Symfony backend with server-side cookie access
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
const API_URL = `${API_BASE_URL}/api`

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookies (server-side only)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    console.log('[Chat V2 Messages API] 🍪 All cookies:', cookieStore.getAll().map(c => c.name))
    console.log('[Chat V2 Messages API] 🔑 Access token present:', !!accessToken)

    if (!accessToken) {
      console.error('[Chat V2 Messages API] ❌ No access token in cookies!')
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    // Get query parameters from request URL
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const url = queryString
      ? `${API_URL}/v2/messages?${queryString}`
      : `${API_URL}/v2/messages`

    console.log('[Chat V2 Messages API] 📞 Fetching:', url)

    // Forward request to Symfony backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log('[Chat V2 Messages API] 📥 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Chat V2 Messages API] ❌ Error:', errorText)

      return NextResponse.json(
        {
          error: errorText || response.statusText,
          status: response.status
        },
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
    console.error('[Chat V2 Messages API] ❌ Exception:', error)
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
      console.error('[Chat V2 Messages API] ❌ No access token in cookies!')
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      )
    }

    // Get request body
    const body = await request.json()

    console.log('[Chat V2 Messages API] 📤 Posting message:', body)

    // Forward request to Symfony backend
    const response = await fetch(`${API_URL}/v2/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    console.log('[Chat V2 Messages API] 📥 Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Chat V2 Messages API] ❌ Error:', errorText)

      return NextResponse.json(
        {
          error: errorText || response.statusText,
          status: response.status
        },
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
    console.error('[Chat V2 Messages API] ❌ Exception:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
