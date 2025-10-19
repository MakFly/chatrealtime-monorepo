# JWT Authentication with Google SSO - Technical Design

## Context

This chat application currently lacks authentication. We're implementing a secure, stateless authentication system that supports both traditional email/password login and Google SSO. The system must:
- Work with API Platform 4.2 and Symfony 7.3
- Support a future Next.js frontend (not yet built)
- Follow OAuth 2.0 and JWT best practices
- Be production-ready with proper security controls

### Constraints
- **Stateless architecture**: API Platform configured for stateless operations
- **PostgreSQL database**: Existing database must be extended
- **Docker environment**: All services run in containers
- **No existing auth**: Greenfield authentication implementation

### Stakeholders
- **Backend team**: Implementing authentication in Symfony
- **Future frontend team**: Will consume authentication API from Next.js
- **End users**: Need seamless login experience with Google SSO option

## Goals / Non-Goals

### Goals
✅ Secure JWT-based authentication with RS256 signing
✅ Google OAuth 2.0 SSO with automatic user provisioning
✅ Refresh token mechanism for better UX
✅ Protected API endpoints with role-based access
✅ CORS support for Next.js frontend
✅ Comprehensive API documentation for frontend integration

### Non-Goals
❌ Multi-factor authentication (future enhancement)
❌ Social login providers beyond Google (can be added later)
❌ Password reset flow (separate feature)
❌ Email verification (separate feature)
❌ Session-based authentication (API is stateless)

## Architecture Overview

### Authentication Flow Diagram

```
┌─────────────┐                ┌──────────────┐                ┌─────────────┐
│  Next.js    │                │   Symfony    │                │   Google    │
│  Frontend   │                │   API        │                │   OAuth     │
└──────┬──────┘                └──────┬───────┘                └──────┬──────┘
       │                              │                               │
       │  1. POST /api/auth/login     │                               │
       │  {email, password}           │                               │
       ├─────────────────────────────>│                               │
       │                              │ 2. Validate credentials        │
       │                              │    Hash password              │
       │                              │                               │
       │  3. {access_token,           │                               │
       │      refresh_token}          │                               │
       │<─────────────────────────────┤                               │
       │                              │                               │
       │  OR Google SSO Flow:         │                               │
       │                              │                               │
       │  4. GET /api/auth/google     │                               │
       ├─────────────────────────────>│                               │
       │                              │ 5. Generate OAuth state       │
       │                              │    Redirect to Google         │
       │                              ├──────────────────────────────>│
       │                              │                               │
       │                              │  6. User authorizes           │
       │                              │<──────────────────────────────┤
       │                              │  7. Authorization code        │
       │                              │                               │
       │                              │ 8. Exchange code for tokens   │
       │                              ├──────────────────────────────>│
       │                              │ 9. Access + ID tokens         │
       │                              │<──────────────────────────────┤
       │                              │                               │
       │                              │ 10. Fetch user profile        │
       │                              │     Create/update user        │
       │                              │     Generate JWT              │
       │                              │                               │
       │  11. Redirect with tokens    │                               │
       │      to frontend callback    │                               │
       │<─────────────────────────────┤                               │
       │                              │                               │
       │  12. API requests with       │                               │
       │      Authorization: Bearer   │                               │
       ├─────────────────────────────>│                               │
       │                              │ 13. Validate JWT              │
       │                              │     Check signature           │
       │                              │     Verify expiration         │
       │                              │                               │
       │  14. Protected resource      │                               │
       │<─────────────────────────────┤                               │
       │                              │                               │
       │  15. POST /api/auth/refresh  │                               │
       │      {refresh_token}         │                               │
       ├─────────────────────────────>│                               │
       │                              │ 16. Validate refresh token    │
       │                              │     Generate new access token │
       │                              │                               │
       │  17. {access_token}          │                               │
       │<─────────────────────────────┤                               │
```

## Key Decisions

### Decision 1: JWT Algorithm - RS256 vs HS256

**Choice**: RS256 (RSA asymmetric encryption)

**Rationale**:
- Public key can be shared with frontend for local validation
- Private key remains secure on backend
- Better for microservices architecture (future-proof)
- Industry standard for API authentication

