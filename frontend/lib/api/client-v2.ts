/**
 * Client-side API client for V2 endpoints (Client Components)
 * Uses document.cookie for authentication
 */

'use client'

const PROXY_BASE = '/api/proxy'

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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  }

  const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${PROXY_BASE}${sanitizedEndpoint}`

  const fetchOptions: RequestInit = {
    method,
    headers,
    // ✅ CRITICAL FIX: Disable HTTP cache for messages to always get fresh data
    // This ensures that when user navigates to /marketplace-chat, latest messages are fetched
    cache: endpoint.includes('/messages') ? 'no-store' : 'default',
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
