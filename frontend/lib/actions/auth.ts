'use server'

import { redirect } from 'next/navigation'
import { setSession, clearSession } from '@/lib/auth'
import { loginSchema, registerSchema } from '@/lib/validations/auth'
import type { AuthResponse } from '@/types/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost'
const API_PREFIX = '/api/v1'

/**
 * Server action for user login
 */
export async function loginAction(formData: FormData) {
  const rawFormData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  // Validate form data
  const validationResult = loginSchema.safeParse(rawFormData)

  if (!validationResult.success) {
    return {
      error: 'Invalid form data',
      fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email, password } = validationResult.data

  try {
    // Call the login API
    const response = await fetch(`${API_URL}${API_PREFIX}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 401) {
        return {
          error: 'Invalid email or password. Please try again.',
        }
      }

      if (response.status === 403) {
        return {
          error: 'This account was created using Google Sign-In. Please use Google to login.',
        }
      }

      return {
        error: errorData.message || 'Login failed. Please try again.',
      }
    }

    const authData: AuthResponse = await response.json()

    // Store session in secure HTTP-only cookies
    await setSession(
      authData.access_token,
      authData.refresh_token,
      authData.user,
      authData.expires_in
    )
  } catch (error) {
    console.error('Login error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }

  // Redirect to dashboard or requested page
  const redirectTo = formData.get('redirect') as string | null
  redirect(redirectTo || '/dashboard')
}

/**
 * Server action for user registration
 */
export async function registerAction(formData: FormData) {
  const rawFormData = {
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name') || undefined,
  }

  // Validate form data
  const validationResult = registerSchema.safeParse(rawFormData)

  if (!validationResult.success) {
    return {
      error: 'Invalid form data',
      fieldErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email, password, name } = validationResult.data

  try {
    // Call the register API
    const response = await fetch(`${API_URL}${API_PREFIX}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))

      if (response.status === 409) {
        return {
          error: 'An account with this email already exists.',
        }
      }

      if (response.status === 400) {
        return {
          error: errorData.message || 'Invalid registration data.',
        }
      }

      return {
        error: errorData.message || 'Registration failed. Please try again.',
      }
    }

    const authData: AuthResponse = await response.json()

    // Store session in secure HTTP-only cookies
    await setSession(
      authData.access_token,
      authData.refresh_token,
      authData.user,
      authData.expires_in
    )
  } catch (error) {
    console.error('Registration error:', error)
    return {
      error: 'An unexpected error occurred. Please try again.',
    }
  }

  // Redirect to dashboard after successful registration
  redirect('/dashboard')
}

/**
 * Server action for user logout
 */
export async function logoutAction() {
  try {
    // Call the logout API to invalidate refresh token on backend
    // We ignore errors here since we'll clear the session anyway
    await fetch(`${API_URL}${API_PREFIX}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(() => {
      // Ignore errors - we'll clear the session regardless
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always clear the session cookies
    await clearSession()
  }

  // Redirect to login page
  redirect('/login')
}

/**
 * Server action to handle Google OAuth callback tokens
 */
export async function handleGoogleCallbackAction(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
) {
  try {
    // Fetch user profile using the access token
    const response = await fetch(`${API_URL}${API_PREFIX}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return {
        error: 'Failed to fetch user profile',
      }
    }

    const user = await response.json()

    // Store session
    await setSession(accessToken, refreshToken, user, expiresIn)
  } catch (error) {
    console.error('Google callback error:', error)
    return {
      error: 'An unexpected error occurred during Google sign-in.',
    }
  }

  // Redirect to dashboard
  redirect('/dashboard')
}
