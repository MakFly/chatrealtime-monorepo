# API Security Specification

## ADDED Requirements

### Requirement: Protected API Endpoints
The system SHALL protect API Platform resources with JWT authentication.

#### Scenario: Authenticated access to protected resource
- **WHEN** an authenticated user with valid JWT token requests a protected resource
- **THEN** the system validates the JWT token
- **AND** loads the user from the token payload
- **AND** grants access to the resource if authorized
- **AND** returns the resource with HTTP 200 OK

#### Scenario: Unauthenticated access rejection
- **WHEN** a request to a protected resource does not include a valid JWT token
- **THEN** the system returns HTTP 401 Unauthorized
- **AND** includes a WWW-Authenticate header with Bearer realm
- **AND** includes an error message "Authentication required"
- **AND** does not disclose any information about the resource

#### Scenario: Public endpoint access
- **WHEN** a request is made to a public endpoint (e.g., `/api/docs`, `/api/auth/login`)
- **THEN** the system allows access without authentication
- **AND** returns the resource or performs the action
- **AND** does not require a JWT token

### Requirement: Role-Based Access Control
The system SHALL enforce role-based permissions on API operations.

#### Scenario: User access to own resource
- **WHEN** an authenticated user with ROLE_USER requests their own user profile
- **THEN** the system checks `object.getId() == user.getId()`
- **AND** grants access if the condition is true
- **AND** returns the user profile with HTTP 200 OK

#### Scenario: User denied access to other user's resource
- **WHEN** an authenticated user with ROLE_USER requests another user's profile
- **THEN** the system checks `object.getId() == user.getId()`
- **AND** denies access because the condition is false
- **AND** returns HTTP 403 Forbidden
- **AND** includes an error message "Access denied"

#### Scenario: Admin access to all resources
- **WHEN** an authenticated user with ROLE_ADMIN requests any user profile
- **THEN** the system checks `is_granted('ROLE_ADMIN')`
- **AND** grants access regardless of resource ownership
- **AND** returns the user profile with HTTP 200 OK

#### Scenario: Operation-level security
- **WHEN** defining API Platform resource operations
- **THEN** each operation (Get, Post, Put, Patch, Delete) can have its own security rules
- **AND** security expressions use Symfony's expression language
- **AND** security rules have access to `user`, `object`, and `request` variables

### Requirement: CORS Configuration for Frontend
The system SHALL configure CORS to allow requests from the Next.js frontend.

#### Scenario: Preflight request handling
- **WHEN** the Next.js frontend sends a preflight OPTIONS request to any API endpoint
- **THEN** the system responds with HTTP 204 No Content
- **AND** includes Access-Control-Allow-Origin header matching the frontend origin
- **AND** includes Access-Control-Allow-Methods header with allowed methods (GET, POST, PUT, PATCH, DELETE, OPTIONS)
- **AND** includes Access-Control-Allow-Headers header with Content-Type, Authorization
- **AND** includes Access-Control-Max-Age header set to 3600 seconds

#### Scenario: Actual request with credentials
- **WHEN** the Next.js frontend sends an actual API request with Authorization header
- **THEN** the system validates the origin against the CORS whitelist
- **AND** includes Access-Control-Allow-Origin header matching the requesting origin
- **AND** includes Access-Control-Allow-Credentials header set to true
- **AND** processes the request normally if origin is allowed

#### Scenario: Rejected origin
- **WHEN** a request comes from an origin not in the CORS whitelist
- **THEN** the system does not include Access-Control-Allow-Origin header
- **AND** the browser blocks the response from reaching the frontend
- **AND** logs the rejected origin for security monitoring

#### Scenario: Environment-specific CORS configuration
- **WHEN** the application runs in different environments
- **THEN** development allows localhost origins (e.g., `http://localhost:3000`)
- **AND** staging allows staging frontend origin (e.g., `https://staging.example.com`)
- **AND** production allows only production frontend origin (e.g., `https://example.com`)
- **AND** origins are configured via `CORS_ALLOW_ORIGIN` environment variable

### Requirement: Security Headers
The system SHALL include security headers in all API responses.