**Alternatives Considered**:
- HS256 (symmetric): Simpler but requires shared secret with frontend
- ES256 (elliptic curve): More efficient but less tooling support

**Implementation**:
- Generate RSA key pair with `openssl genrsa -out private.pem 4096`
- Store private key in `config/jwt/private.pem` (git-ignored)
- Public key in `config/jwt/public.pem` for token validation

### Decision 2: Token Lifetime

**Choice**:
- Access token: 1 hour
- Refresh token: 30 days

**Rationale**:
- 1 hour balances security (short exposure window) with UX (not too frequent refreshes)
- 30-day refresh token allows "remember me" behavior without excessive duration
- Refresh tokens stored in database for revocation capability

**Alternatives Considered**:
- 15 minutes / 7 days: Too aggressive, poor UX
- 24 hours / 90 days: Too permissive, security risk

### Decision 3: Refresh Token Strategy

**Choice**: Database-backed refresh tokens with rotation

**Rationale**:
- Enables token revocation (logout, security breach)
- Refresh token rotation mitigates token theft
- Tracks user sessions for security monitoring

**Implementation**:
- `RefreshToken` entity stores token, user reference, expiration
- On refresh, old token is invalidated and new one issued
- Automatic cleanup of expired tokens via cron job

### Decision 4: Google SSO User Provisioning

**Choice**: Automatic user creation with Google profile data

**Rationale**:
- Seamless onboarding without registration form
- Reduces friction for new users
- Google profile data enriches user profiles

**Strategy**:
1. Check if user exists by email
2. If not, create new user with Google data
3. If exists but no Google ID, link Google account
4. If exists with different Google ID, reject (security)
5. Always update profile data from Google on login

**Data Synced**:
- Email (required, unique identifier)
- Full name (for display)
- Profile picture URL (avatar)
- Google ID (for account linking)

### Decision 5: Password Storage for Mixed Auth

**Choice**: Allow null passwords for Google-only users

**Rationale**:
- Users created via Google SSO don't need passwords
- Password column nullable in User entity
- Users can set password later to enable email/password login

**Implementation**:
```php
#[ORM\Column(nullable: true)]
private ?string $password = null;
```

**Validation**:
- Email/password login requires non-null password
- Google SSO doesn't check password field

### Decision 6: API Platform Security Integration

**Choice**: Leverage API Platform's security attributes

**Rationale**:
- Declarative security at resource level
- Integrates with Symfony Security
- Clear, maintainable authorization rules

**Implementation**:
```php
#[ApiResource(
    operations: [
        new Get(security: "is_granted('ROLE_USER') and object.getId() == user.getId()"),
        new Put(security: "is_granted('ROLE_USER') and object == user"),
    ]
)]
class User { }
```

### Decision 7: CORS Configuration

**Choice**: Strict CORS with explicit origin whitelist

**Rationale**:
- Prevent unauthorized frontend access
- Support Next.js development (localhost) and production domains
- Allow credentials for cookie-based refresh tokens (optional future enhancement)

**Configuration**:
```yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
        allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
        allow_headers: ['Content-Type', 'Authorization']
        expose_headers: ['Link']
        max_age: 3600
        allow_credentials: true
    paths:
        '^/api/': ~
```

## Component Design

### 1. Authentication Controller

