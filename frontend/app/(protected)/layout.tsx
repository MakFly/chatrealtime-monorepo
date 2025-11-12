import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'
import { ProtectedNavbar } from '@/components/layout/protected-navbar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check authentication - user already fetched in root layout
  const user = await getCurrentUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Get current pathname to conditionally show navbar
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Hide navbar for full-screen chat interfaces
  const isFullScreenRoute = pathname.startsWith('/chat') || pathname.startsWith('/chat-v2')

  if (isFullScreenRoute) {
    // No navbar for chat interfaces - full screen
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* <ProtectedNavbar /> */}
      <main className="flex-1">{children}</main>
    </div>
  )
}
