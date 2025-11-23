/**
 * Global Notification Provider
 * Enables global chat notifications across the entire application
 */

'use client'

import { useGlobalChatNotifications } from '@/lib/hooks/use-global-chat-notifications'

type GlobalNotificationProviderProps = {
  children: React.ReactNode
}

/**
 * Provider that enables global chat notifications
 * Must be rendered as a child component (uses hooks)
 *
 * Features:
 * - Initializes global Mercure listener for chat notifications
 * - Shows toast notifications when messages are received
 * - Works across all pages in the application
 */
export function GlobalNotificationProvider({ children }: GlobalNotificationProviderProps) {
  // Initialize global notification listener
  useGlobalChatNotifications({ enabled: true })

  return <>{children}</>
}
