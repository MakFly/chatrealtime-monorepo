import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * GET /api/debug/cookies
 *
 * Development-only endpoint to check all cookies.
 * Useful for debugging authentication issues.
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
  const allCookies = cookieStore.getAll()

  const cookieData = allCookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value.substring(0, 20) + '...', // Truncate for security
    hasValue: !!cookie.value,
    length: cookie.value.length,
  }))

  return NextResponse.json({
    count: allCookies.length,
    cookies: cookieData,
    authCookies: {
      hasAccessToken: !!cookieStore.get('access_token'),
      hasRefreshToken: !!cookieStore.get('refresh_token'),
      accessTokenLength: cookieStore.get('access_token')?.value.length || 0,
      refreshTokenLength: cookieStore.get('refresh_token')?.value.length || 0,
    },
  })
}
