import { cookies } from 'next/headers'
import { RealChatInterface } from "./_components/real-chat-interface"

/**
 * Fetch Mercure JWT token server-side
 * This eliminates the client-side fetch, reducing from 2 to 1 Mercure connection
 */
async function getMercureToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[ChatPage] No access token found in cookies')
      return null
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
    const response = await fetch(`${API_URL}/api/v1/mercure/token`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Important: fresh token at every request
    })

    if (!response.ok) {
      console.error('[ChatPage] Failed to fetch Mercure token:', response.status)
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch (error) {
    console.error('[ChatPage] Error fetching Mercure token:', error)
    return null
  }
}

export default async function ChatPage() {
  // Fetch Mercure token server-side before rendering
  const initialMercureToken = await getMercureToken()

  return (
    <div className="h-screen w-full">
      <RealChatInterface initialMercureToken={initialMercureToken} />
    </div>
  )
}
