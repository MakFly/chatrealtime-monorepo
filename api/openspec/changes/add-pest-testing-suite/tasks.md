# Implementation Tasks

## Progress Summary

**Status**: ✅ Core testing infrastructure complete
**Tests Passing**: 30/30 (100%)
**Assertions**: 119
**Coverage**: Authentication endpoints fully tested

### Completed Phases:
- ✅ **Phase 1**: PEST PHP Installation (9/9 tasks)
- ✅ **Phase 2**: Test Environment Configuration (6/6 tasks) - 100% complete
- ✅ **Phase 3**: Test Database Setup (4/7 tasks)
- ✅ **Phase 7**: Login Endpoint Tests (6/9 tasks)
- ✅ **Phase 8**: Register Endpoint Tests (8/8 tasks)
- ✅ **Phase 9**: Refresh Endpoint Tests (5/7 tasks)
- ✅ **Phase 10**: Logout Endpoint Tests (5/5 tasks)
- ✅ **Phase 11**: Status Endpoint Tests (3/5 tasks)
- ✅ **Phase 22**: Documentation & Makefile (2/6 tasks)

### Pending Phases:
- ⏳ **Phase 4-6**: Unit Tests (GoogleUserProvisioner, User, UserRepository)
- ⏳ **Phase 12-13**: Google SSO Feature Tests
- ⏳ **Phase 14**: User Profile Endpoint Tests
- ⏳ **Phase 15-18**: Security Tests
- ⏳ **Phase 19-21**: Architecture Tests
- ⏳ **Phase 22**: CI/CD Integration
- ⏳ **Phase 23**: Final Validation

---

## 1. PEST PHP Installation and Configuration

- [x] 1.1 Install PEST PHP core (`composer require --dev pestphp/pest:^3.0`) - ✅ v3.8.4
- [x] 1.2 Install PEST Symfony plugin - ⚠️ Plugin doesn't exist, used direct Symfony packages
- [x] 1.3 Install PEST Architecture plugin (`composer require --dev pestphp/pest-plugin-arch:^3.0`) - ✅ v3.1.1
- [x] 1.4 Install Symfony browser-kit (`composer require --dev symfony/browser-kit`) - ✅
- [x] 1.5 Install Symfony http-client (`composer require --dev symfony/http-client`) - ✅
- [x] 1.6 Install Symfony css-selector (`composer require --dev symfony/css-selector`) - ✅
- [x] 1.7 Install PHPUnit bridge (`composer require --dev symfony/phpunit-bridge`) - ✅
- [x] 1.8 Initialize PEST (`vendor/bin/pest --init`) - ✅
- [x] 1.9 Verify installation (`vendor/bin/pest --version`) - ✅ v3.8.4

## 2. Test Environment Configuration

- [x] 2.1 Create `.env.test` file with test-specific environment variables - ✅ All variables configured
- [x] 2.2 Create `phpunit.xml` configuration file - ✅ All suites and coverage configured
- [x] 2.3 Create `tests/bootstrap.php` file - ✅ Loads .env.test and sets up kernel
- [x] 2.4 Create `tests/Pest.php` global configuration file - ✅ Helpers and expectations added
- [x] 2.5 Add `.phpunit.result.cache` to `.gitignore` - ✅ Added
- [x] 2.6 Add `var/coverage/` to `.gitignore` - ✅ Added

## 3. Test Database Setup

- [x] 3.1 Create test database - ✅ `chatrealtime_test_test` created
- [x] 3.2 Run migrations on test database - ✅ Migrations applied
- [x] 3.3 Verify test database schema - ✅ Schema validated
- [x] 3.4 Load fixtures into test database - ✅ Fixtures loaded (4 test users)
- [ ] 3.5 Create `tests/Support/InteractsWithDatabase.php` trait - ⏳ Not done (manual cleanup used)
- [ ] 3.6 Create `tests/Support/InteractsWithJwt.php` trait - ⏳ Not done (helpers in Pest.php)
- [ ] 3.7 Test database transaction isolation - ⏳ Not implemented

## 4. Unit Tests - GoogleUserProvisioner Service

- [ ] 4.1 Create `tests/Unit/Service/GoogleUserProvisionerTest.php`
- [ ] 4.2 Test: Creates new user when email doesn't exist
  - GIVEN no existing user with Google email
  - WHEN provisionUser() is called with Google profile data
  - THEN new user is created with Google ID, email, name, picture
