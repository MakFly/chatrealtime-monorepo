/**
 * Chat V2 API client functions - CLIENT-SIDE ONLY
 * Use these in Client Components for marketplace product chats
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
  ChatUnreadCountV2,
} from '@/types/chat-v2'

// Client-side imports ONLY (no server imports)
import {
  clientGetV2,
  clientPostV2,
  clientPatchV2,
  clientDeleteV2,
} from './client-v2'

/**
 * API Endpoints for V2
 * Note: API_URL already includes /api, so endpoints should be /v2/...
 */
const ENDPOINTS = {
  CHAT_ROOMS: '/v2/chat_rooms',
  MESSAGES: '/v2/messages',
  PARTICIPANTS: '/v2/chat_participants',
  MERCURE_TOKEN: '/v2/mercure/token',
  PRODUCT_CHAT: '/v2/products', // Base for /products/{id}/chat
  CHAT_UNREAD: '/v2/chat/unread',
} as const

/**
 * Get all chat rooms v2 (client-side)
 */
export async function getChatRoomsV2Client() {
  return clientGetV2<ChatRoomV2Collection>(ENDPOINTS.CHAT_ROOMS)
}

/**
 * Get a single chat room v2 (client-side)
 */
export async function getChatRoomV2Client(roomId: number) {
  return clientGetV2<ChatRoomV2>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`)
}

/**
 * Create a new chat room v2 (client-side)
 */
export async function createChatRoomV2Client(data: CreateChatRoomV2Request) {
  return clientPostV2<ChatRoomV2>(ENDPOINTS.CHAT_ROOMS, data)
}

/**
 * Create or find chat room for a product (client-side)
 * POST /api/v2/products/{productId}/chat
 */
export async function createProductChatClient(
  productId: number,
  sellerId: number
) {
  return clientPostV2<ChatRoomV2>(
    `${ENDPOINTS.PRODUCT_CHAT}/${productId}/chat`,
    { sellerId }
  )
}

/**
 * Get user's chat rooms for a product (client-side)
 * GET /api/v2/products/{productId}/chats
 */
export async function getProductChatsClient(productId: number) {
  return clientGetV2<ChatRoomV2[]>(
    `${ENDPOINTS.PRODUCT_CHAT}/${productId}/chats`
  )
}

/**
 * Update a chat room v2 (client-side)
 */
export async function updateChatRoomV2Client(
  roomId: number,
  data: UpdateChatRoomV2Request
) {
  return clientPatchV2<ChatRoomV2>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`, data)
}

/**
 * Delete a chat room v2 (client-side)
 */
export async function deleteChatRoomV2Client(roomId: number) {
  return clientDeleteV2(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`)
}

/**
 * Get messages for a chat room v2 (client-side)
 * 
 * @param roomId - The chat room ID
 * @param options - Optional pagination options
 * @param options.itemsPerPage - Number of messages to fetch (default: 10000 = all messages)
 * @param options.page - Page number for pagination (default: 1)
 */
export async function getMessagesV2Client(
  roomId: number,
  options?: { itemsPerPage?: number; page?: number }
) {
  const params = new URLSearchParams()
  // API Platform SearchFilter expects IRI format
  params.append('chatRoom', `/api/v2/chat_rooms/${roomId}`)
  
  // ✅ Load all messages by default (or specify a limit)
  // Using a very high number effectively loads all messages
  // API Platform maximum_items_per_page is set to 10000
  const itemsPerPage = options?.itemsPerPage ?? 10000
  params.append('itemsPerPage', itemsPerPage.toString())
  
  if (options?.page) {
    params.append('page', options.page.toString())
  }

  return clientGetV2<MessageV2Collection>(
    `${ENDPOINTS.MESSAGES}?${params.toString()}`
  )
}

/**
 * Send a message in a chat room v2 (client-side)
 */
export async function sendMessageV2Client(data: CreateMessageV2Request) {
  return clientPostV2<MessageV2>(ENDPOINTS.MESSAGES, data)
}

/**
 * Delete a message v2 (client-side)
 */
export async function deleteMessageV2Client(messageId: number) {
  return clientDeleteV2(`${ENDPOINTS.MESSAGES}/${messageId}`)
}

/**
 * Add a participant to a chat room v2 (client-side)
 */
export async function addParticipantV2Client(data: AddParticipantV2Request) {
  return clientPostV2(ENDPOINTS.PARTICIPANTS, data)
}

/**
 * Remove a participant from a chat room v2 (client-side)
 */
export async function removeParticipantV2Client(participantId: number) {
  return clientDeleteV2(`${ENDPOINTS.PARTICIPANTS}/${participantId}`)
}

/**
 * Get Mercure JWT token for v2 topics (client-side)
 */
export async function getMercureTokenV2Client() {
  return clientGetV2<{ token: string; expiresIn: number }>(
    ENDPOINTS.MERCURE_TOKEN
  )
}

/**
 * Join a public chat room v2 (client-side)
 */
export async function joinChatRoomV2Client(roomId: number) {
  return clientPostV2(`${ENDPOINTS.CHAT_ROOMS}/${roomId}/join`, {})
}

/**
 * Leave a chat room v2 (soft delete) (client-side)
 */
export async function leaveChatRoomV2Client(roomId: number) {
  return clientPostV2<ChatRoomV2>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}/leave`, {})
}

/**
 * Get unread counts for v2 chat rooms (client-side)
 */
export async function getUnreadCountsV2Client() {
  return clientGetV2<ChatUnreadCountV2[]>(ENDPOINTS.CHAT_UNREAD)
}

/**
 * Mark a chat room as read v2 (client-side)
 */
export async function markChatRoomReadV2Client(roomId: number) {
  return clientPostV2(`${ENDPOINTS.CHAT_ROOMS}/${roomId}/read`, {})
}
