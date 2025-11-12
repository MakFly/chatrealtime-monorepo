import { redirect } from 'next/navigation'

/**
 * Legacy dynamic route - redirects to new search params based route
 *
 * @deprecated Use /chat-v2?productId=X&userId=Y instead
 *
 * Old: /chat-v2/[productId]/[userId]
 * New: /chat-v2?productId=X&userId=Y
 *
 * This provides instant client-side navigation without page reloads
 */
export default async function ChatV2LegacyPage({
  params,
}: {
  params: Promise<{ productId: string; userId: string }>
}) {
  const { productId, userId } = await params

  // Redirect to new search params based route
  redirect(`/chat-v2?productId=${productId}&userId=${userId}`)
}