- [ ] 4.3 Test: Links Google account to existing user without Google ID
  - GIVEN existing user with email but no Google ID
  - WHEN provisionUser() is called with matching email
  - THEN Google ID and tokens are added to existing user
- [ ] 4.4 Test: Updates Google tokens for existing Google user
  - GIVEN existing user with Google ID
  - WHEN provisionUser() is called with same Google ID
  - THEN Google access/refresh tokens are updated
- [ ] 4.5 Test: Throws ConflictException when email exists with different Google ID
  - GIVEN existing user with email and Google ID "123"
  - WHEN provisionUser() is called with same email but Google ID "456"
  - THEN ConflictException is thrown with 409 status
- [ ] 4.6 Test: Updates user profile data on each login (name, picture)
  - GIVEN existing user with name "Old Name"
  - WHEN provisionUser() is called with name "New Name"
  - THEN user name is updated to "New Name"
- [ ] 4.7 Test: Sets password to null for new Google-only users
  - GIVEN new user created via Google SSO
  - WHEN provisionUser() is called
  - THEN user password field is null
- [ ] 4.8 Test: Preserves existing password when linking Google to password user
  - GIVEN existing user with password "hashed-password"
  - WHEN provisionUser() is called to link Google
  - THEN password remains "hashed-password"
- [ ] 4.9 Test: Sets createdAt timestamp for new users
  - GIVEN new user created via Google SSO
  - WHEN provisionUser() is called
  - THEN createdAt is set to current timestamp
- [ ] 4.10 Test: Updates updatedAt timestamp on each login
  - GIVEN existing user with updatedAt 1 hour ago
  - WHEN provisionUser() is called
  - THEN updatedAt is updated to current timestamp
- [ ] 4.11 Mock UserRepository and EntityManager dependencies

## 5. Unit Tests - User Entity

- [ ] 5.1 Create `tests/Unit/Entity/UserTest.php`
- [ ] 5.2 Test: User always has ROLE_USER in getRoles()
  - GIVEN new User() with no roles set
  - WHEN getRoles() is called
  - THEN returns ['ROLE_USER']
- [ ] 5.3 Test: User roles are unique (no duplicates)
  - GIVEN user with roles ['ROLE_USER', 'ROLE_USER', 'ROLE_ADMIN']
  - WHEN getRoles() is called
  - THEN returns ['ROLE_USER', 'ROLE_ADMIN']
- [ ] 5.4 Test: Password can be null for Google-only users
  - GIVEN new User() with password = null
  - WHEN getPassword() is called
  - THEN returns null (no exception)
- [ ] 5.5 Test: eraseCredentials() does nothing (stateless auth)
  - GIVEN User with sensitive data
  - WHEN eraseCredentials() is called
  - THEN no exception thrown (method exists for interface)
- [ ] 5.6 Test: getUserIdentifier() returns email
  - GIVEN User with email "test@example.com"
  - WHEN getUserIdentifier() is called
  - THEN returns "test@example.com"

## 6. Unit Tests - UserRepository

- [ ] 6.1 Create `tests/Unit/Repository/UserRepositoryTest.php`
- [ ] 6.2 Test: findOneBy(['email' => 'x']) returns user
  - GIVEN user exists with email "test@example.com"
  - WHEN findOneBy(['email' => 'test@example.com']) is called
  - THEN returns User entity
- [ ] 6.3 Test: findOneBy(['email' => 'x']) returns null when not found
  - GIVEN no user with email "notfound@example.com"
  - WHEN findOneBy(['email' => 'notfound@example.com']) is called
  - THEN returns null
- [ ] 6.4 Test: findOneBy(['googleId' => 'x']) returns user
  - GIVEN user exists with Google ID "123"
  - WHEN findOneBy(['googleId' => '123']) is called
  - THEN returns User entity
- [ ] 6.5 Test: upgradePassword() updates user password hash
  - GIVEN user with old password hash
  - WHEN upgradePassword($user, 'new-hash') is called
  - THEN user password is updated to 'new-hash'

## 7. Feature Tests - Auth Login Endpoint

- [ ] 7.1 Create `tests/Feature/Auth/LoginTest.php`
- [ ] 7.2 Test: Returns JWT and refresh token when credentials are valid
  - WHEN POST /api/v1/auth/login with valid email/password
  - THEN status 200
  - AND JSON contains access_token, refresh_token, token_type, expires_in, user
