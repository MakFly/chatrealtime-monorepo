/**
 * Mercure hook for real-time updates via Server-Sent Events (SSE)
 * Subscribes to Mercure topics and handles connection lifecycle
 */

'use client'

import { useEffect, useRef, useState } from 'react'

type MercureOptions = {
  hub?: string
  topics: string[]
  token?: string | null
  onMessage?: (data: MessageEvent) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  reconnect?: boolean
  reconnectDelay?: number
}

type MercureState = {
  connected: boolean
  error: string | null
  reconnecting: boolean
}

const DEFAULT_HUB = process.env.NEXT_PUBLIC_MERCURE_HUB_URL || 'https://localhost/.well-known/mercure'

/**
 * Hook for subscribing to Mercure topics
 *
 * @param options Configuration options
 * @returns Connection state and close function
 *
 * @example
 * ```tsx
 * const { connected, error, close } = useMercure({
 *   topics: [`/chat/room/${roomId}`],
 *   token: accessToken,
 *   onMessage: (event) => {
 *     const message = JSON.parse(event.data)
 *     addMessage(message)
 *   }
 * })
 * ```
 */
export function useMercure(options: MercureOptions) {
  const {
    hub = DEFAULT_HUB,
    topics,
    token,
    onMessage,
    onError,
    onOpen,
    reconnect = true,
    reconnectDelay = 3000,
  } = options

  const [state, setState] = useState<MercureState>({
    connected: false,
    error: null,
    reconnecting: false,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Store callbacks in refs to prevent re-triggering useEffect
  const onMessageRef = useRef(onMessage)
  const onErrorRef = useRef(onError)
  const onOpenRef = useRef(onOpen)

  // Update callback refs when they change
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    onOpenRef.current = onOpen
  }, [onOpen])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    // Don't connect if no topics or no token
    if (topics.length === 0 || !token) return

    // Build Mercure URL with topics
    const url = new URL(hub)
    topics.forEach((topic) => {
      url.searchParams.append('topic', topic)
    })

    // Add authorization if token provided
    if (token) {
      url.searchParams.append('authorization', token)
    }

    // Create EventSource connection
    const connect = () => {
      // Clear existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      try {
        const eventSource = new EventSource(url.toString())
        eventSourceRef.current = eventSource

        // Connection opened
        eventSource.onopen = () => {
          if (!mountedRef.current) return

          setState({
            connected: true,
            error: null,
            reconnecting: false,
          })

          if (onOpenRef.current) {
            onOpenRef.current()
          }

          console.log('[Mercure] Connected to hub:', hub)
        }

        // Message received
        eventSource.onmessage = (event: MessageEvent) => {
          if (!mountedRef.current) return

          if (onMessageRef.current) {
            onMessageRef.current(event)
          }
        }

        // Connection error
        eventSource.onerror = (event: Event) => {
          if (!mountedRef.current) return

          const errorMessage = 'Connection error'

          setState((prev) => ({
            ...prev,
            connected: false,
            error: errorMessage,
          }))

          if (onErrorRef.current) {
            onErrorRef.current(event)
          }

          // Only log error if EventSource is in CLOSED state (real error)
          // Ignore errors during CONNECTING state (happens on page refresh)
          if (eventSource.readyState === EventSource.CLOSED) {
            console.error('[Mercure] Connection error:', event)
          } else {
            console.log('[Mercure] Connection interrupted (page refresh/navigation), reconnecting...')
          }

          // Close the connection
          eventSource.close()

          // Attempt reconnection if enabled
          if (reconnect && mountedRef.current) {
            setState((prev) => ({
              ...prev,
              reconnecting: true,
            }))

            console.log(`[Mercure] Reconnecting in ${reconnectDelay}ms...`)

            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                connect()
              }
            }, reconnectDelay)
          }
        }
      } catch (error) {
        console.error('[Mercure] Failed to create EventSource:', error)
        setState({
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          reconnecting: false,
        })
      }
    }

    // Initial connection
    connect()

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('[Mercure] Closing connection')
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [hub, topics, token, reconnect, reconnectDelay])

  const close = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    setState({
      connected: false,
      error: null,
      reconnecting: false,
    })
  }

  return {
    ...state,
    close,
  }
}

/**
 * Typed version of useMercure for specific event data types
 *
 * @example
 * ```tsx
 * const { connected, error } = useMercureTyped<Message>({
 *   topics: [`/chat/room/${roomId}`],
 *   token: accessToken,
 *   onMessage: (message) => {
 *     // message is typed as Message
 *     console.log(message.content)
 *   }
 * })
 * ```
 */
export function useMercureTyped<T>(
  options: Omit<MercureOptions, 'onMessage'> & {
    onMessage?: (data: T) => void
  }
) {
  return useMercure({
    ...options,
    onMessage: options.onMessage
      ? (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as T
            options.onMessage!(data)
          } catch (error) {
            console.error('[Mercure] Failed to parse message:', error)
          }
        }
      : undefined,
  })
}
