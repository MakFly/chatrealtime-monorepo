/**
 * Server-side API client for Next.js Server Components and Server Actions
 * Uses cookies() from next/headers for authentication
 */

import { cookies } from 'next/headers'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost'
const API_URL = `${API_BASE_URL}/api/v1`

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type ApiResponse<T> = {
  data: T
  status: number
  headers: Headers
}

type RequestOptions = {
  headers?: HeadersInit
  next?: NextFetchRequestConfig
  cache?: RequestCache
}

/**
 * Generic server API request function
 */
async function serverRequest<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options?.headers,
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`

  const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers,
    next: options?.next,
    cache: options?.cache,
  }

  if (body) {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `API Error (${response.status}): ${errorText || response.statusText}`
    )
  }

  const data = await response.json()

  return {
    data,
    status: response.status,
    headers: response.headers,
  }
}

/**
 * Server-side GET request
 */
export async function serverGet<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return serverRequest<T>('GET', endpoint, undefined, options)
}

/**
 * Server-side POST request
 */
export async function serverPost<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return serverRequest<T>('POST', endpoint, body, options)
}

/**
 * Server-side PUT request
 */
export async function serverPut<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return serverRequest<T>('PUT', endpoint, body, options)
}

/**
 * Server-side PATCH request
 */
export async function serverPatch<T>(
  endpoint: string,
  body?: unknown,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return serverRequest<T>('PATCH', endpoint, body, options)
}

/**
 * Server-side DELETE request
 */
export async function serverDelete<T>(
  endpoint: string,
  options?: RequestOptions
): Promise<ApiResponse<T>> {
  return serverRequest<T>('DELETE', endpoint, undefined, options)
}
