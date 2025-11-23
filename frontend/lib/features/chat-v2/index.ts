/**
 * Chat V2 Feature Module (Marketplace Chat)
 *
 * Private buyer-seller conversations about products
 */

// Types
export type * from './types'
export type * from './types/product'

// Hooks
export { useChatRoomsV2 } from './hooks/use-chat-rooms-v2'
export { useChatMessagesV2 } from './hooks/use-chat-messages-v2'
export { useMercureTokenV2 } from './hooks/use-mercure-token-v2'
export { useChatUnreadV2 } from './hooks/use-chat-unread-v2'
export { useTotalUnreadCount } from './hooks/use-total-unread-count'
export { useUnreadNotificationsV2 } from './hooks/use-unread-notifications-v2'
export { useGlobalNotifications } from './hooks/use-global-notifications'

// API Client
export * from './api/product-chat-client'

// Utils
export { getRoomIdFromUrl } from './utils/chat-url'
