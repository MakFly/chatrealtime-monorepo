export type User = {
  id: number
  email: string
  name: string | null
  picture: string | null
}

export type Session = {
  user: User
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