#### Scenario: Standard security headers
- **WHEN** the system returns any API response
- **THEN** the response includes `X-Content-Type-Options: nosniff` header
- **AND** includes `X-Frame-Options: DENY` header
- **AND** includes `X-XSS-Protection: 1; mode=block` header (for legacy browsers)
- **AND** includes `Strict-Transport-Security: max-age=31536000; includeSubDomains` header (HTTPS only)

#### Scenario: Cache control for sensitive data
- **WHEN** the system returns user-specific or authenticated data
- **THEN** the response includes `Cache-Control: private, no-cache, no-store, must-revalidate` header
- **AND** includes `Pragma: no-cache` header (HTTP/1.0 compatibility)
- **AND** prevents caching of sensitive data by browsers or proxies

### Requirement: API Rate Limiting
The system SHALL implement rate limiting to prevent abuse of API endpoints.

#### Scenario: Authenticated endpoint rate limiting
- **WHEN** an authenticated user exceeds 100 requests per minute to any API endpoint
- **THEN** the system returns HTTP 429 Too Many Requests
- **AND** includes `Retry-After` header with seconds until limit resets
- **AND** includes `X-RateLimit-Limit` header with the limit value
- **AND** includes `X-RateLimit-Remaining` header with remaining requests
- **AND** includes `X-RateLimit-Reset` header with Unix timestamp of limit reset

#### Scenario: Per-endpoint rate limiting
- **WHEN** rate limits are configured per endpoint
- **THEN** authentication endpoints have stricter limits (5-10 requests/minute)
- **AND** read-only endpoints have generous limits (100 requests/minute)
- **AND** write endpoints have moderate limits (30 requests/minute)
- **AND** admin endpoints have separate limits based on sensitivity

#### Scenario: Rate limit bypass for trusted sources
- **WHEN** requests come from whitelisted IP addresses or API keys
- **THEN** the system does not apply rate limiting
- **AND** logs the bypass for audit purposes
- **AND** monitors for abuse even from trusted sources

### Requirement: Input Validation and Sanitization
The system SHALL validate and sanitize all user inputs to prevent injection attacks.

#### Scenario: SQL injection prevention
- **WHEN** user input is used in database queries
- **THEN** the system uses Doctrine ORM's parameterized queries exclusively
- **AND** never concatenates user input into SQL strings
- **AND** validates input types match expected database column types

#### Scenario: XSS prevention
- **WHEN** user input is stored or returned in API responses
- **THEN** the system uses proper JSON encoding to prevent XSS
- **AND** does not interpret HTML in JSON responses
- **AND** sets Content-Type header to application/json

#### Scenario: Path traversal prevention
- **WHEN** user input contains file paths or identifiers
- **THEN** the system validates identifiers are numeric or UUIDs only
- **AND** rejects input containing path traversal characters (../, ..\)
- **AND** uses safe file operations if file handling is needed

### Requirement: Secure Password Management
The system SHALL securely store and validate user passwords.

#### Scenario: Password hashing on user creation
- **WHEN** a new user registers with a password
- **THEN** the system hashes the password using Symfony's auto-hashing (bcrypt or argon2id)
- **AND** never stores the plain-text password
- **AND** the hash includes a unique salt per user
- **AND** the hashing algorithm uses sufficient work factor (cost 12+ for bcrypt)

#### Scenario: Password verification on login
- **WHEN** a user attempts to login with a password
- **THEN** the system uses Symfony's password verifier to check the password
- **AND** the verification is timing-attack safe (constant time comparison)
- **AND** never logs or returns the password in any form

#### Scenario: Password requirements enforcement
- **WHEN** a user sets or changes their password
- **THEN** the system enforces a minimum length of 8 characters
- **AND** optionally enforces complexity requirements (uppercase, lowercase, digits, special characters)
- **AND** returns HTTP 400 Bad Request with validation errors if requirements are not met

### Requirement: Audit Logging
The system SHALL log security-relevant events for monitoring and forensics.

