import { cookies } from 'next/headers'
import { RealChatInterfaceV2 } from '../../_components/real-chat-interface-v2'

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

/**
 * Chat V2 page for product-based conversations
 * Shows chat interface with product context in sidebar
 *
 * @param params.productId - Product ID from URL
 * @param params.userId - Seller user ID from URL
 */
export default async function ChatV2Page({
  params,
}: {
  params: Promise<{ productId: string; userId: string }>
}) {
  const { productId, userId } = await params

  // Fetch Mercure token server-side before rendering
  const initialMercureToken = await getMercureTokenV2()

  const productIdNum = parseInt(productId, 10)
  const userIdNum = parseInt(userId, 10)

  return (
    <div className="h-screen w-full">
      <RealChatInterfaceV2
        initialMercureToken={initialMercureToken}
        productId={productIdNum}
        sellerId={userIdNum}
      />
    </div>
  )
}
