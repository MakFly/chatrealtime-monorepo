import { redirect } from 'next/navigation'

/**
 * Legacy dynamic route - redirects to new search params based route
 *
 * @deprecated Use /marketplace-chat?productId=X&userId=Y instead
 *
 * Old: /marketplace-chat/[productId]/[userId]
 * New: /marketplace-chat?productId=X&userId=Y
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
  redirect(`/marketplace-chat?productId=${productId}&userId=${userId}`)
}
