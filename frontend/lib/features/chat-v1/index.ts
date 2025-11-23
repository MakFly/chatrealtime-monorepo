/**
 * Chat V1 Feature Module (Discord-like Chat)
 *
 * Public multi-user chat rooms with channels
 */

// Types
export type * from './types'

// Hooks
export { useChatRooms } from './hooks/use-chat-rooms'
export { useChatMessages } from './hooks/use-chat-messages'
export { useMarkAsRead } from './hooks/use-mark-as-read'
export { useNotificationCount } from './hooks/use-notification-count'
export { useTotalUnreadCount } from './hooks/use-total-unread-count'
export { useUnreadNotifications } from './hooks/use-unread-notifications'

// API Client
export * from './api/chat-client'
