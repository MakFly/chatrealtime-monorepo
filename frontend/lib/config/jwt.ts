/**
 * JWT Refresh Configuration
 * Based on industry best practices (Auth0, Firebase, Clerk)
 */

export const JWT_CONFIG = {
  /**
   * Refresh threshold in seconds
   * Token will be refreshed this many seconds BEFORE expiration
   *
   * Recommended: 60s for production, 5s for dev (with 20s tokens)
   */
  REFRESH_THRESHOLD: process.env.NODE_ENV === 'development' ? 5 : 60,

  /**
   * Maximum retry attempts for failed API calls
   * After a 401, we refresh token and retry once
   */
  MAX_RETRY_ATTEMPTS: 1,

  /**
   * Visibility check threshold in seconds
   * When tab becomes visible, check token if < this threshold
   */
  VISIBILITY_CHECK_THRESHOLD: 5,

  /**
   * Broadcast channel name for multi-tab sync
   */
  BROADCAST_CHANNEL: 'jwt_refresh_sync',

  /**
   * Timer check interval (fallback polling if timer fails)
   * Only used as safety net, primary mechanism is setTimeout
   */
  TIMER_CHECK_INTERVAL: 10 * 1000, // 10 seconds

  /**
   * Storage keys
   */
  STORAGE_KEYS: {
    LAST_REFRESH: 'jwt_last_refresh',
    TOKEN_EXP: 'jwt_token_exp',
  },
} as const

/**
 * Expected token lifetimes (for validation)
 */
export const TOKEN_LIFETIME = {
  ACCESS_TOKEN: {
    PRODUCTION: 15 * 60, // 15 minutes
    DEVELOPMENT: 20, // 20 seconds (for testing)
  },
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
} as const
