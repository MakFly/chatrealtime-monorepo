'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { handleGoogleCallbackAction } from '@/lib/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GalleryVerticalEnd } from 'lucide-react'
import Link from 'next/link'

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get hash fragments from URL (e.g., #access_token=...&refresh_token=...)
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)

        console.log('Callback URL hash:', hash)
        console.log('Parsed params:', Object.fromEntries(params.entries()))

        // Check if we have any parameters at all
        if (hash.length === 0) {
          console.log('No callback parameters found, redirecting to login')
          router.push('/login')
          return
        }

        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const expiresIn = params.get('expires_in')
        const errorParam = params.get('error')
        const errorMessage = params.get('message')

        if (errorParam) {
          // Decode the error message
          const decodedMessage = errorMessage
            ? decodeURIComponent(errorMessage)
            : 'Google authentication failed. Please try again.'
          console.error('Authentication error:', errorParam, decodedMessage)
          setError(decodedMessage)
          setIsProcessing(false)
          return
        }

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken })
          setError('Invalid callback parameters. Please try again.')
          setIsProcessing(false)
          return
        }

        // Call server action to handle the callback
        // Use default expires_in if not provided (1 hour = 3600 seconds)
        const result = await handleGoogleCallbackAction(
          accessToken,
          refreshToken,
          expiresIn ? parseInt(expiresIn, 10) : 3600
        )

        if (result?.error) {
          console.error('Server action error:', result.error)
          setError(result.error)
          setIsProcessing(false)
        }

        // The server action will redirect to dashboard on success
        // Note: redirect() throws NEXT_REDIRECT error, which is expected
      } catch (err) {
        // Check if this is a Next.js redirect error (expected behavior)
        if (err && typeof err === 'object' && 'digest' in err) {
          // This is a Next.js redirect, let it propagate
          throw err
        }

        console.error('Callback processing error:', err)
        setError('An unexpected error occurred. Please try again.')
        setIsProcessing(false)
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Chat Realtime
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isProcessing ? 'Signing you in...' : 'Authentication Error'}
            </CardTitle>
            <CardDescription>
              {isProcessing
                ? 'Please wait while we complete your Google sign-in'
                : error || 'An error occurred'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">{error}</p>
                <Link
                  href="/login"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Back to login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
