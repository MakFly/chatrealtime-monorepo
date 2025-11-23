/**
 * Server Actions for Mercure
 */

'use server'

import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
const API_V1_URL = `${API_BASE_URL}/api/v1`
const API_V2_URL = `${API_BASE_URL}/api/v2`

type MercureTokenResponse = {
  token: string
}

/**
 * Get Mercure JWT token for real-time subscriptions (V1)
 * Server action that fetches token from Symfony backend
 */
export async function getMercureToken(): Promise<string> {
  try {
    // Get access token from cookies (server-side only)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      throw new Error('Unauthorized - No access token')
    }

    // Fetch token from Symfony backend
    const response = await fetch(`${API_V1_URL}/mercure/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Always fetch fresh token
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[getMercureToken] ❌ Failed:', response.status, errorText)
      throw new Error(`Failed to fetch Mercure token: ${response.statusText}`)
    }

    const data: MercureTokenResponse = await response.json()
    return data.token
  } catch (error) {
    console.error('[getMercureToken] ❌ Error:', error)
    throw error
  }
}

/**
 * Get Mercure JWT token for real-time subscriptions (V2 - marketplace chat)
 * Fetches from V2 endpoint which generates tokens with /marketplace-chat topics
 * Server action that fetches token from Symfony backend
 */
export async function getMercureTokenV2(): Promise<string> {
  try {
    // Get access token from cookies (server-side only)
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      throw new Error('Unauthorized - No access token')
    }

    // ✅ Fetch token from V2 endpoint (uses MercureJwtGeneratorV2)
    const response = await fetch(`${API_V2_URL}/mercure/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Always fetch fresh token
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[getMercureTokenV2] ❌ Failed:', response.status, errorText)
      throw new Error(`Failed to fetch Mercure token V2: ${response.statusText}`)
    }

    const data: MercureTokenResponse = await response.json()
    console.log('[getMercureTokenV2] ✅ Fetched token from V2 endpoint')
    return data.token
  } catch (error) {
    console.error('[getMercureTokenV2] ❌ Error:', error)
    throw error
  }
}