**Endpoints**:
- `POST /api/auth/login` - Email/password authentication
- `POST /api/auth/register` - User registration (optional, can use API Platform's POST /api/users)
- `POST /api/auth/token/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate refresh token

**Responsibilities**:
- Validate credentials
- Generate JWT tokens
- Handle refresh token lifecycle

### 2. Google OAuth Controller

**Endpoints**:
- `GET /api/auth/google` - Initiate OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback

**Responsibilities**:
- Generate OAuth state for CSRF protection
- Exchange authorization code for tokens
- Fetch user profile from Google
- Provision or update user
- Generate JWT for authenticated user

### 3. JWT Authenticator

**Type**: Symfony Custom Authenticator

**Responsibilities**:
- Extract JWT from Authorization header
- Validate token signature
- Check expiration
- Load user from token payload
- Integrate with Symfony Security

### 4. Google Authenticator (Optional)

**Type**: OAuth2 Authenticator

**Responsibilities**:
- Handle Google OAuth callback
- Validate state parameter
- Exchange code for tokens
- Create/update user
- Generate JWT

### 5. Refresh Token Manager

**Responsibilities**:
- Create refresh tokens
- Validate refresh tokens
- Rotate tokens on refresh
- Revoke tokens on logout
- Cleanup expired tokens

## Database Schema

### User Entity Extensions

```php
#[ORM\Entity]
#[ORM\Table(name: '`user`')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    // Existing fields...
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 180, unique: true)]
    private ?string $email = null;

    #[ORM\Column(nullable: true)]  // Nullable for Google-only users
    private ?string $password = null;

    #[ORM\Column]
    private array $roles = [];

    // New Google SSO fields
    #[ORM\Column(length: 255, nullable: true, unique: true)]
    private ?string $googleId = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $googleAccessToken = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $googleRefreshToken = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $picture = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;
}
```

### RefreshToken Entity (New)

```php
#[ORM\Entity]
#[ORM\Table(name: 'refresh_tokens')]
class RefreshToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 128, unique: true)]
    private string $refreshToken;

    #[ORM\Column(length: 255)]
    private string $username;  // User identifier

    #[ORM\Column]
    private \DateTimeImmutable $valid;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;
}
```

### Migration Strategy

```sql
-- Migration 1: Add Google SSO fields
ALTER TABLE "user"
ADD COLUMN google_id VARCHAR(255) NULL,
ADD COLUMN google_access_token VARCHAR(500) NULL,
ADD COLUMN google_refresh_token VARCHAR(500) NULL,
ADD COLUMN name VARCHAR(255) NULL,
ADD COLUMN picture VARCHAR(500) NULL,
ADD COLUMN created_at TIMESTAMP NULL,
ADD COLUMN updated_at TIMESTAMP NULL,
ADD CONSTRAINT UNIQ_GOOGLE_ID UNIQUE (google_id);

-- Make password nullable for Google-only users
ALTER TABLE "user" ALTER COLUMN password DROP NOT NULL;

-- Migration 2: Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    refresh_token VARCHAR(128) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL,
    valid TIMESTAMP NOT NULL,
    user_id INTEGER NOT NULL,
    CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX IDX_refresh_tokens_user ON refresh_tokens(user_id);
