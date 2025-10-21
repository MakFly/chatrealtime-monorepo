import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

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

  return <>{children}</>
}
