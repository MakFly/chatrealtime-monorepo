/**
 * Chat V2 API client functions - CLIENT-SIDE ONLY
 * Use these in Client Components for marketplace product chats
 *
 * UPDATED: Now uses Next.js API routes for secure server-side cookie handling
 * instead of direct client-side API calls with document.cookie
 */

import type {
  ChatRoomV2,
  ChatRoomV2Collection,
  MessageV2,
  MessageV2Collection,
  CreateChatRoomV2Request,
  CreateProductChatRequest,
  UpdateChatRoomV2Request,
  CreateMessageV2Request,
  AddParticipantV2Request,
} from '@/types/chat-v2'

/**
 * API Endpoints for V2
 * Now points to Next.js API routes instead of Symfony backend directly
 * This ensures proper server-side cookie handling and better error management
 */
const ENDPOINTS = {
  CHAT_ROOMS: '/api/chat-v2/rooms',
  MESSAGES: '/api/chat-v2/messages',
  PARTICIPANTS: '/api/v2/chat_participants', // TODO: Create Next.js route if needed
  MERCURE_TOKEN: '/api/v2/mercure/token', // TODO: Create Next.js route if needed
  PRODUCT_CHAT: '/api/chat-v2/products', // Base for /products/{id}/chat
} as const

type ApiResponse<T> = {
  data: T | null
  status: number
  error?: {
    message: string
    status: number
    details?: string
  }
}

/**
 * Generic fetch wrapper for Next.js API routes
 * Returns structured response with error handling
 */
async function nextApiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        data: null as T,
        status: response.status,
        error: {
          message: data.error || response.statusText,
          status: response.status,
          details: data.details,
        },
      }
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    console.error('[Chat V2 Client] Request failed:', {
      url,
      error,
    })
    throw error
  }
}

/**
 * Get all chat rooms v2 (client-side)
 * Uses Next.js API route for secure server-side cookie handling
 */
export async function getChatRoomsV2Client() {
  return nextApiRequest<ChatRoomV2Collection>(ENDPOINTS.CHAT_ROOMS)
}

/**
 * Get a single chat room v2 (client-side)
 * Uses Next.js API route for secure server-side cookie handling
 */
export async function getChatRoomV2Client(roomId: number) {
  return nextApiRequest<ChatRoomV2>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`)
}

/**
 * Create a new chat room v2 (client-side)
 * Uses Next.js API route for secure server-side cookie handling
 */
export async function createChatRoomV2Client(data: CreateChatRoomV2Request) {
  return nextApiRequest<ChatRoomV2>(ENDPOINTS.CHAT_ROOMS, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Create or find chat room for a product (client-side)
 * POST /api/chat-v2/products/{productId}/chat
 *
 * CRITICAL FIX: Now uses Next.js API route instead of direct Symfony call
 * This fixes 401/403 errors by properly handling server-side cookies
 */
export async function createProductChatClient(
  productId: number,
  sellerId: number
) {
  return nextApiRequest<ChatRoomV2>(
    `${ENDPOINTS.PRODUCT_CHAT}/${productId}/chat`,
    {
      method: 'POST',
      body: JSON.stringify({ sellerId }),
    }
  )
}

/**
 * Get user's chat rooms for a product (client-side)
 * GET /api/chat-v2/products/{productId}/chats
 *
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function getProductChatsClient(productId: number) {
  return nextApiRequest<ChatRoomV2[]>(
    `${ENDPOINTS.PRODUCT_CHAT}/${productId}/chats`
  )
}

/**
 * Update a chat room v2 (client-side)
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function updateChatRoomV2Client(
  roomId: number,
  data: UpdateChatRoomV2Request
) {
  return nextApiRequest<ChatRoomV2>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * Delete a chat room v2 (client-side)
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function deleteChatRoomV2Client(roomId: number) {
  return nextApiRequest(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`, {
    method: 'DELETE',
  })
}

/**
 * Get messages for a chat room v2 (client-side)
 * Uses Next.js API route for secure server-side cookie handling
 */
export async function getMessagesV2Client(roomId: number) {
  const params = new URLSearchParams()
  // API Platform SearchFilter expects IRI format
  params.append('chatRoom', `/api/v2/chat_rooms/${roomId}`)

  return nextApiRequest<MessageV2Collection>(
    `${ENDPOINTS.MESSAGES}?${params.toString()}`
  )
}

/**
 * Send a message in a chat room v2 (client-side)
 * Uses Next.js API route for secure server-side cookie handling
 */
export async function sendMessageV2Client(data: CreateMessageV2Request) {
  return nextApiRequest<MessageV2>(ENDPOINTS.MESSAGES, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Delete a message v2 (client-side)
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function deleteMessageV2Client(messageId: number) {
  return nextApiRequest(`${ENDPOINTS.MESSAGES}/${messageId}`, {
    method: 'DELETE',
  })
}

/**
 * Add a participant to a chat room v2 (client-side)
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function addParticipantV2Client(data: AddParticipantV2Request) {
  return nextApiRequest(ENDPOINTS.PARTICIPANTS, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Remove a participant from a chat room v2 (client-side)
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function removeParticipantV2Client(participantId: number) {
  return nextApiRequest(`${ENDPOINTS.PARTICIPANTS}/${participantId}`, {
    method: 'DELETE',
  })
}

/**
 * Get Mercure JWT token for v2 topics (client-side)
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function getMercureTokenV2Client() {
  return nextApiRequest<{ token: string; expiresIn: number }>(
    ENDPOINTS.MERCURE_TOKEN
  )
}

/**
 * Join a public chat room v2 (client-side)
 * TODO: Create Next.js API route if this endpoint is used
 */
export async function joinChatRoomV2Client(roomId: number) {
  return nextApiRequest(`${ENDPOINTS.CHAT_ROOMS}/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}