#### Scenario: Authentication event logging
- **WHEN** a user successfully authenticates (password or Google SSO)
- **THEN** the system logs the event with timestamp, user ID, IP address, and authentication method
- **AND** logs failed authentication attempts with timestamp and IP address
- **AND** logs rate-limited authentication attempts
- **AND** does not log sensitive data (passwords, full tokens)

#### Scenario: Authorization failure logging
- **WHEN** an authenticated user is denied access to a resource (403)
- **THEN** the system logs the event with timestamp, user ID, resource, and attempted action
- **AND** includes the security rule that denied access
- **AND** allows security team to investigate potential privilege escalation attempts

#### Scenario: Token-related event logging
- **WHEN** tokens are generated, refreshed, or revoked
- **THEN** the system logs the event with timestamp, user ID, and token type
- **AND** logs suspicious token activity (e.g., multiple refresh attempts)
- **AND** logs token validation failures (expired, invalid signature)

### Requirement: Secure Token Transmission
The system SHALL ensure JWT tokens are transmitted securely between client and server.

#### Scenario: HTTPS enforcement in production
- **WHEN** the application runs in production environment
- **THEN** all API endpoints enforce HTTPS (TLS 1.2+)
- **AND** HTTP requests are redirected to HTTPS
- **AND** tokens are never transmitted over unencrypted connections

#### Scenario: Token transmission in Authorization header
- **WHEN** the frontend sends API requests with JWT tokens
- **THEN** tokens are sent in the Authorization header as `Bearer {token}`
- **AND** tokens are never sent in URL query parameters (prevent logging/caching)
- **AND** tokens are never sent in cookies for access tokens (XSS risk)

#### Scenario: Secure token storage guidance
- **WHEN** frontend documentation is provided
- **THEN** guidance recommends storing access tokens in memory or secure state
- **AND** guidance recommends storing refresh tokens in httpOnly, secure cookies OR secure storage
- **AND** guidance warns against storing tokens in localStorage (XSS risk)

### Requirement: API Versioning and Deprecation
The system SHALL support API versioning to allow secure updates without breaking clients.

#### Scenario: Version prefix in API routes
- **WHEN** API endpoints are defined
- **THEN** all routes include a version prefix (e.g., `/api/v1/users`)
- **AND** future breaking changes can be introduced in new versions (e.g., `/api/v2/users`)
- **AND** old versions can be deprecated with advance notice

#### Scenario: Deprecation headers
- **WHEN** an API version or endpoint is deprecated
- **THEN** responses include a `Deprecation: true` header
- **AND** include a `Sunset` header with the date the endpoint will be removed
- **AND** include a `Link` header pointing to the new version or migration guide

### Requirement: Error Response Security
The system SHALL return secure error responses that do not leak sensitive information.

#### Scenario: Production error responses
- **WHEN** an error occurs in production
- **THEN** the API returns a generic error message to the client
- **AND** does not include stack traces or internal paths
- **AND** does not reveal database schema or query details
- **AND** logs full error details server-side for debugging

#### Scenario: Authentication error responses
- **WHEN** authentication fails (invalid credentials)
- **THEN** the system returns a generic "Invalid credentials" message
- **AND** does not reveal whether the email exists in the database
- **AND** does not indicate which credential (email or password) is incorrect

#### Scenario: Authorization error responses
- **WHEN** a user is denied access to a resource
- **THEN** the system returns HTTP 403 Forbidden with a generic message
- **AND** does not reveal the existence of the resource if the user shouldn't know
- **AND** returns HTTP 404 Not Found instead of 403 for private resources

### Requirement: API Documentation Security
The system SHALL provide secure API documentation that does not expose sensitive information.

#### Scenario: OpenAPI documentation generation
- **WHEN** API Platform generates OpenAPI documentation
- **THEN** authentication schemes (Bearer JWT) are documented
- **AND** security requirements are specified per operation
- **AND** example tokens or credentials are not included
- **AND** internal or admin-only endpoints are excluded from public documentation

#### Scenario: Interactive API documentation
- **WHEN** Swagger UI is accessible at `/api/docs`
- **THEN** the UI allows users to test authenticated endpoints with their own JWT tokens
- **AND** the UI does not pre-fill or store user tokens
- **AND** the documentation endpoint itself is public (no authentication required)
