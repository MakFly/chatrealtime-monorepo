# Specification: Feature Testing (API Endpoints)

## ADDED Requirements

### Requirement: Auth Login Endpoint Tests
`POST /api/v1/auth/login` endpoint SHALL be tested to verify authentication with email/password credentials.

#### Scenario: Return JWT when credentials are valid
- WHEN POST /api/v1/auth/login with `{"email": "user@test.com", "password": "password123"}`
- THEN response status is 200
- AND JSON contains `access_token` (valid JWT string)
- AND JSON contains `refresh_token` (64-character hex string)
- AND JSON contains `token_type` = "Bearer"
- AND JSON contains `expires_in` = 3600
- AND JSON contains `user` object with id, email, name, picture

#### Scenario: Return 401 when email doesn't exist
- WHEN POST /api/v1/auth/login with `{"email": "notfound@test.com", "password": "anything"}`
- THEN response status is 401
- AND JSON contains `{"error": "invalid_credentials", "message": "Identifiants invalides"}`

#### Scenario: Return 401 when password is incorrect
- WHEN POST /api/v1/auth/login with `{"email": "user@test.com", "password": "wrongpassword"}`
- THEN response status is 401
- AND JSON contains `{"error": "invalid_credentials"}`

#### Scenario: Return 401 when user has Google SSO only
- GIVEN User exists with email='google.user@test.com', password=null, googleId='123'
- WHEN POST /api/v1/auth/login with `{"email": "google.user@test.com", "password": "anything"}`
- THEN response status is 401
- AND JSON message contains "Ce compte utilise uniquement Google Sign-In"

#### Scenario: Return 400 when email is missing
- WHEN POST /api/v1/auth/login with `{"password": "password123"}`
- THEN response status is 400
- AND JSON contains `{"error": "invalid_request", "message": "Email et mot de passe requis"}`

#### Scenario: Return 400 when password is missing
- WHEN POST /api/v1/auth/login with `{"email": "user@test.com"}`
- THEN response status is 400
- AND JSON contains `{"error": "invalid_request"}`

#### Scenario: JWT payload contains correct user data
- WHEN POST /api/v1/auth/login with valid credentials
- AND access_token is decoded
- THEN JWT payload contains `username` = user email
- AND JWT payload contains `roles` array including "ROLE_USER"
- AND JWT `exp` claim is ~3600 seconds from now

#### Scenario: Refresh token is persisted in database
- WHEN POST /api/v1/auth/login with valid credentials
- THEN `refresh_tokens` table contains new row with returned refresh_token value
- AND refresh_token.username = user email
- AND refresh_token.valid date is ~30 days from now

### Requirement: Auth Register Endpoint Tests
`POST /api/v1/auth/register` endpoint SHALL be tested to verify new user creation with email/password.

#### Scenario: Create new user and return JWT
- WHEN POST /api/v1/auth/register with `{"email": "newuser@test.com", "password": "secret123", "name": "New User"}`
- THEN response status is 201
- AND `users` table contains new row with email='newuser@test.com'
- AND user.password is bcrypt hash (starts with $2y$)
- AND user.name = "New User"
- AND JSON contains access_token and refresh_token

#### Scenario: Return 409 when email already exists
- GIVEN User exists with email='existing@test.com'
- WHEN POST /api/v1/auth/register with `{"email": "existing@test.com", "password": "password"}`
- THEN response status is 409
- AND JSON contains `{"error": "email_exists", "message": "Un compte avec cet email existe déjà"}`

#### Scenario: Return 400 when email is missing
- WHEN POST /api/v1/auth/register with `{"password": "password123"}`
- THEN response status is 400
- AND JSON contains `{"error": "invalid_request"}`

#### Scenario: Return 400 when password is missing
- WHEN POST /api/v1/auth/register with `{"email": "test@test.com"}`
- THEN response status is 400
- AND JSON contains error

