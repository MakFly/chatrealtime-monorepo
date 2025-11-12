/**
 * Loading component for /chat route
 * Automatically shown by Next.js during page transition
 */

import { ChatEmptyStateSkeleton } from "./_components/chat-skeleton"

export default function Loading() {
  return <ChatEmptyStateSkeleton />
}
