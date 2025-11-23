/**
 * Hook to monitor Mercure connection and display reconnection dialog
 * When connection is lost (token expired), shows dialog asking user to continue or quit
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type UseMercureConnectionMonitorOptions = {
  error: Error | null
}

/**
 * Monitors Mercure connection errors and manages reconnection dialog
 *
 * @param options Configuration options
 * @returns Dialog state and callbacks
 *
 * @example
 * ```tsx
 * const { showDialog, handleContinue, handleQuit } = useMercureConnectionMonitor({
 *   error: mercureError
 * })
 * ```
 */
export function useMercureConnectionMonitor(
  options: UseMercureConnectionMonitorOptions
) {
  const { error } = options
  const router = useRouter()

  const [showDialog, setShowDialog] = useState(false)
  const hasShownDialogRef = useRef(false)
  const isUnloadingRef = useRef(false)

  // Track page unload to avoid showing dialog during refresh/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Detect when error occurs and show dialog ONCE
  // But ignore errors during page unload (refresh, navigation)
  useEffect(() => {
    if (error && !hasShownDialogRef.current && !isUnloadingRef.current) {
      console.log('[MercureConnectionMonitor] Connection error detected, showing dialog')
      setShowDialog(true)
      hasShownDialogRef.current = true
    }
  }, [error])

  /**
   * User wants to continue - refresh the page to get new token
   */
  const handleContinue = () => {
    console.log('[MercureConnectionMonitor] User chose to continue, refreshing page')
    window.location.reload()
  }

  /**
   * User wants to quit - redirect to homepage
   */
  const handleQuit = () => {
    console.log('[MercureConnectionMonitor] User chose to quit, redirecting to homepage')
    router.push('/')
  }

  return {
    showDialog,
    handleContinue,
    handleQuit,
  }
}
