# Design: Add PEST PHP Testing Suite

## Overview

This change introduces comprehensive automated testing using PEST PHP, a modern testing framework built on PHPUnit. The testing infrastructure will cover unit tests, feature tests, security tests, and architectural tests for the existing JWT authentication and Google SSO implementation.

## Architecture

### Testing Layers

```
┌─────────────────────────────────────────────────────┐
│              Architecture Tests                      │
│  (Enforce conventions, layer separation, security)   │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Feature Tests (API)                     │
│  (HTTP requests, database, real Symfony services)    │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Unit Tests                              │
│  (Isolated components, mocked dependencies)          │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│              Code (Controllers, Services, Entities)  │
└─────────────────────────────────────────────────────┘
```

### Test Database Strategy

**Separate test database** to avoid polluting development data:
- Database: `chatrealtime_test` (PostgreSQL)
- Migrations applied automatically before tests
- Fixtures loaded in `setUp()` methods
- Transactions rolled back after each test (isolation)

**Database lifecycle:**
```
Test Suite Start
├─ Create/migrate test database (doctrine:database:create --env=test)
├─ Apply migrations (doctrine:migrations:migrate --env=test)
└─ Run tests
    └─ Each test:
        ├─ Begin transaction
        ├─ Load fixtures
        ├─ Execute test
        └─ Rollback transaction (cleanup)
```

### PEST Configuration Files

**Files to create:**
- `phpunit.xml.dist` - PHPUnit/PEST XML configuration
- `tests/Pest.php` - PEST global configuration, helpers, uses()
- `.env.test` - Test environment variables
- `tests/bootstrap.php` - Bootstrap file for test setup

**Directory structure:**
```
tests/
├── Pest.php                    # Global config, helpers
├── bootstrap.php               # Test bootstrap
├── Unit/                       # Unit tests (isolated)
│   ├── Service/
│   │   └── GoogleUserProvisionerTest.php
│   ├── Entity/
│   │   └── UserTest.php
│   └── Repository/
│       └── UserRepositoryTest.php
├── Feature/                    # Feature tests (HTTP/DB)
│   ├── Auth/
│   │   ├── LoginTest.php
│   │   ├── RegisterTest.php
│   │   ├── RefreshTest.php
│   │   ├── LogoutTest.php
│   │   └── StatusTest.php
│   ├── GoogleSso/
│   │   ├── ConnectTest.php
│   │   └── CallbackTest.php
│   └── User/
│       └── MeEndpointTest.php
├── Security/                   # Security-focused tests
│   ├── JwtValidationTest.php
│   ├── RefreshTokenSecurityTest.php
│   ├── GoogleOauthSecurityTest.php
│   └── AuthorizationTest.php
└── Architecture/               # Architectural rules
    ├── LayerSeparationTest.php
    ├── NamingConventionsTest.php
    └── SecurityPatternsTest.php
```

## Key Design Decisions

### 1. PEST PHP vs PHPUnit

**Decision:** Use PEST PHP as primary testing framework

**Rationale:**
- ✅ **Modern syntax**: Function-based tests more readable than class-based
- ✅ **Better DX**: Fewer imports, cleaner assertions (`expect()->toBe()`)
- ✅ **Symfony integration**: `pestphp/pest-plugin-symfony` provides excellent API test helpers
- ✅ **Parallel execution**: Built-in support for faster test runs
- ✅ **Architectural testing**: `pestphp/pest-plugin-arch` enforces conventions
- ✅ **100% PHPUnit compatible**: Can mix PHPUnit tests if needed

**Example:**
```php
// PEST syntax (chosen)
it('returns JWT when credentials are valid', function () {
    postJson('/api/v1/auth/login', [
        'email' => 'user@test.com',
        'password' => 'password123',
    ])
    ->assertOk()
    ->assertJsonStructure(['access_token', 'refresh_token', 'user']);
});

// PHPUnit syntax (not chosen)
public function testReturnsJwtWhenCredentialsAreValid(): void
{
    $this->postJson('/api/v1/auth/login', [
        'email' => 'user@test.com',
        'password' => 'password123',
    ])
    ->assertOk()
    ->assertJsonStructure(['access_token', 'refresh_token', 'user']);
}
```

### 2. Test Isolation Strategy

**Decision:** Database transactions with automatic rollback

**Rationale:**
- ✅ **Fast**: No need to truncate/rebuild database between tests
- ✅ **Isolated**: Each test starts with clean state
- ✅ **Simple**: Symfony's `DatabaseTransactionTestCase` handles it automatically
- ❌ **Limitation**: Cannot test actual transactions (nested transaction conflict)

**Alternative considered:** Database truncation
- ❌ Slower (drop all data, reload fixtures)
- ✅ Can test actual transactions
- Decision: Speed over transaction testing (transaction bugs are rare in our app)

### 3. Mocking Strategy for Google OAuth