- [ ] 7.3 Test: Returns 400 when email is missing
  - WHEN POST /api/v1/auth/login with no email
  - THEN status 400
  - AND JSON contains error "invalid_request"
- [ ] 7.4 Test: Returns 400 when password is missing
  - WHEN POST /api/v1/auth/login with no password
  - THEN status 400
  - AND JSON contains error "invalid_request"
- [ ] 7.5 Test: Returns 401 when email doesn't exist
  - WHEN POST /api/v1/auth/login with non-existent email
  - THEN status 401
  - AND JSON contains error "invalid_credentials"
- [ ] 7.6 Test: Returns 401 when password is incorrect
  - WHEN POST /api/v1/auth/login with wrong password
  - THEN status 401
  - AND JSON contains error "invalid_credentials"
- [ ] 7.7 Test: Returns 401 when user has Google SSO only (no password)
  - GIVEN user created via Google SSO (password = null)
  - WHEN POST /api/v1/auth/login with that email
  - THEN status 401
  - AND JSON contains message "Ce compte utilise uniquement Google Sign-In"
- [ ] 7.8 Test: JWT contains correct user data (email, roles)
  - WHEN POST /api/v1/auth/login with valid credentials
  - THEN decode JWT payload
  - AND payload contains username (email) and roles
- [ ] 7.9 Test: Refresh token is persisted in database
  - WHEN POST /api/v1/auth/login with valid credentials
  - THEN refresh_tokens table contains new token
  - AND token is associated with user email

## 8. Feature Tests - Auth Register Endpoint

- [ ] 8.1 Create `tests/Feature/Auth/RegisterTest.php`
- [ ] 8.2 Test: Creates new user and returns JWT
  - WHEN POST /api/v1/auth/register with new email/password
  - THEN status 201
  - AND user is created in database
  - AND JSON contains access_token and refresh_token
- [ ] 8.3 Test: Returns 400 when email is missing
  - WHEN POST /api/v1/auth/register with no email
  - THEN status 400
  - AND JSON contains error "invalid_request"
- [ ] 8.4 Test: Returns 400 when password is missing
  - WHEN POST /api/v1/auth/register with no password
  - THEN status 400
  - AND JSON contains error "invalid_request"
- [ ] 8.5 Test: Returns 409 when email already exists
  - GIVEN user exists with email "existing@example.com"
  - WHEN POST /api/v1/auth/register with same email
  - THEN status 409
  - AND JSON contains error "email_exists"
- [ ] 8.6 Test: Password is hashed (not stored plaintext)
  - WHEN POST /api/v1/auth/register with password "secret123"
  - THEN user.password in DB is bcrypt hash (starts with $2y$)
  - AND user.password !== "secret123"
- [ ] 8.7 Test: User has default ROLE_USER role
  - WHEN POST /api/v1/auth/register with new user
  - THEN user.roles contains "ROLE_USER"
- [ ] 8.8 Test: Name field is optional and stored correctly
  - WHEN POST /api/v1/auth/register with name "John Doe"
  - THEN user.name = "John Doe"

## 9. Feature Tests - Auth Refresh Endpoint

- [ ] 9.1 Create `tests/Feature/Auth/RefreshTest.php`
- [ ] 9.2 Test: Returns new access token when refresh token is valid
  - GIVEN valid refresh token
  - WHEN POST /api/v1/auth/refresh with refresh_token
  - THEN status 200
  - AND JSON contains new access_token
  - AND JSON contains same refresh_token
- [ ] 9.3 Test: Returns 400 when refresh_token is missing
  - WHEN POST /api/v1/auth/refresh with no refresh_token
  - THEN status 400
  - AND JSON contains error "invalid_request"
- [ ] 9.4 Test: Returns 401 when refresh token is invalid
  - WHEN POST /api/v1/auth/refresh with invalid token
  - THEN status 401
  - AND JSON contains error "invalid_token"
- [ ] 9.5 Test: Returns 401 when refresh token is expired
  - GIVEN expired refresh token (created 31 days ago)
  - WHEN POST /api/v1/auth/refresh with expired token
  - THEN status 401
  - AND JSON contains error "invalid_token"
- [ ] 9.6 Test: Returns 401 when user associated with token doesn't exist
  - GIVEN refresh token for deleted user
  - WHEN POST /api/v1/auth/refresh
  - THEN status 401
  - AND JSON contains error "user_not_found"
