import { cookies } from 'next/headers'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { RealChatInterfaceV2 } from './_components/real-chat-interface-v2'
import { ChatEmptyStateV2Skeleton } from './_components/chat-skeleton-v2'
import { getChatRoomsV2Server, getMessagesV2Server, getProductServer } from '@/lib/data/chat-v2'
import { getCurrentUser } from '@/lib/auth'
import { getQueryClient } from '@/lib/get-query-client'

/**
 * Fetch Mercure JWT token V2 server-side
 * This eliminates the client-side fetch, reducing from 2 to 1 Mercure connection
 */
async function getMercureTokenV2(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[ChatV2Page] No access token found in cookies')
      return null
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
    // Use V1 endpoint - Mercure token supports both V1 and V2 topics
    const response = await fetch(`${API_URL}/api/v1/mercure/token`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Important: fresh token at every request
    })

    if (!response.ok) {
      console.error('[ChatV2Page] Failed to fetch Mercure token:', response.status)
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch (error) {
    console.error('[ChatV2Page] Error fetching Mercure token:', error)
    return null
  }
}

type ChatV2PageProps = {
  searchParams: Promise<{ productId?: string; userId?: string }>
}

/**
 * Chat V2 page - handles product-based conversations via search params
 * Uses ?productId=X&userId=Y instead of /chat-v2/[productId]/[userId] for instant client-side navigation
 *
 * @example
 * /chat-v2?productId=5&userId=3 - Opens chat for product 5 with seller 3
 */
export default async function ChatV2Page({ searchParams }: ChatV2PageProps) {
  // Get productId and userId from search params
  const params = await searchParams
  const productId = parseInt(params.productId || '0', 10)
  const userId = parseInt(params.userId || '0', 10)

  // ✅ Create QueryClient with React cache() (ensures single instance per request)
  const queryClient = getQueryClient()

  // Fetch data in parallel (only if productId and userId provided)
  const shouldFetchChatData = productId > 0 && userId > 0

  const [initialMercureToken, initialRooms, initialProduct, currentUser] = await Promise.all([
    getMercureTokenV2(),
    shouldFetchChatData ? getChatRoomsV2Server() : Promise.resolve([]),
    productId > 0 ? getProductServer(productId) : Promise.resolve(null),
    getCurrentUser(),
  ])

  // ✅ Prefill cache with server data (prevents client-side fetches)
  // CRITICAL: Hydrate ALL data used by client components to avoid duplicate fetches

  // Hydrate user cache (used by useCurrentUser hook)
  if (currentUser) {
    queryClient.setQueryData(['user', 'me'], currentUser)
  }

  // Hydrate rooms V2 cache (used by useChatRoomsV2 hook)
  if (initialRooms && initialRooms.length > 0) {
    queryClient.setQueryData(['chatRoomsV2'], {
      member: initialRooms,
      totalItems: initialRooms.length,
    })
  }

  // Hydrate Mercure token V2 cache (used by useMercureTokenV2 hook)
  if (initialMercureToken) {
    queryClient.setQueryData(['mercure', 'token', 'v2'], initialMercureToken)
  }

  // Hydrate product cache (used by useProduct hook)
  if (initialProduct) {
    queryClient.setQueryData(['product', productId], initialProduct)
  }

  // Note: Messages will be fetched after room creation in RealChatInterfaceV2
  // because we need the roomId first

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-screen w-full">
        <RealChatInterfaceV2
          initialMercureToken={initialMercureToken}
          initialProductId={productId > 0 ? productId : null}
          initialSellerId={userId > 0 ? userId : null}
          initialUser={currentUser}
          initialProduct={initialProduct}
        />
      </div>
    </HydrationBoundary>
  )
}

/**
 * Loading component shown during server-side data fetching
 */
export function Loading() {
  return <ChatEmptyStateV2Skeleton />
}
