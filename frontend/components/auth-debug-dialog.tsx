'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, Cookie, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import { useUser } from '@/lib/contexts/user-context'

type TokenInfo = {
  exp: number
  iat: number
  timeLeft: number
  expired: boolean
}

type DebugData = {
  access_token: TokenInfo | null
  refresh_token: TokenInfo | null
  error?: string
}

type CookieData = {
  count: number
  cookies: Array<{
    name: string
    value: string
    hasValue: boolean
    length: number
  }>
  authCookies: {
    hasAccessToken: boolean
    hasRefreshToken: boolean
    accessTokenLength: number
    refreshTokenLength: number
  }
}

/**
 * Format seconds to human-readable format
 */
function formatTime(seconds: number): string {
  if (seconds <= 0) return 'Expired'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

/**
 * Get status color based on time remaining
 */
function getStatusColor(timeLeft: number, expired: boolean): 'success' | 'warning' | 'destructive' {
  if (expired) return 'destructive'
  if (timeLeft < 60) return 'destructive' // < 1 minute
  if (timeLeft < 300) return 'warning' // < 5 minutes
  return 'success'
}

/**
 * Get status icon based on time remaining
 */
function getStatusIcon(timeLeft: number, expired: boolean) {
  if (expired) return <XCircle className="size-5" />
  if (timeLeft < 60) return <AlertTriangle className="size-5" />
  return <CheckCircle className="size-5" />
}

type AuthDebugDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthDebugDialog({ open, onOpenChange }: AuthDebugDialogProps) {
  const user = useUser()
  const [tokenData, setTokenData] = useState<DebugData | null>(null)
  const [cookieData, setCookieData] = useState<CookieData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<number>(0)

  // Function to fetch all debug data
  const fetchDebugData = () => {
    setIsLoading(true)
    setCountdown(0)

    // Fetch token data
    fetch('/api/debug/tokens')
      .then((res) => res.json())
      .then((data: DebugData) => {
        setTokenData(data)
        console.log('[AuthDebug] Token data updated:', data.access_token ? 'access_token present' : 'no token')
      })
      .catch((err) => console.error('Failed to fetch token data:', err))

    // Fetch cookie data
    fetch('/api/debug/cookies')
      .then((res) => res.json())
      .then((data: CookieData) => {
        setCookieData(data)
        console.log('[AuthDebug] Cookie data updated:', data.authCookies)
      })
      .catch((err) => console.error('Failed to fetch cookie data:', err))
      .finally(() => {
        setIsLoading(false)
        setLastRefresh(Date.now())
      })
  }

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      fetchDebugData()
    }
  }, [open])

  // Auto-refresh every 5 seconds when dialog is open
  useEffect(() => {
    if (!open) return

    const interval = setInterval(() => {
      console.log('[AuthDebug] Auto-refresh triggered')
      fetchDebugData()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [open])

  // Update countdown every second ONLY when dialog is open
  useEffect(() => {
    if (!open || !tokenData) return

    const interval = setInterval(() => {
      setCountdown((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [open, tokenData])

  const accessTimeLeft = tokenData?.access_token
    ? Math.max(0, tokenData.access_token.timeLeft - countdown)
    : 0

  const refreshTimeLeft = tokenData?.refresh_token
    ? Math.max(0, tokenData.refresh_token.timeLeft - countdown)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Auth Debug Panel
          </DialogTitle>
          <DialogDescription>
            Real-time authentication state monitoring (dev only)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tokens" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="cookies">Cookies</TabsTrigger>
          </TabsList>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-4 mt-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && tokenData?.error && (
              <Card className="border-yellow-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="size-5" />
                    No Tokens Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tokenData.error}
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoading && tokenData?.access_token && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(accessTimeLeft, tokenData.access_token.expired)}
                      Access Token
                    </CardTitle>
                    <Badge variant={getStatusColor(accessTimeLeft, tokenData.access_token.expired)}>
                      {tokenData.access_token.expired ? 'Expired' : 'Active'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Time Remaining</p>
                      <p className="font-mono text-lg font-semibold">
                        {formatTime(accessTimeLeft)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Expires At</p>
                      <p className="font-mono">
                        {new Date(tokenData.access_token.exp * 1000).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Issued At</p>
                      <p className="font-mono">
                        {new Date(tokenData.access_token.iat * 1000).toLocaleTimeString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Total Lifetime</p>
                      <p className="font-mono">
                        {formatTime(tokenData.access_token.exp - tokenData.access_token.iat)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        tokenData.access_token.expired
                          ? 'bg-destructive'
                          : accessTimeLeft < 60
                          ? 'bg-destructive'
                          : accessTimeLeft < 300
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          (accessTimeLeft / (tokenData.access_token.exp - tokenData.access_token.iat)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && tokenData?.refresh_token && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(refreshTimeLeft, tokenData.refresh_token.expired)}
                      Refresh Token
                    </CardTitle>
                    <Badge variant={getStatusColor(refreshTimeLeft, tokenData.refresh_token.expired)}>
                      {tokenData.refresh_token.expired ? 'Expired' : 'Active'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Time Remaining</p>
                      <p className="font-mono text-lg font-semibold">
                        {formatTime(refreshTimeLeft)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Expires At</p>
                      <p className="font-mono">
                        {new Date(tokenData.refresh_token.exp * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Issued At</p>
                      <p className="font-mono">
                        {new Date(tokenData.refresh_token.iat * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Total Lifetime</p>
                      <p className="font-mono">
                        {formatTime(tokenData.refresh_token.exp - tokenData.refresh_token.iat)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        tokenData.refresh_token.expired
                          ? 'bg-destructive'
                          : refreshTimeLeft < 3600
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.max(
                          0,
                          (refreshTimeLeft / (tokenData.refresh_token.exp - tokenData.refresh_token.iat)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoading && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <RefreshCw className="size-3" />
                Auto-refresh every 5s • Last update: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}
              </div>
            )}
          </TabsContent>

          {/* User Tab */}
          <TabsContent value="user" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="size-5" />
                  Current User (Zustand Store)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">ID</p>
                        <p className="font-mono">{user.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Email</p>
                        <p className="font-mono">{user.email}</p>
                      </div>
                      {user.name && (
                        <div>
                          <p className="text-muted-foreground mb-1">Name</p>
                          <p className="font-mono">{user.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Raw JSON</p>
                      <div className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-w-full">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(user, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No user in store. Please log in.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cookies Tab */}
          <TabsContent value="cookies" className="space-y-4 mt-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && cookieData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cookie className="size-5" />
                      Authentication Cookies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Has Access Token</p>
                        <div className="flex items-center gap-2">
                          {cookieData.authCookies.hasAccessToken ? (
                            <CheckCircle className="size-4 text-green-500" />
                          ) : (
                            <XCircle className="size-4 text-destructive" />
                          )}
                          <span className="font-mono">
                            {cookieData.authCookies.hasAccessToken ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Access Token Length</p>
                        <p className="font-mono">{cookieData.authCookies.accessTokenLength} chars</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Has Refresh Token</p>
                        <div className="flex items-center gap-2">
                          {cookieData.authCookies.hasRefreshToken ? (
                            <CheckCircle className="size-4 text-green-500" />
                          ) : (
                            <XCircle className="size-4 text-destructive" />
                          )}
                          <span className="font-mono">
                            {cookieData.authCookies.hasRefreshToken ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Refresh Token Length</p>
                        <p className="font-mono">{cookieData.authCookies.refreshTokenLength} chars</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>All Cookies ({cookieData.count})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cookieData.cookies.map((cookie, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-muted rounded-md text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              {cookie.name}
                            </Badge>
                            <span className="text-muted-foreground">
                              {cookie.length} chars
                            </span>
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {cookie.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!isLoading && (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <RefreshCw className="size-3" />
                Auto-refresh every 5s • Last update: {lastRefresh ? new Date(lastRefresh).toLocaleTimeString() : 'Never'}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
