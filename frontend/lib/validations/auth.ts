import { z } from 'zod'

/**
 * Validation schema for user login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Validation schema for user registration
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().optional(),
})

export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Validation schema for API auth response
 */
export const authResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  user: z.object({
    id: z.number(),
    email: z.string().email(),
    name: z.string().nullable(),
    picture: z.string().nullable(),
  }),
})

export type AuthResponseData = z.infer<typeof authResponseSchema>

/**
 * Validation schema for auth status response
 */
export const authStatusSchema = z.object({
  auth_methods: z.object({
    email_password: z.boolean(),
    google_sso: z.boolean(),
  }),
  api_version: z.string(),
})

export type AuthStatusData = z.infer<typeof authStatusSchema>
