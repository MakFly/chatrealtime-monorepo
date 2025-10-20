# Authentication Debug Panel - Spec Delta

## ADDED Requirements

### Requirement: Real-Time Auth Status Visualization
The system SHALL provide an AuthDebug component that displays real-time authentication status in development mode only.

#### Scenario: Development mode visibility
- **WHEN** `NODE_ENV === 'development'`
- **THEN** AuthDebug component SHALL render as floating panel
- **AND** component SHALL be visible in bottom-right corner
- **AND** WHEN `NODE_ENV === 'production'`
- **THEN** component SHALL return `null` (not rendered)

#### Scenario: Live status updates every second
- **WHEN** AuthDebug is mounted
- **THEN** component SHALL update current time every 1000ms using `setInterval`
- **AND** SHALL recalculate all time-based values (time remaining, next refresh)
- **AND** SHALL cleanup interval on unmount

### Requirement: Authentication Status Display
The component SHALL display current authentication status with visual indicators.

#### Scenario: Authenticated status with green indicator
- **WHEN** user is authenticated (`isAuthenticated === true` from Zustand store)
- **THEN** SHALL display "Authenticated" in green color
- **AND** SHALL show green pulse indicator dot

#### Scenario: Not authenticated status with red indicator
- **WHEN** user is not authenticated (`isAuthenticated === false`)
- **THEN** SHALL display "Not Authenticated" in red color
- **AND** SHALL show red indicator dot

### Requirement: User Information Display
The component SHALL display current user data from Zustand store.

#### Scenario: User data with sync button
- **WHEN** user data exists in store
- **THEN** SHALL display:
  - User ID (monospace font)
  - Username (monospace font)
  - Role (monospace font)
- **AND** SHALL show refresh button that calls `syncUserFromApi()` when clicked

### Requirement: Access Token Expiry Countdown
The component SHALL display access token expiry information with live countdown.

#### Scenario: Valid token with time remaining
- **WHEN** `tokenExpiry` exists in store AND not expired
- **THEN** SHALL display "Valid" badge in green
- **AND** SHALL show expiry time: `HH:MM:SS`
- **AND** SHALL show countdown: `Xm Ys` format (minutes and seconds)
- **AND** SHALL update countdown every second

#### Scenario: Token expiring soon (< 5 minutes)
- **WHEN** time remaining <= 300 seconds
- **THEN** countdown text SHALL be yellow color
- **AND** SHALL show warning indicator

#### Scenario: Token critically expiring (< 1 minute)
- **WHEN** time remaining <= 60 seconds
- **THEN** countdown text SHALL be red color
- **AND** SHALL show "Token expiring soon!" message with pulsing red dot
- **AND** SHALL display in warning banner

#### Scenario: Expired token
- **WHEN** `Date.now() > tokenExpiry`
- **THEN** SHALL display "Expired" badge in red
- **AND** SHALL show countdown as "0s"

### Requirement: Auto-Refresh Timing Display
The component SHALL calculate and display when the next automatic token refresh will occur.

#### Scenario: Next refresh countdown calculation
- **WHEN** token is valid AND authenticated
- **THEN** SHALL calculate `msUntilExpiry = tokenExpiry - currentTime`
- **AND** SHALL calculate `dynamicLead = Math.max(120000, Math.min(300000, Math.floor(msUntilExpiry * 0.6)))`
- **AND** SHALL calculate `nextRefreshIn = Math.max(0, Math.floor((msUntilExpiry - dynamicLead) / 1000))`
- **AND** SHALL display: "Auto-refresh in: Xm Ys"

#### Scenario: Auto-refresh imminent indicator (< 30 seconds)
- **WHEN** `nextRefreshIn <= 30` seconds
- **THEN** text SHALL be orange color
- **AND** SHALL show "Auto-refresh imminent" message with pulsing orange dot

#### Scenario: Auto-refresh very soon (< 15 seconds)
- **WHEN** `nextRefreshIn <= 15` seconds
- **THEN** SHALL show live banner: "Auto-refresh imminent" with pulsing indicator

#### Scenario: Next refresh timestamp display
- **WHEN** auto-refresh is scheduled
- **THEN** SHALL display "Next refresh: HH:MM:SS" (exact time)
- **AND** timestamp SHALL be in blue color

### Requirement: Refresh Token Information
The component SHALL display refresh token expiry with long-term countdown.

#### Scenario: Refresh token valid with days remaining
- **WHEN** `refreshTokenExpiry` exists AND not expired
- **THEN** SHALL display "Valid" badge in green
- **AND** SHALL show expiry: full date and time
- **AND** SHALL show countdown: "Xd Yh Zm" format (days, hours, minutes)

#### Scenario: Refresh token expiring soon (< 24 hours)
- **WHEN** refresh token time remaining <= 86400 seconds
- **THEN** countdown SHALL be yellow color
- **AND** SHALL show warning: "⚠️ Expires in less than 24h"

#### Scenario: Refresh token security information
- **WHEN** displaying refresh token section
- **THEN** SHALL show informational panel with:
  - "🔒 Token secured in HTTP-only cookie"
  - "✓ Not accessible via JavaScript"
  - "✓ Protected from XSS attacks"

### Requirement: Compact and Modal Display Modes
The component SHALL support both compact floating panel and full-screen modal views.

#### Scenario: Compact floating panel toggle
- **WHEN** user clicks panel header
- **THEN** panel SHALL expand/collapse to show/hide detailed info
- **AND** SHALL show Eye icon when collapsed, EyeOff when expanded

#### Scenario: Modal view activation
- **WHEN** user clicks maximize button in compact panel
- **THEN** SHALL open full-screen modal overlay
- **AND** modal SHALL show same information with larger layout
- **AND** modal SHALL have close button (X)

#### Scenario: Modal closes on X button
- **WHEN** user clicks X button in modal
- **THEN** modal SHALL close
- **AND** compact panel SHALL remain visible

### Requirement: Cookie Security Information
The component SHALL display cookie security status based on environment.

#### Scenario: Development cookie status
- **WHEN** in development mode
- **THEN** SHALL display:
  - "Location: HTTP-only cookie (secure)"
  - "Type: JWT (not exposed for security)"
- **AND** SHALL note cookies are inspectable in DevTools

#### Scenario: Live update indicators
- **WHEN** component is rendering
- **THEN** SHALL show green pulsing dot with "Live updates" text
- **AND** SHALL update "Current time: HH:MM:SS" every second

## MODIFIED Requirements

None - this is entirely new functionality.

## REMOVED Requirements

None - no existing debug functionality to remove.
