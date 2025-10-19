# Proposal: Add PEST PHP Testing Suite

## Why

Currently, the project has **no automated testing infrastructure** despite having critical authentication and security features (JWT, Google SSO, refresh tokens). This creates significant risks:

- **Security vulnerabilities** may go undetected (e.g., token validation bypasses, OAuth flow exploits)
- **Regressions** can be introduced when refactoring or adding features
- **Confidence** in deployments is low without test coverage
- **Development velocity** slows down due to manual testing overhead
- **Code quality** suffers without test-driven feedback loops

PEST PHP provides a modern, expressive testing framework built on PHPUnit with:
- **Elegant syntax** with function-based tests instead of classes
- **Better DX** with powerful expectations and intuitive assertions
- **Symfony integration** via pestphp/pest-plugin-symfony for API testing
- **Code coverage** reporting with zero configuration
- **Parallel execution** for faster test runs
- **Architectural testing** to enforce project conventions

## What Changes

### High-Level Summary

Add PEST PHP testing framework with comprehensive test coverage for:
1. **Authentication endpoints** (login, register, refresh, logout, status)
2. **JWT token generation and validation** (signing, expiration, claims)
3. **Google SSO flow** (OAuth redirect, callback, user provisioning)
4. **User entity and repository** (database operations, constraints)
5. **Security configurations** (firewalls, access control)
6. **Architectural rules** (no direct entity usage in controllers, service layer patterns)

### Affected Specifications

This change introduces **new capabilities** for testing:

- **`pest-setup`**: PEST PHP installation, configuration, and helper utilities
- **`unit-testing`**: Unit tests for services, entities, and business logic in isolation
- **`feature-testing`**: Feature tests for API endpoints with real HTTP requests and database
- **`security-testing`**: Security-focused tests for authentication, authorization, and token validation
- **`architecture-testing`**: Architectural constraints enforcement (e.g., controllers don't query DB directly)

### Dependencies

**Required Before This Change:**
- ✅ JWT authentication implementation (`add-jwt-google-sso-auth` change)
- ✅ Database migrations applied
- ✅ Fixtures created for test data

**Blocks Future Work:**
- Future features should include tests written with PEST
- CI/CD pipeline setup will depend on PEST test suite

### Frontend Integration Points

**No frontend changes required**. This is purely backend testing infrastructure.

**Frontend benefits indirectly**:
- More stable API with fewer breaking changes
- Documented API behavior through test scenarios
- Faster bug fixes with reproducible test cases

### Security Considerations

**Security Testing Coverage:**
- ✅ JWT signature validation (reject tampered tokens)
- ✅ Token expiration enforcement (reject expired tokens)
- ✅ Refresh token rotation (prevent reuse attacks)
- ✅ Google OAuth state parameter (CSRF protection)
- ✅ Password hashing (bcrypt with proper cost factor)
- ✅ Authorization rules (users can only access own data)
- ✅ Google ID collision protection (409 Conflict when linking existing Google ID)

**Test Data Security:**
- Use fixture data only in test environment (`APP_ENV=test`)
- Separate test database from development database
- Mock Google OAuth responses (no real API calls in tests)
- Test credentials clearly marked as test-only (e.g., `test@example.com`)

## Impact

### User-Facing Changes

**None**. Users do not interact with tests.

### API Changes

**None**. No API endpoints, request/response formats, or behaviors change.

### Database Schema Changes

**New test database** will be created automatically:
- Database name: `chatrealtime_test` (separate from `chatrealtime` dev DB)
- Schema identical to development (migrations applied)
- Data reset before each test run (fixtures loaded)

### Configuration Changes

**New files:**
- `phpunit.xml.dist` - PHPUnit/PEST configuration
- `tests/Pest.php` - PEST global configuration and helpers
- `.env.test` - Test environment variables

**Modified files:**
- `composer.json` - Add PEST dependencies to `require-dev`
- `Makefile` - Add `make test` and `make coverage` commands

### Breaking Changes

**None**. This is purely additive.

## Migration Plan

### Rollout Strategy

**Phase 1: Setup (Week 1)**
1. Install PEST PHP and dependencies
2. Configure PHPUnit/PEST settings
3. Create test database and fixtures
4. Add helper functions and traits

**Phase 2: Unit Tests (Week 1-2)**
1. Write unit tests for services (GoogleUserProvisioner)
2. Write unit tests for entities (User)
3. Write unit tests for repositories (UserRepository)

**Phase 3: Feature Tests (Week 2)**
1. Write feature tests for auth endpoints (login, register, refresh, logout)
2. Write feature tests for Google SSO (connect, callback)
3. Write feature tests for protected endpoints (/api/v1/me)

**Phase 4: Security Tests (Week 2-3)**
1. Write security tests for JWT validation
2. Write security tests for authorization rules
3. Write security tests for OAuth flow

**Phase 5: Architecture Tests (Week 3)**
1. Write architecture tests for layer separation
2. Write architecture tests for naming conventions
3. Write architecture tests for security patterns

**Phase 6: CI Integration (Week 3)**
1. Add GitHub Actions workflow for tests
2. Add code coverage reporting
3. Enforce minimum coverage thresholds

### Rollback Strategy

**If tests fail in CI:**
- Rollback is trivial: remove test dependencies from `composer.json`
- No application code changes required (tests are isolated)

**If tests reveal bugs:**
- Fix bugs first, then merge tests (tests protect against future bugs)
- Temporarily skip failing tests with `->skip()` if needed

### Data Migration

**No data migration required**. Test database is ephemeral and rebuilt on each run.

## Open Questions

1. **Code coverage target?**
   - Recommendation: 80% overall, 90% for authentication code
   - Should we enforce coverage in CI or just report it?

2. **Parallel test execution?**
   - PEST supports parallel execution with `--parallel`
   - Should we enable by default? (faster but uses more resources)

3. **Mutation testing?**
   - Should we add Infection for mutation testing later?
   - Helps ensure tests actually catch bugs, not just pass

4. **Mock vs Real Google OAuth?**
   - Unit tests: Mock Google OAuth client
   - Feature tests: Mock or use real sandbox credentials?
   - Recommendation: Mock everywhere for speed and reliability

5. **Test naming convention?**
   - PEST uses `it('does something')` or `test('something')`
   - Preference: `it('returns JWT when credentials are valid')` (more readable)

## Success Criteria

✅ **Done when:**
1. PEST PHP installed and configured
2. Test database created and migrations applied
3. At least **50 tests** written covering:
   - 15+ unit tests (services, entities, repositories)
   - 25+ feature tests (API endpoints)
   - 10+ security tests (JWT, OAuth, authorization)
4. Code coverage >70% overall
5. All tests passing in CI
6. `make test` command works locally
7. Documentation added to `claudedocs/testing.md`

✅ **Verified by:**
- `make test` passes with 0 failures
- `make coverage` shows >70% coverage
- GitHub Actions badge shows passing tests
- New developers can run tests locally without issues
