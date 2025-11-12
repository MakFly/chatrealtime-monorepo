/**
 * Server-side data fetching for chat V2 (marketplace product chats)
 * Used for Server Components and SSR hydration
 */

import { cookies } from 'next/headers'
import type { ChatRoomV2, ChatRoomV2Collection, MessageV2Collection } from '@/types/chat-v2'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost'
const API_V2_URL = `${API_BASE_URL}/api/v2`

/**
 * Fetch chat rooms V2 server-side
 * Used for initial page load and streaming
 */
export async function getChatRoomsV2Server(): Promise<ChatRoomV2[]> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[getChatRoomsV2Server] No access token found')
      return []
    }

    const response = await fetch(`${API_V2_URL}/chat_rooms`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      console.error('[getChatRoomsV2Server] Failed:', response.status)
      return []
    }

    const data = (await response.json()) as ChatRoomV2Collection
    console.log('[getChatRoomsV2Server] ✅ Fetched', data.member?.length || 0, 'rooms')
    return data.member || []
  } catch (error) {
    console.error('[getChatRoomsV2Server] Error:', error)
    return []
  }
}

/**
 * Fetch messages V2 for a specific room server-side
 * Used for initial page load and streaming
 */
export async function getMessagesV2Server(roomId: number): Promise<MessageV2Collection | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[getMessagesV2Server] No access token found')
      return null
    }

    // Build query parameters
    const params = new URLSearchParams()
    params.append('chatRoom', `/api/v2/chat_rooms/${roomId}`)
    params.append('itemsPerPage', '50') // Load last 50 messages

    const response = await fetch(`${API_V2_URL}/messages?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      console.error('[getMessagesV2Server] Failed:', response.status)
      return null
    }

    const data = (await response.json()) as MessageV2Collection
    console.log('[getMessagesV2Server] ✅ Fetched', data.member?.length || 0, 'messages for room', roomId)
    return data
  } catch (error) {
    console.error('[getMessagesV2Server] Error:', error)
    return null
  }
}

/**
 * Fetch a single room V2 server-side
 * Used for room verification and initial load
 */
export async function getChatRoomV2Server(roomId: number): Promise<ChatRoomV2 | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[getChatRoomV2Server] No access token found')
      return null
    }

    const response = await fetch(`${API_V2_URL}/chat_rooms/${roomId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[getChatRoomV2Server] Failed:', response.status)
      return null
    }

    const data = (await response.json()) as ChatRoomV2
    console.log('[getChatRoomV2Server] ✅ Fetched room', roomId)
    return data
  } catch (error) {
    console.error('[getChatRoomV2Server] Error:', error)
    return null
  }
}

/**
 * Fetch product details server-side
 * Used for V2 chat product sidebar
 */
export async function getProductServer(productId: number): Promise<any | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[getProductServer] No access token found')
      return null
    }

    const response = await fetch(`${API_V2_URL}/products/${productId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[getProductServer] Failed:', response.status)
      return null
    }

    const data = await response.json()
    console.log('[getProductServer] ✅ Fetched product', productId)
    return data
  } catch (error) {
    console.error('[getProductServer] Error:', error)
    return null
  }
}
