# Google SSO Integration Specification

## ADDED Requirements

### Requirement: Google OAuth Flow Initiation
The system SHALL initiate Google OAuth 2.0 authentication flow when users choose to sign in with Google.

#### Scenario: User initiates Google sign-in
- **WHEN** a user navigates to `/api/auth/google`
- **THEN** the system generates a random CSRF state token
- **AND** stores the state token in the session or cache (valid for 10 minutes)
- **AND** redirects the user to Google's OAuth authorization URL
- **AND** includes client ID, redirect URI, scope (email, profile), and state in the redirect parameters
- **AND** requests offline access to obtain a refresh token from Google

#### Scenario: OAuth scope request
- **WHEN** the system redirects to Google OAuth
- **THEN** the requested scopes include `email` and `profile`
- **AND** the user is shown Google's consent screen requesting these permissions
- **AND** additional scopes can be configured via environment variables if needed

### Requirement: Google OAuth Callback Handling
The system SHALL securely handle the OAuth callback from Google and exchange the authorization code for tokens.

#### Scenario: Successful OAuth callback
- **WHEN** Google redirects back to `/api/auth/google/callback` with an authorization code and state
- **THEN** the system validates the state parameter matches the stored state
- **AND** exchanges the authorization code for access and refresh tokens from Google
- **AND** uses the access token to fetch the user's profile from Google's UserInfo endpoint
- **AND** processes the user profile to create or update the local user account
- **AND** generates JWT tokens for the authenticated user
- **AND** redirects to the frontend callback URL with the JWT tokens as query parameters

#### Scenario: State mismatch rejection
- **WHEN** Google redirects back to `/api/auth/google/callback` with a state that doesn't match the stored state
- **THEN** the system returns HTTP 403 Forbidden
- **AND** includes an error message "Invalid state parameter - possible CSRF attack"
- **AND** does not proceed with authentication

#### Scenario: Authorization code exchange failure
- **WHEN** the system attempts to exchange the authorization code for tokens but Google returns an error
- **THEN** the system logs the error details
- **AND** returns HTTP 502 Bad Gateway
- **AND** includes an error message "Failed to authenticate with Google"

### Requirement: User Provisioning from Google
The system SHALL automatically create or update user accounts based on Google profile data.

#### Scenario: New user creation
- **WHEN** a user authenticates with Google for the first time (email not in database)
- **THEN** the system creates a new User entity
- **AND** sets the email from Google profile
- **AND** sets the googleId from Google profile
- **AND** sets the name from Google profile
- **AND** sets the picture URL from Google profile
- **AND** leaves the password field as null (Google-only authentication)
- **AND** assigns default ROLE_USER role
- **AND** stores Google access token and refresh token for future API calls
- **AND** persists the user to the database

#### Scenario: Existing user Google account linking
- **WHEN** a user authenticates with Google and the email exists in the database but googleId is null
- **THEN** the system updates the existing user entity
- **AND** sets the googleId to link the Google account
- **AND** updates the name and picture from Google profile
- **AND** stores Google access token and refresh token
- **AND** generates JWT tokens for the linked account

#### Scenario: Existing Google user login
- **WHEN** a user authenticates with Google and both email and googleId match an existing user
- **THEN** the system updates the user's Google tokens
- **AND** refreshes the name and picture from Google profile
- **AND** updates the updatedAt timestamp
- **AND** generates new JWT tokens

#### Scenario: Google ID mismatch protection
- **WHEN** a user authenticates with Google and the email exists but is linked to a different googleId
- **THEN** the system returns HTTP 409 Conflict
- **AND** includes an error message "This email is already linked to a different Google account"
- **AND** does not create or modify any user account
- **AND** logs the security event for investigation

### Requirement: Google Profile Data Synchronization
The system SHALL keep user profile data synchronized with Google on each login.

#### Scenario: Profile data update on login
- **WHEN** an existing Google user authenticates
- **THEN** the system fetches the latest profile data from Google
- **AND** updates the user's name if it has changed
- **AND** updates the user's picture URL if it has changed
- **AND** updates the user's email if it has changed (rare, but possible)
- **AND** persists the changes to the database

#### Scenario: Handle missing profile data
- **WHEN** Google profile is missing optional fields (e.g., picture)
- **THEN** the system stores null for missing fields
- **AND** does not fail the authentication process
- **AND** uses default values in the UI (e.g., default avatar)

### Requirement: Google Token Storage
The system SHALL securely store Google OAuth tokens for potential future Google API calls.