#### Scenario: Password is hashed not plaintext
- WHEN POST /api/v1/auth/register with `{"email": "hash@test.com", "password": "plaintext"}`
- THEN user.password in database is NOT "plaintext"
- AND user.password starts with "$2y$" (bcrypt)
- AND user.password length is ~60 characters

#### Scenario: New user has default ROLE_USER
- WHEN POST /api/v1/auth/register with new user
- THEN user.roles contains "ROLE_USER"
- AND decoded JWT contains "ROLE_USER" in roles array

### Requirement: Auth Refresh Endpoint Tests
`POST /api/v1/auth/refresh` endpoint SHALL be tested to verify refresh token exchange for new access token.

#### Scenario: Return new access token when refresh token is valid
- GIVEN valid refresh_token from login response
- WHEN POST /api/v1/auth/refresh with `{"refresh_token": "<valid-token>"}`
- THEN response status is 200
- AND JSON contains new `access_token` (different from original)
- AND JSON contains same `refresh_token` (not rotated by default)

#### Scenario: Return 401 when refresh token is invalid
- WHEN POST /api/v1/auth/refresh with `{"refresh_token": "invalid-token-string"}`
- THEN response status is 401
- AND JSON contains `{"error": "invalid_token", "message": "Refresh token invalide ou expiré"}`

#### Scenario: Return 401 when refresh token is expired
- GIVEN refresh_token created 31 days ago (past TTL)
- WHEN POST /api/v1/auth/refresh with expired token
- THEN response status is 401
- AND JSON error is "invalid_token"

#### Scenario: Return 400 when refresh_token is missing
- WHEN POST /api/v1/auth/refresh with `{}`
- THEN response status is 400
- AND JSON contains `{"error": "invalid_request", "message": "Refresh token requis"}`

#### Scenario: Return 401 when user associated with token doesn't exist
- GIVEN refresh_token for user that was deleted
- WHEN POST /api/v1/auth/refresh with that token
- THEN response status is 401
- AND JSON contains `{"error": "user_not_found"}`

### Requirement: Auth Logout Endpoint Tests
`POST /api/v1/auth/logout` endpoint SHALL be tested to verify refresh token revocation.

#### Scenario: Delete refresh token and return 204
- GIVEN valid refresh_token
- WHEN POST /api/v1/auth/logout with `{"refresh_token": "<token>"}`
- THEN response status is 204 (No Content)
- AND refresh_token is deleted from `refresh_tokens` table
- AND response body is empty

#### Scenario: Return 400 when refresh_token is missing
- WHEN POST /api/v1/auth/logout with `{}`
- THEN response status is 400
- AND JSON contains `{"error": "invalid_request"}`

#### Scenario: Return 204 even when token doesn't exist (idempotent)
- WHEN POST /api/v1/auth/logout with `{"refresh_token": "nonexistent-token"}`
- THEN response status is 204
- AND no error is returned

#### Scenario: Revoked refresh token cannot be used
- GIVEN valid refresh_token
- WHEN POST /api/v1/auth/logout with that token
- AND POST /api/v1/auth/refresh with same token
- THEN refresh returns 401 (token no longer valid)

### Requirement: Auth Status Endpoint Tests
`GET /api/v1/auth/status` endpoint SHALL be tested to verify available authentication methods.

#### Scenario: Return available auth methods
- WHEN GET /api/v1/auth/status
- THEN response status is 200
- AND JSON contains `{"auth_methods": {"email_password": true, "google_sso": <boolean>}, "api_version": "v1"}`

#### Scenario: SSO enabled when SSO_ENABLED=true
- GIVEN .env.test has SSO_ENABLED=true
- WHEN GET /api/v1/auth/status
- THEN JSON auth_methods.google_sso is true

#### Scenario: SSO disabled when SSO_ENABLED=false
- GIVEN .env.test has SSO_ENABLED=false
- WHEN GET /api/v1/auth/status
- THEN JSON auth_methods.google_sso is false