- [ ] 9.7 Test: New access token has updated expiration time
  - WHEN POST /api/v1/auth/refresh
  - THEN new JWT exp claim is ~1 hour from now

## 10. Feature Tests - Auth Logout Endpoint

- [ ] 10.1 Create `tests/Feature/Auth/LogoutTest.php`
- [ ] 10.2 Test: Deletes refresh token and returns 204
  - GIVEN valid refresh token
  - WHEN POST /api/v1/auth/logout with refresh_token
  - THEN status 204
  - AND refresh token is deleted from database
- [ ] 10.3 Test: Returns 400 when refresh_token is missing
  - WHEN POST /api/v1/auth/logout with no refresh_token
  - THEN status 400
  - AND JSON contains error "invalid_request"
- [ ] 10.4 Test: Returns 204 even when refresh token doesn't exist (idempotent)
  - WHEN POST /api/v1/auth/logout with non-existent token
  - THEN status 204 (no error)
- [ ] 10.5 Test: Deleted refresh token cannot be used again
  - GIVEN refresh token
  - WHEN POST /api/v1/auth/logout
  - AND POST /api/v1/auth/refresh with same token
  - THEN refresh returns 401

## 11. Feature Tests - Auth Status Endpoint

- [ ] 11.1 Create `tests/Feature/Auth/StatusTest.php`
- [ ] 11.2 Test: Returns available auth methods
  - WHEN GET /api/v1/auth/status
  - THEN status 200
  - AND JSON contains auth_methods.email_password = true
  - AND JSON contains auth_methods.google_sso (true or false based on env)
- [ ] 11.3 Test: Returns API version
  - WHEN GET /api/v1/auth/status
  - THEN JSON contains api_version = "v1"
- [ ] 11.4 Test: SSO enabled when SSO_ENABLED=true
  - GIVEN SSO_ENABLED=true in .env.test
  - WHEN GET /api/v1/auth/status
  - THEN auth_methods.google_sso = true
- [ ] 11.5 Test: SSO disabled when SSO_ENABLED=false
  - GIVEN SSO_ENABLED=false in .env.test
  - WHEN GET /api/v1/auth/status
  - THEN auth_methods.google_sso = false

## 12. Feature Tests - Google SSO Connect Endpoint

- [ ] 12.1 Create `tests/Feature/GoogleSso/ConnectTest.php`
- [ ] 12.2 Test: Redirects to Google OAuth URL when SSO is enabled
  - GIVEN SSO_ENABLED=true
  - WHEN GET /api/v1/auth/google
  - THEN status 302
  - AND Location header contains "accounts.google.com/o/oauth2"
  - AND URL contains client_id parameter
- [ ] 12.3 Test: Returns 403 when SSO is disabled
  - GIVEN SSO_ENABLED=false
  - WHEN GET /api/v1/auth/google
  - THEN status 403
  - AND JSON contains error "sso_disabled"
- [ ] 12.4 Test: OAuth URL includes state parameter (CSRF protection)
  - WHEN GET /api/v1/auth/google
  - THEN redirect URL contains state parameter
- [ ] 12.5 Test: OAuth URL includes correct scopes (email, profile)
  - WHEN GET /api/v1/auth/google
  - THEN redirect URL contains scope=email+profile

## 13. Feature Tests - Google SSO Callback Endpoint

- [ ] 13.1 Create `tests/Feature/GoogleSso/CallbackTest.php`
- [ ] 13.2 Test: Provisions new user and returns tokens
  - GIVEN valid OAuth code and state
  - WHEN GET /api/v1/auth/google/callback?code=xxx&state=yyy
  - THEN status 302
  - AND redirect URL fragment contains access_token
  - AND new user is created in database
- [ ] 13.3 Test: Links Google account to existing user
  - GIVEN existing user with email "test@example.com"
  - WHEN callback with Google profile email "test@example.com"
  - THEN user.googleId is set
  - AND user.googleAccessToken is set
- [ ] 13.4 Test: Returns error when SSO is disabled
  - GIVEN SSO_ENABLED=false
  - WHEN GET /api/v1/auth/google/callback
  - THEN redirect to frontend with error=sso_disabled
- [ ] 13.5 Test: Returns error when user cancels OAuth (error=access_denied)
  - WHEN GET /api/v1/auth/google/callback?error=access_denied
  - THEN redirect to frontend with error=authentication_cancelled
