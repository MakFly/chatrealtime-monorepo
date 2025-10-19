export type User = {
  id: string // UUID from Symfony
  email: string
  name: string | null
  picture: string | null
  roles: string[] // Retrieved from /api/v1/user/me endpoint
  created_at: string | null // ISO 8601 format
  has_google_account: boolean
}

export type Session = {
  accessToken: string
  refreshToken: string
  expiresAt: number // Timestamp in milliseconds
}

export type AuthResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number // In seconds
  user: User
}

export type AuthStatus = {
  auth_methods: {
    email_password: boolean
    google_sso: boolean
  }
  api_version: string
}
