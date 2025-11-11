import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { RealChatInterface } from "../_components/real-chat-interface"

type PageProps = {
  params: Promise<{ roomId: string }>
}

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

/**
 * Verify that the chat room exists and user has access to it
 * Returns true if room is valid and accessible, false otherwise
 */
async function verifyChatRoomAccess(roomId: number): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[ChatRoomPage] No access token found')
      return false
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
    const API_URL = `${API_BASE_URL}/api/v1`
    const response = await fetch(`${API_URL}/chat_rooms/${roomId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Important: always check access
    })

    if (!response.ok) {
      console.warn(`[ChatRoomPage] Room ${roomId} not accessible: ${response.status}`)
      return false
    }

    console.log(`[ChatRoomPage] Room ${roomId} verified and accessible`)
    return true
  } catch (error) {
    console.error('[ChatRoomPage] Error verifying room access:', error)
    return false
  }
}

export default async function ChatRoomPage({ params }: PageProps) {
  const { roomId } = await params

  // Validate roomId is a number
  const roomIdNumber = parseInt(roomId, 10)
  if (isNaN(roomIdNumber)) {
    redirect('/chat')
  }

  // ✅ Verify that the room exists and user has access to it
  const hasAccess = await verifyChatRoomAccess(roomIdNumber)
  if (!hasAccess) {
    // Room doesn't exist or user doesn't have access
    console.warn(`[ChatRoomPage] Redirecting from room ${roomIdNumber}: no access or room not found`)
    redirect('/chat')
  }

  // Fetch Mercure token server-side before rendering
  const initialMercureToken = await getMercureToken()

  return (
    <div className="h-screen w-full">
      <RealChatInterface
        initialMercureToken={initialMercureToken}
        initialRoomId={roomIdNumber}
      />
    </div>
  )
}