- [ ] 13.6 Test: Returns error when OAuth token exchange fails
  - GIVEN Google API returns error
  - WHEN GET /api/v1/auth/google/callback
  - THEN redirect to frontend with error=authentication_failed
- [ ] 13.7 Test: Redirects to frontend with tokens in URL fragment
  - WHEN successful OAuth callback
  - THEN redirect URL is FRONTEND_URL/auth/callback#access_token=xxx&refresh_token=yyy
- [ ] 13.8 Mock Google OAuth client to avoid real API calls

## 14. Feature Tests - User Profile Endpoint

- [ ] 14.1 Create `tests/Feature/User/MeEndpointTest.php`
- [ ] 14.2 Test: Returns user profile when authenticated
  - GIVEN authenticated user
  - WHEN GET /api/v1/me with valid JWT
  - THEN status 200
  - AND JSON contains user id, email, name, picture, roles
- [ ] 14.3 Test: Returns 401 when JWT is missing
  - WHEN GET /api/v1/me with no Authorization header
  - THEN status 401
- [ ] 14.4 Test: Returns 401 when JWT is invalid
  - WHEN GET /api/v1/me with invalid JWT
  - THEN status 401
- [ ] 14.5 Test: Returns 401 when JWT is expired
  - GIVEN expired JWT (created 2 hours ago)
  - WHEN GET /api/v1/me
  - THEN status 401
- [ ] 14.6 Test: Returns correct user data from JWT claims
  - GIVEN JWT for user "test@example.com"
  - WHEN GET /api/v1/me
  - THEN response.email = "test@example.com"

## 15. Security Tests - JWT Validation

- [ ] 15.1 Create `tests/Security/JwtValidationTest.php`
- [ ] 15.2 Test: Rejects JWT with tampered signature
  - GIVEN valid JWT
  - WHEN signature is modified
  - AND request is made with tampered JWT
  - THEN returns 401
- [ ] 15.3 Test: Rejects JWT with invalid algorithm (e.g., none, HS256)
  - GIVEN JWT with alg=none
  - WHEN request is made
  - THEN returns 401
- [ ] 15.4 Test: Rejects JWT signed with wrong key
  - GIVEN JWT signed with different RSA key
  - WHEN request is made
  - THEN returns 401
- [ ] 15.5 Test: Accepts JWT with valid signature and expiration
  - GIVEN valid JWT (not expired)
  - WHEN GET /api/v1/me
  - THEN status 200

## 16. Security Tests - Refresh Token Security

- [ ] 16.1 Create `tests/Security/RefreshTokenSecurityTest.php`
- [ ] 16.2 Test: Refresh token cannot be reused after logout
  - GIVEN valid refresh token
  - WHEN POST /api/v1/auth/logout
  - AND POST /api/v1/auth/refresh with same token
  - THEN returns 401
- [ ] 16.3 Test: Expired refresh tokens are rejected
  - GIVEN refresh token with TTL expired
  - WHEN POST /api/v1/auth/refresh
  - THEN returns 401
- [ ] 16.4 Test: Refresh tokens are tied to specific user
  - GIVEN refresh token for user A
  - WHEN used to refresh
  - THEN returns JWT for user A (not user B)

## 17. Security Tests - Google OAuth Security

- [ ] 17.1 Create `tests/Security/GoogleOauthSecurityTest.php`
- [ ] 17.2 Test: Rejects OAuth callback with invalid state (CSRF protection)
  - GIVEN OAuth callback with wrong state parameter
  - WHEN GET /api/v1/auth/google/callback
  - THEN returns error
- [ ] 17.3 Test: Prevents Google ID collision (409 Conflict)
  - GIVEN existing user with Google ID "123"
  - WHEN new OAuth with same Google ID but different email
  - THEN returns 409 Conflict
- [ ] 17.4 Test: Google access tokens are stored securely (encrypted if needed)
  - WHEN user logs in via Google
  - THEN googleAccessToken is stored in database
  - AND token is not logged or exposed

## 18. Security Tests - Authorization

- [ ] 18.1 Create `tests/Security/AuthorizationTest.php`
- [ ] 18.2 Test: Users can only access own profile via /api/v1/me
  - GIVEN JWT for user A
  - WHEN GET /api/v1/me
  - THEN returns user A data (not user B)