**Decision:** Mock Google OAuth client in all tests

**Rationale:**
- ✅ **Speed**: No real HTTP requests to Google APIs
- ✅ **Reliability**: Tests don't fail due to Google downtime
- ✅ **Control**: Can test error scenarios (token expired, user denied, etc.)
- ✅ **No credentials needed**: Developers don't need Google OAuth sandbox setup
- ❌ **Limitation**: Doesn't catch integration issues with real Google API

**Implementation:**
```php
use KnpU\OAuth2ClientBundle\Client\OAuth2ClientInterface;

beforeEach(function () {
    $this->googleClient = mock(OAuth2ClientInterface::class);
    $this->app->instance(OAuth2ClientInterface::class, $this->googleClient);
});

it('provisions user from Google profile', function () {
    $googleUser = new GoogleUser([
        'sub' => '123456789012345678901',
        'email' => 'google@example.com',
        'name' => 'Test User',
        'picture' => 'https://lh3.googleusercontent.com/a/test',
    ]);

    $this->googleClient
        ->shouldReceive('fetchUserFromToken')
        ->once()
        ->andReturn($googleUser);

    // Test continues...
});
```

**Alternative:** Real Google OAuth with sandbox credentials
- Decision: Not worth complexity for CI setup

### 4. Test Data Management

**Decision:** Fixtures + inline test data

**Rationale:**
- ✅ **Fixtures**: Provide common baseline data (4 users from AppFixtures)
- ✅ **Inline data**: Tests create specific data they need (readable, isolated)
- ✅ **Flexibility**: Tests aren't coupled to fixture structure

**Example:**
```php
it('returns error when email is already taken', function () {
    // Use fixture user
    $existingEmail = 'user@test.com'; // From AppFixtures

    postJson('/api/v1/auth/register', [
        'email' => $existingEmail,
        'password' => 'newpassword',
    ])
    ->assertStatus(409)
    ->assertJson(['error' => 'email_exists']);
});

it('creates user with custom role', function () {
    // Create specific test data
    $admin = User::factory()->create(['roles' => ['ROLE_ADMIN']]);

    // Test continues...
});
```

### 5. Code Coverage Target

**Decision:** 70% overall, 85% for authentication code

**Rationale:**
- ✅ **Realistic**: Achievable without writing tests for trivial getters/setters
- ✅ **Focused**: High coverage for security-critical code (auth, JWT validation)
- ✅ **Pragmatic**: 100% coverage has diminishing returns

**Coverage enforcement:**
```xml
<!-- phpunit.xml.dist -->
<coverage>
    <include>
        <directory suffix=".php">src</directory>
    </include>
    <exclude>
        <directory>src/Kernel.php</directory>
        <directory>src/DataFixtures</directory>
    </exclude>
    <report>
        <html outputDirectory="var/coverage"/>
        <text outputFile="php://stdout" showUncoveredFiles="false"/>
    </report>
</coverage>
```

### 6. Parallel Test Execution

**Decision:** Enable parallel execution with `--parallel`

**Rationale:**
- ✅ **Speed**: 3-5x faster on multi-core machines
- ✅ **Easy**: PEST handles test isolation automatically
- ❌ **Resource usage**: More database connections, memory
- Decision: Enable by default, disable in CI if resource-constrained

**Configuration:**
```bash
# Run tests in parallel (auto-detect cores)
vendor/bin/pest --parallel

# Run with specific number of processes
vendor/bin/pest --parallel --processes=4
```

## Component Design

### PEST Global Configuration (`tests/Pest.php`)

```php
<?php

use Symfony\Component\HttpFoundation\Response;
use Tests\Support\InteractsWithDatabase;
use Tests\Support\InteractsWithJwt;

uses(
    Tests\TestCase::class,
    InteractsWithDatabase::class,
)->in('Feature', 'Security');

uses(
    Tests\TestCase::class,
)->in('Unit');

uses(
    Tests\TestCase::class,
)->in('Architecture');

// Global helpers
function createUser(array $attributes = []): User
{
    $user = new User();
    $user->setEmail($attributes['email'] ?? 'test@example.com');
    $user->setPassword($attributes['password'] ?? 'hashed-password');
    $user->setName($attributes['name'] ?? 'Test User');
    $user->setRoles($attributes['roles'] ?? ['ROLE_USER']);

    return $user;
}

function generateJwt(User $user): string
{
    return app(JWTTokenManagerInterface::class)->create($user);
}

// Expectations
expect()->extend('toBeValidJwt', function () {
    expect($this->value)
        ->toBeString()
        ->toMatch('/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/');
});
```

### Traits for Reusable Test Logic

