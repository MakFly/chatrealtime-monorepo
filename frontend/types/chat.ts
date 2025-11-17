/**
 * Chat-related TypeScript types
 * Matches Symfony API Platform entities
 */

import type { User } from './auth'

/**
 * ChatRoom entity type
 * Backend: src/Entity/ChatRoom.php
 */
export type ChatRoom = {
  id: number
  name: string
  type: 'direct' | 'group' | 'public'
  participants: ChatParticipant[]
  messages: Message[]
  createdAt: string // ISO 8601 format
  updatedAt: string // ISO 8601 format
  unreadCount?: number
}

/**
 * Message status for optimistic updates
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered'

/**
 * Message entity type
 * Backend: src/Entity/Message.php
 * ✅ API now returns author as full User object with serialization groups
 */
export type Message = {
  id: number
  content: string
  author: User // Full User object with id, email, name, picture
  chatRoom: ChatRoom | { '@id': string; '@type': string; name: string } // Can be partial
  createdAt: string // ISO 8601 format
  updatedAt?: string // ISO 8601 format (optional for compatibility)
  status?: MessageStatus // Local status for optimistic updates
}

/**
 * ChatParticipant entity type
 * Backend: src/Entity/ChatParticipant.php
 */
export type ChatParticipant = {
  id: number
  user: User
  chatRoom: ChatRoom
  role: 'admin' | 'member'
  joinedAt: string // ISO 8601 format
}

/**
 * API Response types for collections
 * ✅ Our API returns 'member' and 'totalItems', not 'hydra:member' and 'hydra:totalItems'
 */
export type ChatRoomCollection = {
  '@context': string
  '@id': string
  '@type': string
  member: ChatRoom[] // ✅ API returns 'member'
  totalItems: number // ✅ API returns 'totalItems'
  'hydra:view'?: {
    '@id': string
    'hydra:first'?: string
    'hydra:last'?: string
    'hydra:previous'?: string
    'hydra:next'?: string
  }
}

export type MessageCollection = {
  member: Message[] // ✅ API returns 'member'
  totalItems: number // ✅ API returns 'totalItems'
  'hydra:view'?: {
    '@id': string
    'hydra:first'?: string
    'hydra:last'?: string
    'hydra:previous'?: string
    'hydra:next'?: string
  }
}

/**
 * Request types for creating/updating entities
 */
export type CreateChatRoomRequest = {
  name: string
  type: 'direct' | 'group' | 'public'
}

export type UpdateChatRoomRequest = {
  name?: string
}

export type CreateMessageRequest = {
  content: string
  chatRoom: string // IRI: /api/v1/chat_rooms/{id}
}

export type AddParticipantRequest = {
  user: string // IRI: /api/users/{id}
  chatRoom: string // IRI: /api/v1/chat_rooms/{id}
  role?: 'admin' | 'member'
}

/**
 * Mercure update types
 * ✅ Author is now always a full User object
 */
export type MercureMessageUpdate = {
  '@context': string
  '@id': string
  '@type': 'Message'
  id: number
  content: string
  author: {
    '@id': string
    id: number
    email: string
    name: string | null
    picture: string | null
  }
  chatRoom: string // IRI
  createdAt: string
  updatedAt: string
}

export type MercureChatRoomUpdate = {
  '@context': string
  '@id': string
  '@type': 'ChatRoom'
  id: number
  name: string
  type: string
  updatedAt: string
}

/**
 * Pagination parameters
 */
export type PaginationParams = {
  page?: number
  limit?: number
}

/**
 * Chat room filters
 */
export type ChatRoomFilters = {
  type?: 'direct' | 'group' | 'public'
  participant?: string // User ID
}