### Requirement: Google SSO Connect Endpoint Tests
`GET /api/v1/auth/google` endpoint SHALL be tested to verify OAuth redirect initialization.

#### Scenario: Redirect to Google OAuth when SSO enabled
- GIVEN SSO_ENABLED=true
- WHEN GET /api/v1/auth/google
- THEN response status is 302 (redirect)
- AND Location header contains "accounts.google.com/o/oauth2"
- AND URL query includes client_id parameter

#### Scenario: Return 403 when SSO disabled
- GIVEN SSO_ENABLED=false
- WHEN GET /api/v1/auth/google
- THEN response status is 403
- AND JSON contains `{"error": "sso_disabled", "message": "L'authentification Google SSO est désactivée"}`

#### Scenario: OAuth URL includes state parameter for CSRF protection
- WHEN GET /api/v1/auth/google
- THEN redirect URL query contains `state` parameter
- AND state value is not empty

### Requirement: Google SSO Callback Endpoint Tests
`GET /api/v1/auth/google/callback` endpoint SHALL be tested to verify OAuth callback handling and user provisioning.

#### Scenario: Provision new user and return tokens
- GIVEN valid OAuth code and state parameters
- AND mocked Google client returns profile: {id='123', email='new@example.com', name='New User', picture='https://pic.url'}
- WHEN GET /api/v1/auth/google/callback?code=xxx&state=yyy
- THEN response status is 302
- AND redirect URL is FRONTEND_URL/auth/callback#access_token=...&refresh_token=...&token_type=Bearer
- AND new User is created in database with googleId='123', email='new@example.com'

#### Scenario: Link Google to existing user
- GIVEN existing User with email='test@example.com', googleId=null
- AND mocked Google client returns {id='456', email='test@example.com'}
- WHEN GET /api/v1/auth/google/callback
- THEN User googleId is set to '456'
- AND redirect includes access_token for that user

#### Scenario: Return error when SSO disabled
- GIVEN SSO_ENABLED=false
- WHEN GET /api/v1/auth/google/callback
- THEN redirect to FRONTEND_URL/auth/callback#error=sso_disabled&message=...

#### Scenario: Return error when user cancels OAuth
- WHEN GET /api/v1/auth/google/callback?error=access_denied
- THEN redirect to FRONTEND_URL/auth/callback#error=authentication_cancelled

#### Scenario: Return error when token exchange fails
- GIVEN Google OAuth client throws exception
- WHEN GET /api/v1/auth/google/callback
- THEN redirect to FRONTEND_URL/auth/callback#error=authentication_failed

### Requirement: User Profile Endpoint Tests
`GET /api/v1/me` endpoint SHALL be tested to verify authenticated user profile retrieval.

#### Scenario: Return user profile when authenticated
- GIVEN User with email='test@example.com'
- AND valid JWT for that user
- WHEN GET /api/v1/me with Authorization: Bearer <jwt>
- THEN response status is 200
- AND JSON contains {id, email, name, picture, roles, google_id, created_at, updated_at}

#### Scenario: Return 401 when JWT is missing
- WHEN GET /api/v1/me with no Authorization header
- THEN response status is 401
- AND JSON contains `{"code": 401, "message": "JWT Token not found"}`

#### Scenario: Return 401 when JWT is invalid
- WHEN GET /api/v1/me with Authorization: Bearer invalid-jwt-string
- THEN response status is 401
- AND JSON message contains "Invalid JWT Token"

#### Scenario: Return 401 when JWT is expired
- GIVEN JWT created 2 hours ago (past TTL)
- WHEN GET /api/v1/me with expired JWT
- THEN response status is 401
- AND JSON message contains "Expired JWT Token"

#### Scenario: Return correct user from JWT claims
- GIVEN JWT for user A
- WHEN GET /api/v1/me with that JWT
- THEN response.email = user A email (NOT user B)
