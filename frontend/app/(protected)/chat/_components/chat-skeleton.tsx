/**
 * Chat Interface Skeleton Component
 * Loading state for the chat page with sidebar and main content area
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"

/**
 * Skeleton for a single room item in the sidebar
 */
function RoomItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-3">
      {/* Avatar skeleton */}
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />

      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-8 shrink-0" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

/**
 * Skeleton for the chat sidebar
 */
function ChatSidebarSkeleton() {
  return (
    <Sidebar>
      {/* Header with user info */}
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Search bar skeleton */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>

        {/* My Conversations skeleton */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 mb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-6 rounded-md" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...Array(3)].map((_, i) => (
                <SidebarMenuItem key={`my-room-${i}`}>
                  <RoomItemSkeleton />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Public Rooms skeleton */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-4 mb-2">
            <Skeleton className="h-4 w-24" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...Array(2)].map((_, i) => (
                <SidebarMenuItem key={`public-room-${i}`}>
                  <RoomItemSkeleton />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer skeleton */}
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

/**
 * Skeleton for the chat header
 */
function ChatHeaderSkeleton() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <Skeleton className="h-8 w-8 rounded-md shrink-0" />
    </header>
  )
}

/**
 * Skeleton for the chat messages area
 */
function ChatMessagesSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={`message-${i}`}
          className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
          <div className="space-y-2 max-w-[70%]">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for the chat input area
 */
function ChatInputSkeleton() {
  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        <Skeleton className="h-20 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-md shrink-0" />
      </div>
    </div>
  )
}

/**
 * Complete chat interface skeleton
 * Used during initial page load
 */
export function ChatInterfaceSkeleton() {
  return (
    <SidebarProvider>
      <ChatSidebarSkeleton />

      <SidebarInset>
        <div className="flex h-full flex-col">
          <ChatHeaderSkeleton />
          <ChatMessagesSkeleton />
          <ChatInputSkeleton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Empty state skeleton (no room selected)
 */
export function ChatEmptyStateSkeleton() {
  return (
    <SidebarProvider>
      <ChatSidebarSkeleton />

      <SidebarInset>
        <div className="flex h-full flex-col">
          <ChatHeaderSkeleton />
          <div className="flex h-full flex-1 items-center justify-center bg-background">
            <div className="text-center space-y-3">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