```

## Security Considerations

### Token Security
- **Signing**: RS256 with 4096-bit RSA keys
- **Storage**: Private key stored securely, not in git
- **Transmission**: HTTPS only in production
- **Validation**: Signature, expiration, issuer, audience

### Google OAuth Security
- **State parameter**: CSRF protection with random state
- **Redirect URI validation**: Whitelist allowed redirect URIs
- **Token storage**: Google tokens encrypted at rest (optional)
- **Scope limitation**: Only request necessary scopes (email, profile)

### Rate Limiting
- **Login endpoint**: 5 attempts per minute per IP
- **Refresh endpoint**: 10 requests per minute per user
- **Google callback**: 5 requests per minute per IP

### Password Security
- **Hashing**: Symfony auto-hashing (bcrypt/argon2)
- **Requirements**: Minimum 8 characters (can be enforced with validators)
- **Breach detection**: Optional integration with HaveIBeenPwned API

### Token Revocation
- **Logout**: Invalidate refresh token in database
- **Security breach**: Admin endpoint to revoke all user tokens
- **Automatic cleanup**: Cron job removes expired refresh tokens

## Risks / Trade-offs

### Risk 1: JWT Token Theft

**Mitigation**:
- Short access token lifetime (1 hour)
- Refresh token rotation
- HTTPS enforcement
- Secure token storage guidance for frontend (not localStorage for refresh tokens)

### Risk 2: Google OAuth Downtime

**Impact**: Users cannot authenticate via Google

**Mitigation**:
- Fallback to email/password authentication
- Clear error messages directing users to alternative login
- Monitor Google OAuth status

### Risk 3: Database Load from Refresh Tokens

**Impact**: High refresh rate may increase database queries

**Mitigation**:
- Index refresh_token column
- Cache valid refresh tokens in Redis (optional future optimization)
- Regular cleanup of expired tokens

### Risk 4: CORS Misconfiguration

**Impact**: Frontend cannot access API or security vulnerability

**Mitigation**:
- Strict origin whitelist in production
- Localhost allowed for development only
- Automated tests for CORS headers

### Trade-off: Stateless vs. Revocation

**Issue**: JWTs are stateless, but revocation requires state (database lookup)

**Decision**: Use database-backed refresh tokens for revocation capability
- Access tokens remain stateless (cannot be revoked before expiration)
- Refresh tokens are stateful (can be revoked immediately)
- Compromise: Short access token lifetime minimizes revocation delay

## Migration Plan

### Phase 1: Dependencies and Configuration (1-2 hours)
1. Install LexikJWTAuthenticationBundle, KnpUOAuth2ClientBundle, league/oauth2-google
2. Generate RSA key pair
3. Configure bundles in config/packages/
4. Set up environment variables (.env.example)

### Phase 2: Database Schema (30 minutes)
1. Extend User entity with Google fields
2. Create RefreshToken entity
3. Generate and run migrations
4. Update fixtures for testing

### Phase 3: JWT Authentication (2-3 hours)
1. Create AuthController with login/refresh/logout endpoints
2. Implement JWT authenticator
3. Configure security firewall
4. Add API routes
5. Write unit tests

### Phase 4: Google SSO Integration (2-3 hours)
1. Create GoogleController with OAuth flow
2. Implement user provisioning logic
3. Configure OAuth client
4. Add frontend redirect handling
5. Write integration tests

### Phase 5: API Security (1-2 hours)
1. Protect API Platform resources with security attributes
2. Configure CORS for Next.js frontend
3. Add rate limiting (optional: requires additional bundle)
4. Test protected endpoints

### Phase 6: Documentation (1 hour)
1. Document API endpoints with OpenAPI annotations
2. Create frontend integration guide
3. Add environment variable documentation
4. Write security best practices guide

### Rollback Strategy

**If issues occur**:
1. Revert migrations (database changes)
2. Remove authentication routes
3. Disable security firewalls
4. Fall back to unprotected API (development only)

**Data preservation**:
- User table changes are additive (no data loss)
- RefreshToken table can be dropped without affecting users
- Google SSO fields can be nulled if needed

## Open Questions

1. **Email verification**: Should users verify email before accessing protected resources?
   - **Recommendation**: Not required for MVP, add later if needed

2. **Password reset flow**: How should users reset forgotten passwords?
   - **Recommendation**: Separate feature, implement after core auth is working

3. **Frontend token storage**: Where should Next.js store JWT tokens?
   - **Recommendation**: Access token in memory/state, refresh token in httpOnly cookie

4. **Rate limiting implementation**: Which bundle to use?
   - **Recommendation**: noxlogic/ratelimit-bundle or implement custom middleware

5. **Multi-tenant support**: Will the app support multiple organizations?
   - **Recommendation**: Not in scope for initial auth, design can accommodate later

6. **Admin role management**: How are admin users created and managed?
   - **Recommendation**: Manual database update or console command, not exposed via API initially

## Success Criteria

### Functional Requirements
✅ Users can register and login with email/password
✅ Users can authenticate via Google SSO
✅ JWT tokens are generated and validated correctly
✅ Refresh tokens enable seamless token renewal
✅ Protected endpoints reject unauthenticated requests
✅ CORS allows Next.js frontend to access API

### Non-Functional Requirements
✅ Authentication endpoints respond within 500ms (95th percentile)
✅ Token validation adds <10ms latency to API requests
✅ System handles 100 concurrent authentication requests
✅ Zero authentication bypasses (security audit passed)
✅ Code coverage >80% for authentication logic

### Documentation
✅ OpenAPI spec generated with authentication schemes
✅ Frontend integration guide completed
✅ Security best practices documented
✅ Environment setup instructions updated
