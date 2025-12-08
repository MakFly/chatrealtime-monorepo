/**
 * Chat V2 types for marketplace product chats
 * Matches Symfony API Platform V2 entities
 */

import type { User } from '@/types/auth'
import type { Product } from './product'

/**
 * ChatRoomV2 entity type
 * Backend: src/Entity/ChatRoomV2.php
 */
export type ChatRoomV2 = {
  id: number
  name: string
  type: 'direct' | 'group' | 'public'
  productId: number
  productTitle: string
  participants: ChatParticipantV2[]
  messages: MessageV2[]
  createdAt: string
  updatedAt: string
  unreadCount?: number
}

/**
 * Message status for optimistic updates
 */
export type MessageStatus = 'pending' | 'sent' | 'delivered'

/**
 * MessageV2 entity type
 * Backend: src/Entity/MessageV2.php
 */
export type MessageV2 = {
  id: number
  content: string
  author: User
  chatRoom: ChatRoomV2 | { '@id': string; '@type': string; name: string }
  createdAt: string
  updatedAt?: string
  status?: MessageStatus
}

/**
 * ChatParticipantV2 entity type
 * Backend: src/Entity/ChatParticipantV2.php
 */
export type ChatParticipantV2 = {
  id: number
  user: User
  chatRoom: ChatRoomV2
  role: 'admin' | 'member'
  joinedAt: string
}

/**
 * API Response types for collections
 */
export type ChatRoomV2Collection = {
  '@context': string
  '@id': string
  '@type': string
  member: ChatRoomV2[]
  totalItems: number
  'hydra:view'?: {
    '@id': string
    'hydra:first'?: string
    'hydra:last'?: string
    'hydra:previous'?: string
    'hydra:next'?: string
  }
}

export type MessageV2Collection = {
  member: MessageV2[]
  totalItems: number
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
export type CreateChatRoomV2Request = {
  name: string
  type: 'direct' | 'group' | 'public'
  productId: number
  productTitle: string
}

export type CreateProductChatRequest = {
  sellerId: number
}

export type UpdateChatRoomV2Request = {
  name?: string
}

export type CreateMessageV2Request = {
  content: string
  chatRoom: string // IRI: /api/v2/chat_rooms/{id}
}

export type AddParticipantV2Request = {
  user: string // IRI: /api/users/{id}
  chatRoom: string // IRI: /api/v2/chat_rooms/{id}
  role?: 'admin' | 'member'
}

/**
 * Mercure update types for V2
 */
export type MercureMessageV2Update = {
  '@context': string
  '@id': string
  '@type': 'MessageV2'
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

export type MercureChatRoomV2Update = {
  '@context': string
  '@id': string
  '@type': 'ChatRoomV2'
  id: number
  name: string
  type: string
  productId: number
  productTitle: string
  updatedAt: string
}

/**
 * Extended chat room with product information
 */
export type ChatRoomV2WithProduct = ChatRoomV2 & {
  product?: Product // Optional full product data
}

export type ChatUnreadCountV2 = {
  roomId: number
  unreadCount: number
}