#### Scenario: Store Google tokens
- **WHEN** the system receives Google OAuth tokens (access and refresh)
- **THEN** the tokens are stored in the User entity fields `googleAccessToken` and `googleRefreshToken`
- **AND** tokens are encrypted at rest if database encryption is enabled (optional enhancement)
- **AND** tokens are not included in API responses to protect confidentiality

#### Scenario: Token refresh for Google API calls
- **WHEN** the application needs to make Google API calls on behalf of the user (future feature)
- **THEN** the system can use the stored googleAccessToken
- **AND** can refresh the token using googleRefreshToken if expired
- **AND** updates the stored tokens after refresh

### Requirement: OAuth Error Handling
The system SHALL gracefully handle errors during the Google OAuth flow.

#### Scenario: User denies consent
- **WHEN** the user clicks "Cancel" on Google's consent screen
- **THEN** Google redirects to the callback with an error parameter
- **AND** the system detects the error (e.g., `access_denied`)
- **AND** redirects the user to the frontend login page
- **AND** includes an error message "Authentication cancelled by user"

#### Scenario: Google service unavailable
- **WHEN** Google OAuth service is temporarily unavailable
- **THEN** the system returns HTTP 503 Service Unavailable
- **AND** includes an error message "Google authentication is temporarily unavailable"
- **AND** logs the error for monitoring

### Requirement: Google OAuth Configuration
The system SHALL be configurable via environment variables for different environments.

#### Scenario: OAuth client configuration
- **WHEN** the system is deployed
- **THEN** the Google OAuth client ID is read from `GOOGLE_CLIENT_ID` environment variable
- **AND** the Google OAuth client secret is read from `GOOGLE_CLIENT_SECRET` environment variable
- **AND** the OAuth redirect URI is read from `GOOGLE_REDIRECT_URI` environment variable
- **AND** the system fails to start if these required variables are missing

#### Scenario: Multiple environment support
- **WHEN** the application runs in different environments (dev, staging, production)
- **THEN** each environment can have its own Google OAuth client credentials
- **AND** redirect URIs are configured to match the environment's frontend URL
- **AND** development can use localhost redirect URIs

### Requirement: Frontend OAuth Integration
The system SHALL provide endpoints compatible with Next.js frontend OAuth flow.

#### Scenario: Frontend-initiated OAuth flow
- **WHEN** the Next.js frontend wants to initiate Google sign-in
- **THEN** the frontend redirects the user to `/api/auth/google`
- **AND** can optionally include a `returnTo` query parameter with the destination URL
- **AND** the backend preserves the `returnTo` URL through the OAuth flow
- **AND** redirects to the `returnTo` URL after successful authentication with tokens

#### Scenario: Token delivery to frontend
- **WHEN** OAuth flow completes successfully
- **THEN** the backend redirects to the frontend callback URL (e.g., `https://app.example.com/auth/callback`)
- **AND** includes the access_token and refresh_token as URL fragments (hash) for security
- **AND** the frontend extracts tokens from the URL and stores them securely
- **AND** the tokens are immediately removed from the URL to prevent leakage

### Requirement: Security Best Practices
The system SHALL follow OAuth 2.0 security best practices for Google SSO integration.

#### Scenario: HTTPS enforcement
- **WHEN** the application runs in production
- **THEN** all OAuth redirect URIs use HTTPS
- **AND** HTTP redirect URIs are rejected by Google
- **AND** the application enforces HTTPS for callback endpoints

#### Scenario: State parameter entropy
- **WHEN** generating OAuth state tokens
- **THEN** the state token is at least 32 characters of cryptographically secure random data
- **AND** the state token is unique for each OAuth flow
- **AND** the state token expires after 10 minutes

#### Scenario: Redirect URI validation
- **WHEN** configuring Google OAuth client in Google Cloud Console
- **THEN** only legitimate frontend and backend URIs are whitelisted
- **AND** wildcard redirect URIs are not used
- **AND** the system validates the redirect URI matches configuration before initiating OAuth

### Requirement: Account Unlinking
The system SHALL allow users to unlink their Google account if they have set a password.

#### Scenario: Successful Google account unlinking
- **WHEN** an authenticated user with both password and Google account requests to unlink Google
- **THEN** the system sets `googleId`, `googleAccessToken`, `googleRefreshToken` to null
- **AND** keeps the email, name, and picture (user choice)
- **AND** the user can still login with email/password
- **AND** returns HTTP 200 OK with confirmation message

#### Scenario: Prevent unlinking without alternative authentication
- **WHEN** a user with only Google authentication (no password) attempts to unlink Google
- **THEN** the system returns HTTP 400 Bad Request
- **AND** includes an error message "Cannot unlink Google account without setting a password first"
- **AND** does not modify the user account
