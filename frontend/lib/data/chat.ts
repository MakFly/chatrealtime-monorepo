/**
 * Server-side data fetching for chat
 * Used for Server Components and streaming
 */

import { cookies } from 'next/headers'
import type { ChatRoom, ChatRoomCollection, MessageCollection } from '@/types/chat'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost'
const API_V1_URL = `${API_BASE_URL}/api/v1`

/**
 * Fetch chat rooms server-side
 * Used for initial page load and streaming
 */
export async function getChatRoomsServer(): Promise<ChatRoom[]> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[getChatRoomsServer] No access token found')
      return []
    }

    const response = await fetch(`${API_V1_URL}/chat_rooms`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      console.error('[getChatRoomsServer] Failed:', response.status)
      return []
    }

    const data = (await response.json()) as ChatRoomCollection
    return data.member || []
  } catch (error) {
    console.error('[getChatRoomsServer] Error:', error)
    return []
  }
}

/**
 * Fetch messages for a specific room server-side
 * Used for initial page load and streaming
 */
export async function getMessagesServer(roomId: number): Promise<MessageCollection | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[getMessagesServer] No access token found')
      return null
    }

    // Build query parameters
    const params = new URLSearchParams()
    params.append('chatRoom', `/api/v1/chat_rooms/${roomId}`)
    params.append('itemsPerPage', '50') // Load last 50 messages

    const response = await fetch(`${API_V1_URL}/messages?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Always fetch fresh data
    })

    if (!response.ok) {
      console.error('[getMessagesServer] Failed:', response.status)
      return null
    }

    return (await response.json()) as MessageCollection
  } catch (error) {
    console.error('[getMessagesServer] Error:', error)
    return null
  }
}

/**
 * Fetch a single room server-side
 * Used for room verification and initial load
 */
export async function getChatRoomServer(roomId: number): Promise<ChatRoom | null> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value

    if (!accessToken) {
      console.warn('[getChatRoomServer] No access token found')
      return null
    }

    const response = await fetch(`${API_V1_URL}/chat_rooms/${roomId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[getChatRoomServer] Failed:', response.status)
      return null
    }

    return (await response.json()) as ChatRoom
  } catch (error) {
    console.error('[getChatRoomServer] Error:', error)
    return null
  }
}
