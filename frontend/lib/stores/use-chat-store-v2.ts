/**
 * Chat Store V2 - Zustand state management for marketplace chat
 * Manages current room, messages, product context, and UI state
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatRoomV2, MessageV2 } from '@/types/marketplace-chat'
import type { Product } from '@/types/product'

type ChatV2State = {
  // Current selected room
  currentRoomId: number | null
  currentRoom: ChatRoomV2 | null

  // Current product context
  currentProduct: Product | null

  // Rooms list
  rooms: ChatRoomV2[]

  // Messages for current room
  messages: MessageV2[]

  // UI state
  isSidebarOpen: boolean
  isProductDetailsOpen: boolean
  isLoadingMessages: boolean
  isLoadingRooms: boolean

  // Actions
  setCurrentRoom: (
    roomId: number | null,
    room: ChatRoomV2 | null,
    product?: Product | null
  ) => void
  setRooms: (rooms: ChatRoomV2[]) => void
  addRoom: (room: ChatRoomV2) => void
  updateRoom: (roomId: number, updates: Partial<ChatRoomV2>) => void
  removeRoom: (roomId: number) => void

  setMessages: (messages: MessageV2[]) => void
  addMessage: (message: MessageV2) => void
  removeMessage: (messageId: number) => void

  setCurrentProduct: (product: Product | null) => void

  toggleSidebar: () => void
  toggleProductDetails: () => void
  setLoadingMessages: (loading: boolean) => void
  setLoadingRooms: (loading: boolean) => void

  // Reset
  reset: () => void
}

const initialState = {
  currentRoomId: null,
  currentRoom: null,
  currentProduct: null,
  rooms: [],
  messages: [],
  isSidebarOpen: true,
  isProductDetailsOpen: false, // Product details sidebar collapsed by default
  isLoadingMessages: false,
  isLoadingRooms: false,
}

export const useChatStoreV2 = create<ChatV2State>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Room actions
      setCurrentRoom: (roomId, room, product) =>
        set({
          currentRoomId: roomId,
          currentRoom: room,
          currentProduct: product ?? null,
          messages: [], // Clear messages when switching rooms
        }),

      setRooms: (rooms) => set({ rooms }),

      addRoom: (room) =>
        set((state) => ({
          rooms: [room, ...state.rooms],
        })),

      updateRoom: (roomId, updates) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId ? { ...room, ...updates } : room
          ),
          currentRoom:
            state.currentRoomId === roomId && state.currentRoom
              ? { ...state.currentRoom, ...updates }
              : state.currentRoom,
        })),

      removeRoom: (roomId) =>
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== roomId),
          // Clear current room if it was deleted
          currentRoomId:
            state.currentRoomId === roomId ? null : state.currentRoomId,
          currentRoom: state.currentRoomId === roomId ? null : state.currentRoom,
          currentProduct: state.currentRoomId === roomId ? null : state.currentProduct,
        })),

      // Message actions
      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => {
          // Extract room ID from message.chatRoom
          const messageRoomId =
            typeof message.chatRoom === 'object' && 'id' in message.chatRoom
              ? message.chatRoom.id
              : null

          // Only add if message is for current room
          if (messageRoomId !== state.currentRoomId) {
            return state
          }

          // Check for duplicates
          const exists = state.messages.some((m) => m.id === message.id)
          if (exists) {
            return state
          }

          return {
            messages: [...state.messages, message].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
          }
        }),

      removeMessage: (messageId) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== messageId),
        })),

      // Product actions
      setCurrentProduct: (product) => set({ currentProduct: product }),

      // UI actions
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),

      toggleProductDetails: () =>
        set((state) => ({
          isProductDetailsOpen: !state.isProductDetailsOpen,
        })),

      setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
      setLoadingRooms: (loading) => set({ isLoadingRooms: loading }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'chat-v2-storage',
      partialize: (state) => ({
        // Don't persist currentRoomId, currentRoom, currentProduct - URL is source of truth
        // Only persist UI preferences
        isSidebarOpen: state.isSidebarOpen,
        isProductDetailsOpen: state.isProductDetailsOpen,
      }),
    }
  )
)
