/**
 * Client-side API client for V2 endpoints (Client Components)
 * Uses document.cookie for authentication
 */

'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
const API_URL = `${API_BASE_URL}/api` // No version suffix for V2

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiResponse<T> = {
  data: T | null
  status: number
  headers: Headers
  error?: {
    message: string
    status: number
  }
}

type RequestOptions = {
  headers?: HeadersInit
  token?: string | null
}

/**
 * Get access token from cookies (client-side)
 */
function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const tokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith('access_token=')
  )

  if (!tokenCookie) return null

  return tokenCookie.split('=')[1]
}

/**
 * Generic client API request function for V2
 */
async function clientRequestV2<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  // Use token from options first, fallback to cookie token
  const token = options?.token ?? getAccessToken()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`

  const fetchOptions: RequestInit = {
    method,
    headers,
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const errorText = await response.text()
      return {
        data: null as T,
        status: response.status,
        headers: response.headers,
        error: {
          message: errorText || response.statusText,
          status: response.status,
        },
      }
    }

    const data = await response.json()

    return {
      data,
      status: response.status,
      headers: response.headers,
    }
  } catch (error) {
    console.error('API V2 Request failed:', {
      url,
      method,
      error,
    })
    throw error
  }
}

/**
 * Client-side GET request for V2
 */
export async function clientGetV2<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return clientRequestV2<T>('GET', endpoint, undefined, options)
}

/**
 * Client-side POST request for V2
 */
export async function clientPostV2<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return clientRequestV2<T>('POST', endpoint, body, options)
}

/**
 * Client-side PUT request for V2
 */
export async function clientPutV2<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return clientRequestV2<T>('PUT', endpoint, body, options)
}

/**
 * Client-side PATCH request for V2
 */
export async function clientPatchV2<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return clientRequestV2<T>('PATCH', endpoint, body, options)
}

/**
 * Client-side DELETE request for V2
 */
export async function clientDeleteV2<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return clientRequestV2<T>('DELETE', endpoint, undefined, options)
}
