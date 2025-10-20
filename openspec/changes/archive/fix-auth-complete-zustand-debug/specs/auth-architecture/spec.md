# Authentication Architecture - Spec Delta

## ADDED Requirements

### Requirement: Zustand Auth Store
The system SHALL implement a Zustand-based authentication store for client-side state management with localStorage persistence.

#### Scenario: Store initialization with SSR-safe hydration
- **WHEN** application loads in browser
- **THEN** Zustand store SHALL initialize with `skipHydration: true` for SSR safety
- **AND** store SHALL attempt to restore state from localStorage key `"auth-store"`
- **AND** Date objects SHALL be deserialized from ISO strings

#### Scenario: Login action updates store
- **WHEN** `login(tokens)` is called with `{ access_token, refresh_token, expires_in }`
- **THEN** store SHALL set:
  - `isAuthenticated = true`
  - `accessToken = tokens.access_token`
  - `refreshToken = tokens.refresh_token`
  - `tokenTtl = tokens.expires_in`
  - `tokenExpiry = new Date(Date.now() + expires_in * 1000)`
  - `refreshTokenExpiry = new Date(Date.now() + 7 days)` (default)
- **AND** state SHALL persist to localStorage

#### Scenario: Update tokens action (for refresh)
- **WHEN** `updateTokens(tokens)` is called after token refresh
- **THEN** store SHALL update `accessToken`, `refreshToken`, `tokenTtl`, `tokenExpiry`, `refreshTokenExpiry`
- **AND** `isAuthenticated` SHALL remain `true`
- **AND** `user` data SHALL remain unchanged

#### Scenario: Logout action clears state
- **WHEN** `logout()` is called
- **THEN** all auth state SHALL be reset to null/false
- **AND** localStorage SHALL be cleared for key `"auth-store"`

#### Scenario: Selector hooks for components
- **WHEN** component calls `useIsAuthenticated()`
- **THEN** hook SHALL return current `isAuthenticated` boolean
- **AND** component SHALL re-render only when that specific value changes (not entire store)

### Requirement: AuthProvider Server-to-Client Synchronization
The system SHALL provide an AuthProvider component that synchronizes server-side auth data to client-side Zustand store.

#### Scenario: Initial auth data from server
- **WHEN** AuthProvider mounts with `initialAuth` prop from `checkAuth()`
- **THEN** provider SHALL check if `initialAuth.isAuthenticated === true`
- **AND** IF authenticated, SHALL call `updateUser(initialAuth.user)`
- **AND** SHALL call `setTokenExpiry(initialAuth.tokenExpiry)`
- **AND** IF not already authenticated in store, SHALL call `loginWithExpiry()`

#### Scenario: Auto-refresh hook activation
- **WHEN** AuthProvider renders
- **THEN** SHALL call `useAutoRefresh()` hook to activate proactive token refresh

#### Scenario: No server auth data
- **WHEN** AuthProvider mounts with `initialAuth = null`
- **THEN** provider SHALL NOT update store
- **AND** user remains unauthenticated

### Requirement: Server-Side Auth Check (checkAuth)
The system SHALL provide a server-side `checkAuth()` function for SSR-compatible auth initialization.

#### Scenario: Authenticated user with valid cookies
- **WHEN** `checkAuth()` is called on server AND valid `access_token` + `refresh_token` cookies exist
- **THEN** function SHALL call backend `/api/auth/me` endpoint
- **AND** SHALL return object:
  ```typescript
  {
    isAuthenticated: true,
    user: { userId: string, username: string, role: string },
    tokenTtl: number,
    tokenExpiry: Date
  }
  ```
- **AND** `tokenExpiry` SHALL be calculated from API's `expires_in` response

#### Scenario: No auth cookies present
- **WHEN** `checkAuth()` is called AND no cookies exist
- **THEN** function SHALL return `null`
- **AND** SHALL NOT call backend API

#### Scenario: Expired token with valid refresh token
- **WHEN** `checkAuth()` is called AND access token is expired BUT refresh token is valid
- **THEN** function SHALL attempt server-side token refresh
- **AND** IF refresh succeeds, SHALL return auth data with new expiry
- **AND** IF refresh fails, SHALL return minimal auth object for client-side refresh

### Requirement: QueryProvider with Intelligent Retry Logic
The TanStack Query client SHALL be configured with intelligent retry strategies.

#### Scenario: 404 not found errors
- **WHEN** API call returns 404 status
- **THEN** QueryClient SHALL NOT retry request
- **AND** SHALL return error immediately

#### Scenario: 403 forbidden errors
- **WHEN** API call returns 403 status
- **THEN** QueryClient SHALL NOT retry request
- **AND** SHALL return error immediately

#### Scenario: 5xx server errors
- **WHEN** API call returns status >= 500
- **THEN** QueryClient SHALL retry up to 3 times
- **AND** SHALL use exponential backoff with delays: 1s, 2s, 4s (capped at 30s)

#### Scenario: Other errors with single retry
- **WHEN** API call returns other error status
- **THEN** QueryClient SHALL retry once
- **AND** SHALL use 1s delay before retry

### Requirement: Layout Integration with Providers
The root layout SHALL integrate all authentication providers in correct order.

#### Scenario: Provider nesting order
- **WHEN** root layout renders
- **THEN** providers SHALL be nested as:
  ```tsx
  <QueryProvider>
    <AuthProvider initialAuth={initialAuthData}>
      <AuthGuard>{children}</AuthGuard>
      <AuthDebug />
    </AuthProvider>
  </QueryProvider>
  ```
- **AND** `initialAuthData` SHALL be fetched via `await checkAuth()`

#### Scenario: SSR auth data passing
- **WHEN** layout executes on server
- **THEN** `checkAuth()` SHALL run server-side
- **AND** result SHALL be passed as `initialAuth` prop to client component AuthProvider
- **AND** NO hydration mismatch SHALL occur

## MODIFIED Requirements

None - this is a new capability being added.

## REMOVED Requirements

None - existing functionality is preserved and enhanced.
