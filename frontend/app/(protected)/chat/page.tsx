import { cookies } from 'next/headers'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { RealChatInterface } from "./_components/real-chat-interface"
import { ChatEmptyStateSkeleton } from "./_components/chat-skeleton"
import { getChatRoomsServer, getMessagesServer } from '@/lib/data/chat'
import { getCurrentUser } from '@/lib/auth'
import { getQueryClient } from '@/lib/get-query-client'

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

type ChatPageProps = {
  searchParams: Promise<{ roomId?: string }>
}

/**
 * Chat page - handles both empty state and specific room via search params
 * Uses ?roomId=X instead of /chat/X for instant client-side navigation
 */
export default async function ChatPage({ searchParams }: ChatPageProps) {
  // Get roomId from search params (e.g., /chat?roomId=3)
  const params = await searchParams
  const roomId = parseInt(params.roomId || '0', 10)

  // ✅ Create QueryClient with React cache() (ensures single instance per request)
  const queryClient = getQueryClient()

  // Fetch data in parallel (include messages if roomId provided)
  const [initialMercureToken, initialRooms, initialMessages, currentUser] = await Promise.all([
    getMercureToken(),
    getChatRoomsServer(),
    roomId > 0 ? getMessagesServer(roomId) : Promise.resolve(null),
    getCurrentUser(),
  ])

  // ✅ Prefill cache with server data (prevents client-side fetches)
  // CRITICAL: Hydrate ALL data used by client components to avoid duplicate fetches

  // Hydrate user cache (used by useCurrentUser hook)
  if (currentUser) {
    queryClient.setQueryData(['user', 'me'], currentUser)
  }

  // Hydrate rooms cache (used by useChatRooms hook)
  if (initialRooms && initialRooms.length > 0) {
    queryClient.setQueryData(['chatRooms', undefined, undefined], {
      member: initialRooms,
    })
  }

  // Hydrate Mercure token cache (used by useMercureToken hook)
  if (initialMercureToken) {
    queryClient.setQueryData(['mercure', 'token'], initialMercureToken)
  }

  // Hydrate messages cache if roomId provided
  if (roomId > 0 && initialMessages) {
    queryClient.setQueryData(['messages', roomId, undefined], initialMessages)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-screen w-full">
        <RealChatInterface
          initialMercureToken={initialMercureToken}
          initialRoomId={roomId > 0 ? roomId : null}
          initialUser={currentUser}
        />
      </div>
    </HydrationBoundary>
  )
}

/**
 * Loading component shown during server-side data fetching
 */
export function Loading() {
  return <ChatEmptyStateSkeleton />
}
