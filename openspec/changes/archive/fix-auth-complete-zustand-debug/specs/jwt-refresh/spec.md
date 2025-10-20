# JWT Refresh Token - Spec Delta

## MODIFIED Requirements

### Requirement: Auto-Refresh Hook with Zustand Store Integration
The auto-refresh hook SHALL read token expiry from Zustand store and update store after successful refresh.

#### Scenario: Read token expiry from Zustand store
- **WHEN** `useAutoRefresh()` hook executes
- **THEN** SHALL call `useAuthStore()` to get `isAuthenticated`, `tokenExpiry`
- **AND** IF `!isAuthenticated` OR `!tokenExpiry`, SHALL skip scheduling
- **AND** IF `tokenExpiry` exists, SHALL calculate `msUntilExpiry = tokenExpiry - Date.now()`

#### Scenario: Calculate refresh delay (60% of TTL)
- **WHEN** token expiry is available AND token not expired
- **THEN** SHALL calculate `dynamicLead = Math.max(120000, Math.min(300000, Math.floor(msUntilExpiry * 0.6)))`
- **AND** SHALL calculate `refreshDelay = Math.max(800, msUntilExpiry - dynamicLead)`
- **AND** SHALL schedule refresh with `setTimeout(performRefresh, refreshDelay)`

#### Scenario: Successful token refresh updates Zustand store
- **WHEN** proactive refresh succeeds AND receives normalized response
- **THEN** SHALL extract `access.expires_in` from response
- **AND** SHALL call `updateTokens({ access_token: "present", refresh_token: "present", expires_in })`
- **AND** Zustand store SHALL update `tokenExpiry` to new date
- **AND** SHALL trigger re-scheduling with new expiry

#### Scenario: Failed refresh does not crash
- **WHEN** refresh API call fails with 401 or 500
- **THEN** hook SHALL log warning to console
- **AND** SHALL NOT call `logout()` automatically
- **AND** SHALL NOT retry infinitely
- **AND** SHALL let next API call trigger full auth flow

### Requirement: Normalized Refresh API Response
The `/api/auth/refresh` route SHALL return normalized response structure.

#### Scenario: Successful refresh returns nested format
- **WHEN** client calls POST `/api/auth/refresh` with valid refresh token in cookies
- **THEN** response SHALL be:
  ```json
  {
    "success": true,
    "message": "Token refreshed successfully",
    "access": { "token": "...", "expires_in": 3600 },
    "refresh": { "token": "...", "expires_in": 604800 }
  }
  ```
- **AND** cookies SHALL be set with new tokens
- **AND** response status SHALL be 200

#### Scenario: Missing refresh token returns error
- **WHEN** no `refresh_token` cookie exists
- **THEN** response SHALL be `{ "error": "No refresh token available", "code": "NO_REFRESH_TOKEN" }`
- **AND** status SHALL be 401
- **AND** NO cookies SHALL be modified

### Requirement: Cookie Configuration for Development
Session cookies SHALL use development-friendly settings in non-production environments.

#### Scenario: Development cookie configuration
- **WHEN** `NODE_ENV !== 'production'` AND session is created/updated
- **THEN** cookies SHALL be set with:
  - `httpOnly: false` (allows DevTools inspection)
  - `secure: false` (works without HTTPS)
  - `sameSite: 'lax'` (allows cross-origin)
  - `domain: 'localhost'` (explicit domain)
  - `path: '/'`

#### Scenario: Production cookie configuration
- **WHEN** `NODE_ENV === 'production'` AND session is created/updated
- **THEN** cookies SHALL be set with:
  - `httpOnly: true` (XSS protection)
  - `secure: true` (HTTPS only)
  - `sameSite: 'lax'`
  - `domain: undefined` (inferred from request)
  - `path: '/'`

#### Scenario: Cookie operation logging
- **WHEN** `setSession()` sets access token cookie
- **THEN** SHALL log to console: `{ token_length, httpOnly, sameSite, secure, domain, expires }`
- **AND** WHEN refresh token cookie is set
- **THEN** SHALL log similar information

### Requirement: Quick Login with Dev TTL Override
The system SHALL support short-lived tokens for testing refresh flows in development.

#### Scenario: Login with dev_ttl parameter
- **WHEN** user submits login form with hidden field `dev_ttl=30` in development
- **THEN** `setSession()` SHALL use `devTTLOverride = 30` instead of backend's `expires_in`
- **AND** SHALL log: "🧪 DEV MODE - TTL Override: { backend_expires_in, dev_override, effective_ttl }"
- **AND** `token_expires_at` cookie SHALL be set to `Date.now() + 30000`

#### Scenario: Auto-refresh triggers before dev token expiry
- **WHEN** token has 30 second TTL AND 18 seconds have elapsed (60% of 30s)
- **THEN** auto-refresh hook SHALL trigger proactive refresh
- **AND** SHALL log: "🔄 Proactive refresh triggered"
- **AND** SHALL log: "✅ Token refreshed successfully" with new expiry

## ADDED Requirements

### Requirement: Backward Compatibility with Flat Response Format
The auto-refresh hook SHALL handle both legacy flat and new normalized response formats.

#### Scenario: Handle normalized response format
- **WHEN** refresh API returns `{ success: true, access: { expires_in }, refresh: {...} }`
- **THEN** hook SHALL extract `expires_in` from `response.access.expires_in`
- **AND** SHALL update Zustand store with new expiry

#### Scenario: Handle legacy flat response format
- **WHEN** refresh API returns `{ access_token, refresh_token, expires_in }`
- **THEN** hook SHALL extract `expires_in` from `response.expires_in` directly
- **AND** SHALL update Zustand store with new expiry
- **AND** SHALL log warning about legacy format

## REMOVED Requirements

None - existing functionality enhanced with store integration.
