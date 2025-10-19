## Implementation Tasks

### Backend (Symfony API)

#### Task 1: Create JWT Event Listener for Minimal Claims
**File**: `api/src/EventListener/JWTCreatedListener.php`
- Create event listener for `Lexik\Bundle\JWTAuthenticationBundle\Events::JWT_CREATED`
- Override JWT payload to include ONLY: `sub` (user ID), `email`, `iat`, `exp`
- Remove `roles` and any other user data from token payload
- Register listener in `services.yaml`
- **Test**: Decode JWT and verify payload contains only essential claims

#### Task 2: Expose Token TTL in Auth Responses
**File**: `api/src/Controller/AuthController.php`
- Modify `generateTokenResponse()` to read JWT_TOKEN_TTL from DI container instead of `$_ENV`
- Ensure `expires_in` field uses actual configured TTL (already done at line 197, just verify)
- **Test**: Verify login/register/refresh responses include correct `expires_in` value

#### Task 3: Create Demo Login Endpoint (Optional Quick Test)
**File**: `api/src/Controller/AuthController.php`
- Add new endpoint `/api/v1/auth/demo-login` (POST)
- Accept optional `ttl` parameter (default 20 seconds) from request body
- Return token with custom TTL for testing cookie expiration
- Guard with `DEMO_MODE_ENABLED` env variable (default false)
- **Test**: Call endpoint with `ttl=20`, verify token expires in 20s

#### Task 4: Add Backend Tests
**File**: `api/tests/Controller/AuthControllerTest.php`
- Test JWT payload contains only minimal claims (no roles)
- Test `expires_in` matches configured TTL
- Test demo login endpoint (if implemented)
- **Run**: `make test` to verify all tests pass

---

### Frontend (Next.js)

#### Task 5: Update Cookie Helpers to Use Backend TTL
**File**: `frontend/lib/auth.ts`
- Modify `setSession()` to use `expiresIn` parameter from backend response (already accepts it)
- Remove hardcoded TTL values (line 37: `3600 * 1000`, line 84: `30 * 24 * 60 * 60`)
- Read refresh token TTL from environment variable `NEXT_PUBLIC_REFRESH_TOKEN_TTL` (default 2592000)
- **Test**: Verify cookies are set with correct expiration from backend

#### Task 6: Create Session Status API Route
**File**: `frontend/app/api/auth/status/route.ts` (NEW)
- Create GET endpoint `/api/auth/status`
- Read `access_token` cookie and decode JWT (use `jose` library)
- Check if token is expired by comparing `exp` claim with current time
- Return JSON: `{ authenticated: boolean, expiresIn: number | null }`
- Handle missing/invalid cookies gracefully
- **Test**: Call endpoint with valid/expired/missing cookies

#### Task 7: Add Status Check Hook
**File**: `frontend/hooks/use-auth-status.ts` (NEW)
- Create custom hook `useAuthStatus()` using TanStack Query
- Poll `/api/auth/status` every 30 seconds (configurable)
- Return `{ isAuthenticated, expiresIn, isLoading }`
- **Test**: Use hook in a component and verify polling behavior

#### Task 8: Create Demo Login Page (Optional)
**File**: `frontend/app/(public)/demo-login/page.tsx` (NEW)
- Create demo login page with button "Quick Login (20s expiration)"
- Call backend `/api/v1/auth/demo-login` with `ttl=20`
- Show countdown timer using `useAuthStatus()` hook
- Demonstrate automatic refresh when token expires
- Only show page if `NEXT_PUBLIC_DEMO_MODE_ENABLED=true`
- **Test**: Login with demo, watch countdown, verify auto-refresh

#### Task 9: Verify SSR/Server Action Compatibility
**File**: `frontend/lib/api/client.ts`
- Review `apiClient()` function (lines 27-133)
- Verify it works from Server Components (uses `getSession()` which calls `cookies()`)
- Verify it works from Server Actions (same)
- Document limitation: Cannot use in Client Components (cookies() is server-only)
- Add JSDoc comment explaining usage contexts
- **Test**: Call `apiClient()` from Server Component and Server Action

