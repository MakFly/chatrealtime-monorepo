/**
 * Google OAuth Callback Handler
 *
 * After successful Google authentication, the backend redirects here with tokens.
 * This page extracts the tokens from URL hash fragment and stores them in Next.js cookies.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { handleGoogleCallbackAction } from '@/lib/actions/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get tokens from URL hash fragment (not query params!)
        // Backend sends: http://localhost:3000/auth/callback#access_token=...&refresh_token=...
        const hash = window.location.hash.substring(1) // Remove the '#'
        const params = new URLSearchParams(hash)

        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const expiresIn = params.get('expires_in')

        // Check for error in hash (user cancelled or error occurred)
        const errorParam = params.get('error')
        const errorMessage = params.get('message')

        if (errorParam) {
          setError(errorMessage || 'Authentication failed')
          return
        }

        if (!accessToken || !refreshToken || !expiresIn) {
          setError('Missing authentication tokens')
          console.error('Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, expiresIn: !!expiresIn })
          console.error('Full hash:', window.location.hash)
          return
        }

        // Store tokens using server action
        // Note: handleGoogleCallbackAction will redirect to /dashboard
        // The redirect() function throws a NEXT_REDIRECT exception which is normal behavior
        await handleGoogleCallbackAction(
          accessToken,
          refreshToken,
          parseInt(expiresIn, 10)
        )

        // If we reach here, there was an error (no redirect happened)
        setError('Authentication completed but redirect failed')
      } catch (err) {
        console.error('Callback error:', err)

        // Check if this is a Next.js redirect (which is normal)
        if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
          // This is a normal redirect, let it propagate
          throw err
        }

        // Otherwise, it's a real error
        setError('An error occurred during authentication')
      }
    }

    handleCallback()
  }, [router])

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