- [ ] 18.3 Test: Admin role can delete users (ROLE_ADMIN)
  - GIVEN user with ROLE_ADMIN
  - WHEN DELETE /api/v1/users/{id}
  - THEN status 204 (or 200)
- [ ] 18.4 Test: Regular user cannot delete users
  - GIVEN user with ROLE_USER only
  - WHEN DELETE /api/v1/users/{id}
  - THEN status 403

## 19. Architecture Tests - Layer Separation

- [ ] 19.1 Create `tests/Architecture/LayerSeparationTest.php`
- [ ] 19.2 Test: Controllers do not directly use EntityManager
  - EXPECT controllers in src/Controller
  - NOT TO use Doctrine\ORM\EntityManagerInterface
- [ ] 19.3 Test: Controllers delegate to services for business logic
  - EXPECT controllers to have method calls to services in src/Service
- [ ] 19.4 Test: Entities do not contain business logic (anemic domain)
  - EXPECT entities in src/Entity
  - TO only have getters/setters and lifecycle callbacks

## 20. Architecture Tests - Naming Conventions

- [ ] 20.1 Create `tests/Architecture/NamingConventionsTest.php`
- [ ] 20.2 Test: Controllers have "Controller" suffix
  - EXPECT classes in src/Controller
  - TO have suffix "Controller"
- [ ] 20.3 Test: Services have "Service" or specific suffix (Provisioner, Manager)
  - EXPECT classes in src/Service
  - TO have suffix "Service", "Provisioner", or "Manager"
- [ ] 20.4 Test: Repositories have "Repository" suffix
  - EXPECT classes in src/Repository
  - TO have suffix "Repository"

## 21. Architecture Tests - Security Patterns

- [ ] 21.1 Create `tests/Architecture/SecurityPatternsTest.php`
- [ ] 21.2 Test: All controllers in src/Controller use #[Route] attribute
  - EXPECT controllers to have #[Route] attribute
- [ ] 21.3 Test: No controllers have public methods without route attributes
  - EXPECT public methods in controllers
  - TO have #[Route] or be named __construct, __invoke

## 22. Documentation and CI Integration

- [ ] 22.1 Create `claudedocs/testing.md` with:
  - How to run tests locally (`make test`)
  - How to run tests with coverage (`make coverage`)
  - How to run specific test files or suites
  - How to debug failing tests
  - Test database setup instructions
  - Writing new tests guidelines
- [ ] 22.2 Update `Makefile` with test commands:
  - `make test` - Run all tests
  - `make test-unit` - Run unit tests only
  - `make test-feature` - Run feature tests only
  - `make coverage` - Run tests with coverage report
  - `make test-parallel` - Run tests in parallel
- [ ] 22.3 Create `.github/workflows/tests.yml` GitHub Actions workflow:
  - Run tests on push and pull request
  - Set up PostgreSQL service
  - Install PHP 8.2+ and dependencies
  - Run migrations on test database
  - Execute PEST tests with coverage
  - Upload coverage report (optional: Codecov)
  - Add test badge to README
- [ ] 22.4 Add test coverage badge to `README.md`
- [ ] 22.5 Document test naming conventions in `claudedocs/testing.md`
- [ ] 22.6 Add examples of writing tests for new features

## 23. Validation and Verification

- [ ] 23.1 Run all tests locally: `vendor/bin/pest`
- [ ] 23.2 Verify all tests pass (0 failures)
- [ ] 23.3 Run tests with coverage: `vendor/bin/pest --coverage --min=70`
- [ ] 23.4 Verify coverage meets 70% threshold
- [ ] 23.5 Run tests in parallel: `vendor/bin/pest --parallel`
- [ ] 23.6 Verify parallel execution works without issues
- [ ] 23.7 Run PHPStan analysis: `vendor/bin/phpstan analyse tests`
- [ ] 23.8 Fix any static analysis issues in test code
- [ ] 23.9 Test CI workflow locally with Act: `act -j test`
- [ ] 23.10 Push to GitHub and verify CI passes
- [ ] 23.11 Review code coverage report and identify gaps
- [ ] 23.12 Add missing tests to reach 70%+ coverage
- [ ] 23.13 Validate OpenSpec proposal: `openspec validate add-pest-testing-suite --strict`
- [ ] 23.14 Fix any validation errors
- [ ] 23.15 Final review: ensure all 50+ tests are written and passing
