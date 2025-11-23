import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { RealChatInterfaceV2 } from './_components/real-chat-interface-v2'
import { ChatEmptyStateV2Skeleton } from './_components/chat-skeleton-v2'
import { getChatRoomsV2Server, getMessagesV2Server, getProductServer } from '@/lib/data/chat-v2'
import { getCurrentUser } from '@/lib/auth'
import { getQueryClient } from '@/lib/get-query-client'
import { getMercureTokenV2 } from '@/lib/actions/mercure'

type ChatV2PageProps = {
  searchParams: Promise<{ productId?: string; userId?: string }>
}

/**
 * Chat V2 page - handles product-based conversations via search params
 * Uses ?productId=X&userId=Y instead of /marketplace-chat/[productId]/[userId] for instant client-side navigation
 *
 * @example
 * /marketplace-chat?productId=5&userId=3 - Opens chat for product 5 with seller 3
 */
export default async function ChatV2Page({ searchParams }: ChatV2PageProps) {
  // Get productId and userId from search params
  const params = await searchParams
  const productId = parseInt(params.productId || '0', 10)
  const userId = parseInt(params.userId || '0', 10)

  // ✅ Create QueryClient with React cache() (ensures single instance per request)
  const queryClient = getQueryClient()

  // Fetch data in parallel
  // ✅ Always fetch rooms (sidebar needs them even without productId/userId)
  let initialMercureToken: string | null = null
  try {
    initialMercureToken = await getMercureTokenV2()
  } catch (error) {
    console.error('[ChatV2Page] Failed to fetch Mercure token:', error)
  }

  const [initialRooms, initialProduct, currentUser] = await Promise.all([
    getChatRoomsV2Server(), // Always fetch - sidebar needs all rooms
    productId > 0 ? getProductServer(productId) : Promise.resolve(null),
    getCurrentUser(),
  ])

  // ✅ Find existing room for this product + seller combination
  let existingRoomId: number | null = null
  let initialMessages = null

  if (productId > 0 && userId > 0 && currentUser) {
    const currentUserId = parseInt(currentUser.id, 10)
    // Find room where current user and seller are both participants
    const existingRoom = initialRooms.find((room) => {
      if (room.productId !== productId) return false
      // Check if both current user and seller are participants
      const participantIds = room.participants?.map((p) => parseInt(p.user.id, 10)) || []
      return (
        participantIds.includes(currentUserId) && participantIds.includes(userId)
      )
    })

    if (existingRoom) {
      existingRoomId = existingRoom.id
      // Preload messages for existing room
      initialMessages = await getMessagesV2Server(existingRoom.id)
    }
  }

  // ✅ Prefill cache with server data (prevents client-side fetches)
  // CRITICAL: Hydrate ALL data used by client components to avoid duplicate fetches

  // Hydrate user cache (used by useCurrentUser hook)
  if (currentUser) {
    queryClient.setQueryData(['user', 'me'], currentUser)
  }

  // Hydrate rooms V2 cache (used by useChatRoomsV2 hook)
  // ✅ Always hydrate, even if empty, to prevent client-side refetch
  queryClient.setQueryData(['chatRoomsV2'], {
    member: initialRooms || [],
    totalItems: initialRooms?.length || 0,
  })

  // Hydrate Mercure token V2 cache (used by useMercureTokenV2 hook)
  if (initialMercureToken) {
    queryClient.setQueryData(['mercure', 'token', 'v2'], initialMercureToken)
  }

  // Hydrate product cache (used by useProduct hook)
  if (initialProduct) {
    queryClient.setQueryData(['product', productId], initialProduct)
  }

  // Hydrate messages cache if room exists
  if (existingRoomId && initialMessages) {
    queryClient.setQueryData(['messagesV2', existingRoomId], initialMessages)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-screen w-full">
        <RealChatInterfaceV2
          initialMercureToken={initialMercureToken}
          initialProductId={productId > 0 ? productId : null}
          initialSellerId={userId > 0 ? userId : null}
          initialUser={currentUser}
          initialProduct={initialProduct}
          initialRoomId={existingRoomId}
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
