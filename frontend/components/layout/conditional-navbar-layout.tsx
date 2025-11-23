'use client'

import { usePathname } from 'next/navigation'
import { ProtectedNavbar } from '@/components/layout/protected-navbar'

type ConditionalNavbarLayoutProps = {
  children: React.ReactNode
}

export function ConditionalNavbarLayout({ children }: ConditionalNavbarLayoutProps) {
  const pathname = usePathname()

  // Hide navbar for full-screen routes: chat-v2, dashboard, and chat
  // marketplace and other routes should have navbar
  const isFullScreenRoute =
    pathname === '/chat-v2' || pathname.startsWith('/chat-v2/') ||
    pathname === '/dashboard' || pathname.startsWith('/dashboard/') ||
    pathname === '/chat' || pathname.startsWith('/chat/')

  if (isFullScreenRoute) {
    // No navbar - full screen
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ProtectedNavbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
