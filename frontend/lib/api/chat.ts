/**
 * Chat API client functions
 * Uses server.ts or client.ts based on context
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
} from '@/types/chat'

// Server-side imports (use these in Server Components and Server Actions)
import { serverGet, serverPost, serverPatch, serverDelete } from './server'

// Client-side imports (use these in Client Components)
import { clientGet, clientPost, clientPatch, clientDelete } from './client'

/**
 * API Endpoints
 */
const ENDPOINTS = {
  CHAT_ROOMS: '/v1/chat_rooms',
  MESSAGES: '/v1/messages',
  PARTICIPANTS: '/v1/chat_participants',
} as const

/**
 * ============================================
 * SERVER-SIDE FUNCTIONS (Server Components & Server Actions)
 * ============================================
 */

/**
 * Get all chat rooms for current user
 */
export async function getChatRooms(
  filters?: ChatRoomFilters,
  pagination?: PaginationParams
) {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.participant) params.append('participant', filters.participant)
  if (pagination?.page) params.append('page', pagination.page.toString())
  if (pagination?.limit) params.append('itemsPerPage', pagination.limit.toString())

  const query = params.toString() ? `?${params.toString()}` : ''

  return serverGet<ChatRoomCollection>(`${ENDPOINTS.CHAT_ROOMS}${query}`)
}

/**
 * Get a single chat room by ID
 */
export async function getChatRoom(roomId: number) {
  return serverGet<ChatRoom>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`)
}

/**
 * Create a new chat room
 */
export async function createChatRoom(data: CreateChatRoomRequest) {
  return serverPost<ChatRoom>(ENDPOINTS.CHAT_ROOMS, data)
}

/**
 * Update a chat room
 */
export async function updateChatRoom(
  roomId: number,
  data: UpdateChatRoomRequest
) {
  return serverPatch<ChatRoom>(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`, data)
}

/**
 * Delete a chat room
 */
export async function deleteChatRoom(roomId: number) {
  return serverDelete(`${ENDPOINTS.CHAT_ROOMS}/${roomId}`)
}

/**
 * Get messages for a chat room
 */
export async function getMessages(
  roomId: number,
  pagination?: PaginationParams
) {
  const params = new URLSearchParams()
  // API Platform SearchFilter expects IRI format, not just the ID
  params.append('chatRoom', `/api/v1/chat_rooms/${roomId}`)

  if (pagination?.page) params.append('page', pagination.page.toString())
  if (pagination?.limit)
    params.append('itemsPerPage', pagination.limit.toString())

  return serverGet<MessageCollection>(`${ENDPOINTS.MESSAGES}?${params.toString()}`)
}

/**
 * Send a message to a chat room
 */
export async function sendMessage(data: CreateMessageRequest) {
  return serverPost<Message>(ENDPOINTS.MESSAGES, data)
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: number) {
  return serverDelete(`${ENDPOINTS.MESSAGES}/${messageId}`)
}

/**
 * Add a participant to a chat room
 */
export async function addParticipant(data: AddParticipantRequest) {
  return serverPost(ENDPOINTS.PARTICIPANTS, data)
}

/**
 * Remove a participant from a chat room
 */
export async function removeParticipant(participantId: number) {
  return serverDelete(`${ENDPOINTS.PARTICIPANTS}/${participantId}`)
}

/**
 * ============================================
 * CLIENT-SIDE FUNCTIONS (Client Components)
 * ============================================
 */

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
