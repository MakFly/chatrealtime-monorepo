/**
 * Google OAuth Callback Handler
 *
 * After successful Google authentication, the backend redirects here with tokens.
 * This page extracts the tokens from URL parameters and stores them in Next.js cookies.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL parameters (sent by backend)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const expiresIn = searchParams.get('expires_in')

        if (!accessToken || !refreshToken || !expiresIn) {
          setError('Missing authentication tokens')
          return
        }

        // Store tokens in Next.js cookies via server action
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken,
            refreshToken,
            expiresIn: parseInt(expiresIn, 10),
          }),
        })

        if (!response.ok) {
          setError('Failed to create session')
          return
        }

        // Redirect to dashboard/chat
        router.push('/chat')
      } catch (err) {
        console.error('Callback error:', err)
        setError('An error occurred during authentication')
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Authentication Error
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          Completing authentication...
        </p>
      </div>
    </div>
  )
}