#### Task 10: Add Frontend Tests
**File**: `frontend/__tests__/lib/auth.test.ts` (NEW)
- Test `setSession()` sets cookies with correct TTL
- Test `getSession()` retrieves session correctly
- Test `clearSession()` removes all cookies
- **Run**: `bun test` to verify tests pass

---

### Documentation

#### Task 11: Create TanStack Query Tutorial
**File**: `frontend/AI-DD/17-TANSTACK-QUERY-TUTORIAL.md` (NEW)
- Section 1: ISR (Incremental Static Regeneration) with jsonplaceholder `/posts`
- Section 2: SSR (Server-Side Rendering) with prefetchQuery
- Section 3: Client-side with useQuery hook
- Include working code examples verified against jsonplaceholder
- Add validation steps for each pattern
- **Verify**: Run examples locally and confirm they work

#### Task 12: Update CLAUDE.md Files with Sourcing Instruction
**Files**:
- `CLAUDE.md` (root)
- `api/CLAUDE.md`
- `frontend/CLAUDE.md`
- Add section: "AI Agent Information Sources"
- Include: "n'invente jamais de données, ne donne l'information que si tu as réussi à trouver une vraie information sur les moteurs de recherche"
- **Verify**: Search for section in all 3 files

#### Task 13: Update API Documentation
**File**: `api/openspec/project.md`
- Document JWT claim structure (minimal payload)
- Document demo login endpoint (if implemented)
- Document token TTL configuration
- **Verify**: openspec validation passes

---

### Quality Assurance

#### Task 14: Run Backend Linting and Tests
**Commands**:
```bash
cd api
make tools      # PHPStan analysis
make test       # Run PEST tests
make fixtures   # Reload fixtures if needed
```
**Verify**: All checks pass without errors

#### Task 15: Run Frontend Linting and Type Checking
**Commands**:
```bash
cd frontend
bun run lint        # ESLint
bun run type-check  # TypeScript
bun test            # Run tests (if configured)
```
**Verify**: All checks pass without errors

---

## Implementation Order

**Phase 1 - Backend (2-3 hours)**
1. Task 1: JWT Event Listener ✓
2. Task 2: Expose Token TTL ✓
3. Task 3: Demo Login (optional) ✓
4. Task 4: Backend Tests ✓

**Phase 2 - Frontend Core (2-3 hours)**
5. Task 5: Update Cookie Helpers ✓
6. Task 6: Session Status API ✓
7. Task 7: Auth Status Hook ✓
8. Task 9: SSR Compatibility Review ✓
9. Task 10: Frontend Tests ✓

**Phase 3 - Demo & Docs (1-2 hours)**
10. Task 8: Demo Login Page (optional) ✓
11. Task 11: TanStack Query Tutorial ✓
12. Task 12: Update CLAUDE.md Files ✓
13. Task 13: Update API Docs ✓

**Phase 4 - QA (30 minutes)**
14. Task 14: Backend QA ✓
15. Task 15: Frontend QA ✓

---

## Success Criteria

- ✅ JWT tokens contain ONLY minimal claims (no roles)
- ✅ Frontend cookies use backend-provided TTL
- ✅ Session status API works correctly
- ✅ All existing tests pass
- ✅ All new tests pass
- ✅ No breaking changes to existing auth flow
- ✅ Documentation updated
- ✅ Code passes linting and type checking

---

## Dependencies

**Backend**:
- Existing: LexikJWTAuthenticationBundle, Doctrine, PEST
- No new dependencies required

**Frontend**:
- Existing: next, react, tanstack/react-query
- Add: `jose` for JWT decoding (already in Next.js)
- No other new dependencies required

---

## Notes

- All tasks are **additive** - no breaking changes
- Existing auth flow (login/register/refresh/logout) remains unchanged
- Demo features are opt-in via environment variables
- Tests validate behavior without changing contracts
