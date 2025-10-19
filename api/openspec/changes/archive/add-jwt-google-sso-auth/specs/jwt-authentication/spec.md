# JWT Authentication Specification

## ADDED Requirements

### Requirement: JWT Token Generation
The system SHALL generate JWT access tokens using RS256 algorithm when users successfully authenticate.

#### Scenario: Successful email/password login
- **WHEN** a user provides valid email and password to `/api/auth/login`
- **THEN** the system generates an access token with 1-hour expiration
- **AND** includes user ID, email, and roles in the token payload
- **AND** signs the token with the RS256 private key
- **AND** returns the access token in the response

#### Scenario: Token payload structure
- **WHEN** an access token is generated
- **THEN** the token payload includes `user_id`, `email`, `roles`, `iat` (issued at), `exp` (expiration), `iss` (issuer), and `aud` (audience) claims
- **AND** the `exp` claim is set to 1 hour from `iat`
- **AND** the `iss` claim matches the configured issuer
- **AND** the `aud` claim matches the configured audience

### Requirement: JWT Token Validation
The system SHALL validate JWT tokens on every request to protected endpoints.

#### Scenario: Valid token authentication
- **WHEN** a request includes a valid Bearer token in the Authorization header
- **THEN** the system validates the token signature using the RS256 public key
- **AND** checks the token expiration is in the future
- **AND** verifies the issuer and audience claims match configuration
- **AND** loads the user from the `user_id` claim
- **AND** grants access to the protected resource

#### Scenario: Expired token rejection
- **WHEN** a request includes an expired Bearer token
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes an error message "Token has expired"
- **AND** does not grant access to the resource

#### Scenario: Invalid signature rejection
- **WHEN** a request includes a token with an invalid signature
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes an error message "Invalid token signature"
- **AND** does not grant access to the resource

#### Scenario: Missing token rejection
- **WHEN** a request to a protected endpoint does not include an Authorization header
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes an error message "Missing authentication token"

### Requirement: Refresh Token Generation
The system SHALL generate refresh tokens alongside access tokens to enable token renewal.

#### Scenario: Refresh token creation on login
- **WHEN** a user successfully authenticates via email/password or Google SSO
- **THEN** the system generates a cryptographically secure refresh token
- **AND** stores the refresh token in the database with 30-day expiration
- **AND** associates the refresh token with the user
- **AND** returns the refresh token in the response

#### Scenario: Refresh token uniqueness
- **WHEN** a refresh token is generated
- **THEN** the system ensures the token is unique across all users
- **AND** the token is at least 128 characters of random data
- **AND** the token is hashed before storage (optional for added security)

### Requirement: Token Refresh Flow
The system SHALL allow users to obtain new access tokens using valid refresh tokens without re-authenticating.

#### Scenario: Successful token refresh
- **WHEN** a user sends a valid refresh token to `/api/auth/token/refresh`
- **THEN** the system validates the refresh token exists in the database
- **AND** checks the refresh token has not expired
- **AND** generates a new access token for the associated user
- **AND** optionally rotates the refresh token (invalidates old, creates new)
- **AND** returns the new access token (and new refresh token if rotated)

#### Scenario: Expired refresh token rejection
- **WHEN** a user sends an expired refresh token to `/api/auth/token/refresh`
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes an error message "Refresh token has expired"
- **AND** removes the expired token from the database

#### Scenario: Invalid refresh token rejection
- **WHEN** a user sends a refresh token that does not exist in the database
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes an error message "Invalid refresh token"

### Requirement: Token Revocation
The system SHALL allow users to logout by revoking their refresh tokens.

#### Scenario: Successful logout
- **WHEN** an authenticated user sends their refresh token to `/api/auth/logout`
- **THEN** the system removes the refresh token from the database
- **AND** returns HTTP 204 No Content
- **AND** subsequent attempts to use that refresh token fail

#### Scenario: Revoke all user tokens
- **WHEN** an administrator or security system needs to revoke all tokens for a user
- **THEN** the system removes all refresh tokens associated with that user from the database
- **AND** the user must re-authenticate to obtain new tokens

### Requirement: RSA Key Management
The system SHALL use RSA key pairs for JWT signing and verification.

#### Scenario: Key pair generation
- **WHEN** the system is initially configured
- **THEN** a 4096-bit RSA key pair is generated using OpenSSL
- **AND** the private key is stored in `config/jwt/private.pem`
- **AND** the public key is stored in `config/jwt/public.pem`
- **AND** the private key is excluded from version control (.gitignore)

#### Scenario: Key pair rotation
- **WHEN** the RSA key pair needs to be rotated for security reasons
- **THEN** the system can generate a new key pair
- **AND** existing tokens remain valid until expiration (backward compatibility)
- **AND** new tokens are signed with the new private key

### Requirement: Authentication Endpoint Security
The system SHALL protect authentication endpoints against abuse.

#### Scenario: Rate limiting on login endpoint
- **WHEN** a client makes more than 5 login attempts within 1 minute from the same IP
- **THEN** the system returns HTTP 429 Too Many Requests
- **AND** includes a Retry-After header with cooldown time
- **AND** logs the rate-limited IP address

#### Scenario: Rate limiting on refresh endpoint
- **WHEN** a client makes more than 10 refresh token requests within 1 minute for the same user
- **THEN** the system returns HTTP 429 Too Many Requests
- **AND** includes a Retry-After header with cooldown time

### Requirement: Automatic Refresh Token Cleanup
The system SHALL automatically remove expired refresh tokens from the database.

#### Scenario: Scheduled cleanup job
- **WHEN** a cron job or scheduled task runs (e.g., daily at 2 AM)
- **THEN** the system deletes all refresh tokens with expiration dates in the past
- **AND** logs the number of tokens removed
- **AND** improves database performance by reducing table size

### Requirement: Token Configuration
The system SHALL allow configuration of token lifetimes and security parameters via environment variables.

#### Scenario: Configurable token expiration
- **WHEN** the system is configured
- **THEN** the access token lifetime can be set via `JWT_TOKEN_TTL` environment variable (default 3600 seconds)
- **AND** the refresh token lifetime can be set via `JWT_REFRESH_TOKEN_TTL` environment variable (default 2592000 seconds)
- **AND** the issuer can be set via `JWT_ISSUER` environment variable
- **AND** the audience can be set via `JWT_AUDIENCE` environment variable

### Requirement: Secure Password Authentication
The system SHALL securely authenticate users via email and password.

#### Scenario: Successful password login
- **WHEN** a user provides valid email and password to `/api/auth/login`
- **THEN** the system retrieves the user by email
- **AND** verifies the password against the stored hash using Symfony's password verifier
- **AND** generates JWT tokens if the password is correct
- **AND** returns the tokens with HTTP 200 OK

#### Scenario: Invalid credentials rejection
- **WHEN** a user provides incorrect email or password to `/api/auth/login`
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes a generic error message "Invalid credentials" (do not reveal which field is wrong)
- **AND** logs the failed attempt for security monitoring

#### Scenario: Null password for Google-only users
- **WHEN** a user created via Google SSO attempts email/password login
- **AND** the user has not set a password (password field is null)
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes an error message "This account uses Google Sign-In only"
