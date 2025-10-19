import { getSession, setSession, clearSession } from '@/lib/auth'
import type { AuthResponse } from '@/types/auth'

/**
 * API configuration
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost'
const API_PREFIX = '/api/v1'

// For development: Allow self-signed certificates (server-side only)
// This is safe because it only affects server-to-server communication
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${API_PREFIX}${endpoint}`

  // Get current session for authentication
  const session = await getSession()

  // Prepare headers as a Record to allow dynamic assignment
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Merge with provided headers
  if (options.headers) {
    const providedHeaders = new Headers(options.headers)
    providedHeaders.forEach((value, key) => {
      headers[key] = value
    })
  }

  // Add Authorization header if we have an access token
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`
  }

  // Make the request
  let response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle token refresh on 401 Unauthorized
  if (response.status === 401 && session?.refreshToken) {
    console.log('Access token expired, attempting refresh...')

    try {
      // Attempt to refresh the token
      const refreshResponse = await fetch(`${API_URL}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: session.refreshToken,
        }),
      })

      if (refreshResponse.ok) {
        const authData: AuthResponse = await refreshResponse.json()

        // Update session with new tokens
        await setSession(
          authData.access_token,
          authData.refresh_token,
          authData.expires_in
        )

        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${authData.access_token}`
        response = await fetch(url, {
          ...options,
          headers,
        })
      } else {
        // Refresh failed, clear session
        console.error('Token refresh failed, clearing session')
        await clearSession()
        throw new ApiError('Session expired, please login again', 401)
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      await clearSession()
      throw new ApiError('Session expired, please login again', 401)
    }
  }

  // Handle error responses
  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`
    let errorData: unknown = null

    try {
      errorData = await response.json()
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = String(errorData.message)
      } else if (errorData && typeof errorData === 'object' && 'error' in errorData) {
        errorMessage = String(errorData.error)
      }
    } catch {
      // Response body is not JSON
    }

    throw new ApiError(errorMessage, response.status, errorData)
  }

  // Parse and return JSON response
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }

  // Return empty object for non-JSON responses (e.g., 204 No Content)
  return {} as T
}

/**
 * Convenience method for GET requests
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, { method: 'GET' })
}

/**
 * Convenience method for POST requests
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete<T = unknown>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, { method: 'DELETE' })
}
