import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ConditionalNavbarLayout } from '@/components/layout/conditional-navbar-layout'

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

  return <ConditionalNavbarLayout>{children}</ConditionalNavbarLayout>
}
