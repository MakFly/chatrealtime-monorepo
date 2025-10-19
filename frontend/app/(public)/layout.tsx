import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is already authenticated
  const session = await getSession()

  // Redirect to dashboard if already logged in
  if (session) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
