/**
 * Hook to get total notification count for Bell icon
 * Returns count of rooms with notifications (aligned with toast notifications)
 */

'use client'

import { useNotificationStore } from '@/lib/stores/notification-store'

export function useNotificationCount() {
  return useNotificationStore((state) => state.getTotalCount())
}
