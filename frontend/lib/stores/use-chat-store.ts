/**
 * Chat Store - Zustand state management for chat application
 * Manages current room, messages, and UI state
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatRoom, Message } from '@/types/chat'

type ChatState = {
  // Current selected room
  currentRoomId: number | null
  currentRoom: ChatRoom | null

  // Rooms list
  rooms: ChatRoom[]

  // Messages for current room
  messages: Message[]

  // UI state
  isSidebarOpen: boolean
  isLoadingMessages: boolean
  isLoadingRooms: boolean

  // Actions
  setCurrentRoom: (roomId: number | null, room: ChatRoom | null) => void
  setRooms: (rooms: ChatRoom[]) => void
  addRoom: (room: ChatRoom) => void
  updateRoom: (roomId: number, updates: Partial<ChatRoom>) => void
  removeRoom: (roomId: number) => void

  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  removeMessage: (messageId: number) => void

  toggleSidebar: () => void
  setLoadingMessages: (loading: boolean) => void
  setLoadingRooms: (loading: boolean) => void

  // Reset
  reset: () => void
}

const initialState = {
  currentRoomId: null,
  currentRoom: null,
  rooms: [],
  messages: [],
  isSidebarOpen: true,
  isLoadingMessages: false,
  isLoadingRooms: false,
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Room actions
      setCurrentRoom: (roomId, room) =>
        set({
          currentRoomId: roomId,
          currentRoom: room,
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
        })),

      // Message actions
      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => {
          // Only add if message is for current room
          if (message.chatRoom.id !== state.currentRoomId) {
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

      // UI actions
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),

      setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
      setLoadingRooms: (loading) => set({ isLoadingRooms: loading }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        // ✅ Don't persist currentRoomId - URL is the source of truth
        // Only persist sidebar state
        isSidebarOpen: state.isSidebarOpen,
      }),
    }
  )
)
