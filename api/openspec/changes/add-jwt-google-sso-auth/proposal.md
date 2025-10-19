# Add JWT Authentication with Google SSO

## Why

The current Symfony API lacks authentication mechanisms, making it impossible to secure endpoints or identify users. We need a modern, stateless authentication system that:
- Provides secure JWT-based token authentication for API requests
- Integrates Google OAuth 2.0 for streamlined user onboarding (SSO)
- Supports a future Next.js frontend that is not yet built
- Follows security best practices for token management and validation
- Leverages API Platform's built-in security features

## What Changes

### Core Authentication
- **JWT token generation and validation** using LexikJWTAuthenticationBundle
- **Secure token storage** with configurable expiration (1 hour access tokens)
- **Refresh token mechanism** for seamless token renewal without re-authentication
- **Password-based authentication** for traditional email/password login
- **Token blacklisting** capability for logout and security revocation

### Google SSO Integration
- **Google OAuth 2.0 provider** integration using KnpUOAuth2ClientBundle
- **Automatic user provisioning** from Google profiles (email, name, picture, Google ID)
- **Account linking** to associate Google accounts with existing users
- **Secure callback handling** with CSRF protection
- **Profile data synchronization** from Google (email, full name, profile picture, Google ID)

### API Security
- **Protected API endpoints** using Symfony Security voters
- **Role-based access control** (RBAC) with default ROLE_USER
- **CORS configuration** for cross-origin requests from Next.js frontend
- **Rate limiting** for authentication endpoints
- **Secure password hashing** using Symfony's auto-hashing (bcrypt/argon2)

### Database Schema
- **User entity extensions**: `googleId`, `googleAccessToken`, `googleRefreshToken`, `picture`, `name`
- **RefreshToken entity**: for managing refresh token lifecycle
- **Migration path**: for extending existing User table

## Impact

### Affected Specifications
- **NEW**: `specs/jwt-authentication/` - JWT token generation, validation, refresh
- **NEW**: `specs/google-sso-integration/` - Google OAuth flow and user provisioning
- **NEW**: `specs/api-security/` - Endpoint protection and authorization

### Affected Code
- **Entity**: `src/Entity/User.php` - Add Google SSO fields
- **Entity**: `src/Entity/RefreshToken.php` (new) - Refresh token management
- **Controller**: `src/Controller/AuthController.php` (new) - Authentication endpoints
- **Controller**: `src/Controller/GoogleController.php` (new) - Google OAuth callback
- **Security**: `config/packages/security.yaml` - Firewall and authentication configuration
- **Routes**: `config/routes/auth.yaml` (new) - Authentication routes
- **Services**: `src/Security/GoogleAuthenticator.php` (new) - Custom authenticator

### Breaking Changes
- **NONE** - This is a new feature addition

### Dependencies Added
- `lexik/jwt-authentication-bundle` (~3.1) - JWT token management
- `knpuniversity/oauth2-client-bundle` (~2.18) - OAuth 2.0 client
- `league/oauth2-google` (~4.0) - Google OAuth provider
- `gesdinet/jwt-refresh-token-bundle` (~1.3) - Refresh token functionality

### Frontend Integration Points
For the future Next.js frontend:
- **Login endpoint**: `POST /api/auth/login` - Returns JWT access + refresh tokens
- **Google SSO endpoint**: `GET /api/auth/google` - Initiates Google OAuth flow
- **Google callback**: `GET /api/auth/google/callback` - Handles OAuth callback
- **Refresh endpoint**: `POST /api/auth/token/refresh` - Renews access token
- **Logout endpoint**: `POST /api/auth/logout` - Invalidates refresh token
- **User profile**: `GET /api/users/{id}` - Protected endpoint example
- **Token format**: Bearer token in Authorization header

### Security Considerations
- **Token expiration**: Access tokens expire in 1 hour, refresh tokens in 30 days
- **HTTPS required**: All authentication endpoints must use HTTPS in production
- **CORS configured**: Allow Next.js frontend origin with credentials
- **Rate limiting**: Prevent brute force on authentication endpoints
- **Token encryption**: JWT tokens signed with RS256 algorithm
- **Secret management**: Private keys stored securely outside version control

## Migration Strategy

1. **Phase 1**: Install dependencies and configure bundles
2. **Phase 2**: Extend User entity and create migrations
3. **Phase 3**: Implement JWT authentication endpoints
4. **Phase 4**: Integrate Google SSO flow
5. **Phase 5**: Protect API Platform resources
6. **Phase 6**: Document API endpoints for frontend team

## Testing Strategy

- **Unit tests**: Token generation, validation, refresh logic
- **Integration tests**: Full authentication flow (login, refresh, logout)
- **E2E tests**: Google OAuth flow with mocked Google responses
- **Security tests**: Token tampering, expired tokens, invalid signatures
- **Load tests**: Authentication endpoint performance under load