**`tests/Support/InteractsWithDatabase.php`:**
```php
<?php

namespace Tests\Support;

use Doctrine\ORM\EntityManagerInterface;

trait InteractsWithDatabase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->beginDatabaseTransaction();
    }

    protected function tearDown(): void
    {
        $this->rollbackDatabaseTransaction();
        parent::tearDown();
    }

    protected function beginDatabaseTransaction(): void
    {
        $this->app->get(EntityManagerInterface::class)
            ->getConnection()
            ->beginTransaction();
    }

    protected function rollbackDatabaseTransaction(): void
    {
        $this->app->get(EntityManagerInterface::class)
            ->getConnection()
            ->rollBack();
    }
}
```

**`tests/Support/InteractsWithJwt.php`:**
```php
<?php

namespace Tests\Support;

trait InteractsWithJwt
{
    protected function actingAs(User $user): self
    {
        $token = generateJwt($user);
        $this->withHeader('Authorization', "Bearer {$token}");

        return $this;
    }

    protected function decodeJwt(string $token): array
    {
        $parts = explode('.', $token);
        return json_decode(base64_decode($parts[1]), true);
    }
}
```

## Security Considerations

### Test Data Security

- ✅ **Separate test database**: Never touch production/development data
- ✅ **Test-only credentials**: All test users marked clearly (e.g., `test@example.com`)
- ✅ **No real OAuth**: Mock Google OAuth client (no real credentials needed)
- ✅ **Environment isolation**: `.env.test` prevents accidental production access

### Security Test Coverage

Tests MUST verify:
1. **JWT signature validation**: Reject tampered tokens
2. **JWT expiration**: Reject expired tokens
3. **Refresh token rotation**: Prevent token reuse attacks
4. **Google OAuth state**: CSRF protection via state parameter
5. **Password hashing**: Verify bcrypt cost factor
6. **Authorization**: Users can only access own resources
7. **Google ID collision**: Prevent account hijacking

## Performance Considerations

### Test Execution Speed

**Target:** <30 seconds for full test suite (50+ tests)

**Optimizations:**
- ✅ **Parallel execution**: Use `--parallel` flag (3-5x speedup)
- ✅ **Database transactions**: Faster than truncation
- ✅ **Mock external services**: No real HTTP requests to Google
- ✅ **Lazy loading**: Load fixtures only when needed

**Benchmarks (estimated):**
- Unit tests: ~5 seconds (15 tests)
- Feature tests: ~15 seconds (25 tests, with DB)
- Security tests: ~5 seconds (10 tests)
- Architecture tests: ~3 seconds (5 tests)
- **Total: ~28 seconds** (within target)

### CI Pipeline Integration

**GitHub Actions workflow:**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: shivammathur/setup-php@v2
        with:
          php-version: 8.2
          extensions: pdo_pgsql, intl
          coverage: xdebug
      - run: composer install
      - run: php bin/console doctrine:database:create --env=test
      - run: php bin/console doctrine:migrations:migrate --env=test --no-interaction
      - run: vendor/bin/pest --coverage --min=70
```

## Migration Path

### Phase 1: Foundation (Days 1-2)
1. Install PEST dependencies
2. Create test configuration files
3. Set up test database
4. Create helper traits and functions

### Phase 2: Unit Tests (Days 3-4)
1. GoogleUserProvisioner service tests (10 tests)
2. User entity tests (5 tests)
3. UserRepository tests (5 tests)

### Phase 3: Feature Tests (Days 5-7)
1. Auth endpoint tests (15 tests)
2. Google SSO endpoint tests (5 tests)
3. Protected endpoint tests (5 tests)

### Phase 4: Security Tests (Days 8-9)
1. JWT validation tests (5 tests)
2. Refresh token security tests (3 tests)
3. Authorization tests (2 tests)

### Phase 5: Architecture Tests (Day 10)
1. Layer separation tests (2 tests)
2. Naming conventions tests (2 tests)
3. Security pattern tests (1 test)

### Phase 6: CI Integration (Day 10)
1. Add GitHub Actions workflow
2. Configure code coverage reporting
3. Add test badge to README

## Trade-offs

### Chosen: PEST PHP
- ✅ Better DX, modern syntax
- ❌ Smaller community than PHPUnit

### Chosen: Database transactions
- ✅ Fast test execution
- ❌ Cannot test actual database transactions

### Chosen: Mock Google OAuth
- ✅ Fast, reliable, no credentials needed
- ❌ Doesn't catch real API integration issues

### Chosen: 70% code coverage target
- ✅ Realistic, achievable
- ❌ Some code paths may not be tested

## Open Questions

1. **Mutation testing?** Should we add Infection later for mutation testing?
   - Recommendation: Add in future iteration (not in initial scope)

2. **Browser testing?** Should we add Symfony Panther for browser tests?
   - Recommendation: Not needed (API-only, no frontend yet)

3. **Load testing?** Should we add load tests with k6 or Gatling?
   - Recommendation: Add when performance becomes concern (not in initial scope)

4. **Snapshot testing?** Should we use Spatie's snapshot testing for JSON responses?
   - Recommendation: Maybe later (initial tests use explicit assertions)
