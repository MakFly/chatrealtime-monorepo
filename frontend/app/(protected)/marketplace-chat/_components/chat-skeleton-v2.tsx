/**
 * Skeleton components for Chat V2 loading states
 * Matches the structure of the real chat interface V2 for smooth transitions
 */

import { Skeleton } from '@/components/ui/skeleton'
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset } from '@/components/ui/sidebar'

/**
 * Product sidebar skeleton for loading state
 */
export function ProductSidebarSkeleton() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Skeleton className="h-6 w-32" />
      </SidebarHeader>
      <SidebarContent className="p-4 space-y-4">
        {/* Product image skeleton */}
        <Skeleton className="h-48 w-full rounded-lg" />

        {/* Product title */}
        <Skeleton className="h-6 w-3/4" />

        {/* Product price */}
        <Skeleton className="h-8 w-24" />

        {/* Product description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>

        {/* Seller info */}
        <div className="border-t pt-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

/**
 * Chat header skeleton for room loading
 */
export function ChatHeaderV2Skeleton() {
  return (
    <div className="flex items-center gap-3 border-b p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-9 w-9 rounded-md" />
    </div>
  )
}

/**
 * Chat messages skeleton for loading messages
 */
export function ChatMessagesV2Skeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Message left (received) */}
      <div className="flex items-start gap-2">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-16 w-64 rounded-lg" />
        </div>
      </div>

      {/* Message right (sent) */}
      <div className="flex items-start gap-2 justify-end">
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-16 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      </div>

      {/* Message left */}
      <div className="flex items-start gap-2">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-72 rounded-lg" />
        </div>
      </div>

      {/* Message right */}
      <div className="flex items-start gap-2 justify-end">
        <div className="space-y-2 max-w-md">
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-12 w-56 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      </div>
    </div>
  )
}

/**
 * Chat input skeleton
 */
export function ChatInputV2Skeleton() {
  return (
    <div className="border-t p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
  )
}

/**
 * Complete chat interface V2 skeleton with product sidebar
 * Used during initial data loading
 */
export function ChatInterfaceV2Skeleton() {
  return (
    <SidebarProvider>
      <ProductSidebarSkeleton />

      <SidebarInset>
        <div className="flex h-full flex-col">
          <ChatHeaderV2Skeleton />
          <ChatMessagesV2Skeleton />
          <ChatInputV2Skeleton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

/**
 * Empty state skeleton (no product selected yet)
 */
export function ChatEmptyStateV2Skeleton() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b p-4">
          <Skeleton className="h-6 w-32" />
        </SidebarHeader>
        <SidebarContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Chargement...
          </p>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <div className="flex h-full flex-1 items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
