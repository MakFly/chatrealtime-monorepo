/**
 * Shared Mercure Types
 */

export type MercureConnectionState =
  | { status: 'connecting' }
  | { status: 'connected' }
  | { status: 'disconnected'; error?: string }

export type MercureUpdate<T = unknown> = {
  data: T
  id: string
  retry?: number
}
