/**
 * Chat API client functions - CLIENT-SIDE ONLY
 * Use these in Client Components
 */

import type {
  ChatRoom,
  ChatRoomCollection,
  Message,
  MessageCollection,
  CreateChatRoomRequest,
  UpdateChatRoomRequest,
  CreateMessageRequest,
  AddParticipantRequest,
  PaginationParams,
  ChatRoomFilters,
} from '../types'

// Client-side imports ONLY (no server imports)
import { clientGet, clientPost, clientPatch, clientDelete } from '@/lib/api/client'

/**
 * API Endpoints
 * Note: API_URL already includes /api/v1, so endpoints should start with /
 */
const ENDPOINTS = {
  CHAT_ROOMS: '/chat_rooms',
  MESSAGES: '/messages',
  PARTICIPANTS: '/chat_participants',
} as const

/**
 * Get all chat rooms (client-side)
 */
export async function getChatRoomsClient(
  filters?: ChatRoomFilters,
  pagination?: PaginationParams
) {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.participant) params.append('participant', filters.participant)
  if (pagination?.page) params.append('page', pagination.page.toString())
  if (pagination?.limit) params.append('itemsPerPage', pagination.limit.toString())

  const query = params.toString() ? `?${params.toString()}` : ''

  return clientGet<ChatRoomCollection>(`${ENDPOINTS.CHAT_ROOMS}${query}`)
}

/**
 * Get a single chat room (client-side)
 */
export async function getChatRoomClient(roomId: number) {
  return clientGet<ChatRoom>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`)
}

/**
 * Create a new chat room (client-side)
 */
export async function createChatRoomClient(data: CreateChatRoomRequest) {
  return clientPost<ChatRoom>(ENDPOINTS.CHAT_ROOMS, data)
}

/**
 * Update a chat room (client-side)
 */
export async function updateChatRoomClient(
  roomId: number,
  data: UpdateChatRoomRequest
) {
  return clientPatch<ChatRoom>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`, data)
}

/**
 * Delete a chat room (client-side)
 */
export async function deleteChatRoomClient(roomId: number) {
  return clientDelete(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`)
}

/**
 * Get messages for a chat room (client-side)
 */
export async function getMessagesClient(
  roomId: number,
  pagination?: PaginationParams
) {
  const params = new URLSearchParams()
  // API Platform SearchFilter expects IRI format, not just the ID
  params.append('chatRoom', `/api/v1/chat_rooms/${roomId}`)

  if (pagination?.page) params.append('page', pagination.page.toString())
  if (pagination?.limit)
    params.append('itemsPerPage', pagination.limit.toString())

  return clientGet<MessageCollection>(`${ENDPOINTS.MESSAGES}?${params.toString()}`)
}

/**
 * Send a message (client-side)
 */
export async function sendMessageClient(data: CreateMessageRequest) {
  return clientPost<Message>(ENDPOINTS.MESSAGES, data)
}

/**
 * Delete a message (client-side)
 */
export async function deleteMessageClient(messageId: number) {
  return clientDelete(`${ENDPOINTS.MESSAGES}/${messageId}`)
}

/**
 * Add a participant (client-side)
 */
export async function addParticipantClient(data: AddParticipantRequest) {
  return clientPost(ENDPOINTS.PARTICIPANTS, data)
}

/**
 * Remove a participant (client-side)
 */
export async function removeParticipantClient(participantId: number) {
  return clientDelete(`${ENDPOINTS.PARTICIPANTS}/${participantId}`)
}

/**
 * Join a public chat room (auto-add as participant)
 * Returns the updated participant count
 */
export async function joinChatRoomClient(roomId: number) {
  return clientPost<{ message: string; participant_count: number }>(
    `${ENDPOINTS.CHAT_ROOMS}/${roomId}/join`
  )
}

