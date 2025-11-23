import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUnreadCountsV2Client, markChatRoomReadV2Client } from '@/lib/api/chat-client-v2'

export function useChatUnreadV2() {
  const queryClient = useQueryClient()

  const { data: unreadCounts, isLoading: isLoadingUnread } = useQuery({
    queryKey: ['chatUnreadV2'],
    queryFn: async () => {
      const response = await getUnreadCountsV2Client()
      return response.data || []
    },
    refetchInterval: 30000, // Poll every 30s
  })

  const markAsReadMutation = useMutation({
    mutationFn: markChatRoomReadV2Client,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatUnreadV2'] })
      // Optionally invalidate chatRoomsV2 if they display unread status
      // queryClient.invalidateQueries({ queryKey: ['chatRoomsV2'] })
    },
  })

  return {
    unreadCounts,
    isLoadingUnread,
    markAsRead: markAsReadMutation.mutate,
  }
}

