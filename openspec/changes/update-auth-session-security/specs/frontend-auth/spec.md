## ADDED Requirements
### Requirement: Cookie Status API Route
The frontend MUST expose an API route that reports authentication cookie validity aligned with backend token TTL.

#### Scenario: Status route reports valid cookie
- **GIVEN** auth cookies exist and are not expired relative to the access token TTL
- **WHEN** `/api/auth/status` is called
- **THEN** the response indicates the session is valid and returns the remaining lifetime in seconds

#### Scenario: Status route detects expired cookie
- **GIVEN** auth cookies are missing or expired
- **WHEN** `/api/auth/status` is called
- **THEN** the response indicates the session is invalid and instructs the client to reauthenticate

### Requirement: Cookie TTL Synchronization
Frontend cookie helpers MUST set access token cookie expiration to the backend-provided TTL and refresh token persistence based on configuration.

#### Scenario: Session cookies mirror TTL
- **GIVEN** the login flow receives `expires_in` from the API
- **WHEN** cookies are created or refreshed
- **THEN** the access token cookie `maxAge` and expiry equals `expires_in`, and the refresh token cookie adopts the configured refresh TTL

### Requirement: Quick Login Demonstration
A demo flow MUST showcase issuing a 20-second access cookie with automatic refresh to illustrate the lifecycle.

#### Scenario: Demo login issues short-lived cookie
- **GIVEN** demo credentials configured for quick login
- **WHEN** the demo action/page is used
- **THEN** the access cookie expires after ~20 seconds and the UI demonstrates automatic refresh behavior
