# Implementation Tasks: Complete Authentication Architecture with Zustand + AuthDebug

## ✅ Phase 1: Dependencies & Setup - COMPLETED

### 1.1 Install Zustand
- [x] 1.1.1 Run: `cd frontend && bun add zustand`
- [x] 1.1.2 Verify `zustand@^5.0.8` in `package.json`
- [x] 1.1.3 Run: `bun install` to ensure lockfile updated

### 1.2 Create Directory Structure
- [x] 1.2.1 Create: `frontend/stores/`
- [x] 1.2.2 Create: `frontend/components/auth/`
- [x] 1.2.3 Create: `frontend/components/auth/debug/`
- [x] 1.2.4 Create: `frontend/components/auth/providers/`
- [x] 1.2.5 Create: `frontend/lib/dal/`
- [x] 1.2.6 Create: `frontend/lib/auth/`

**Reference**: Match directory structure of `nextjs-auth-symfony-v1/web/`

## ✅ Phase 2: Zustand Auth Store - COMPLETED

### 2.1 Create Auth Store
- [x] 2.1.1 Create file: `frontend/stores/auth-store.ts`
- [x] 2.1.2 Copy EXACT implementation from reference: `web/stores/auth-store.ts` (6643 bytes)
- [x] 2.1.3 Implement state interface:
  ```typescript
  {
    isAuthenticated: boolean
    user: User | null
    accessToken: string | null
    refreshToken: string | null
    tokenTtl: number | null
    tokenExpiry: Date | null
    refreshTokenExpiry: Date | null
  }
  ```
- [ ] 2.1.4 Implement actions:
  - `login(tokens: TokenData)`
  - `loginWithExpiry(tokens: TokenData)`
  - `logout()`
  - `updateTokens(tokens: TokenData)`
  - `updateUser(user: User)`
  - `setTokenExpiry(expiry: Date)`
  - `setRefreshTokenExpiry(expiry: Date)`

### 2.2 Configure Persistence Middleware
- [x] 2.2.1 Add Zustand `persist` middleware
- [x] 2.2.2 Set storage name: `"auth-store"`
- [x] 2.2.3 Configure `skipHydration: typeof window === 'undefined'` for SSR safety
- [x] 2.2.4 Implement custom storage with Date serialization:
  ```typescript
  storage: {
    getItem: (name) => { /* deserialize Dates from ISO strings */ },
    setItem: (name, value) => { /* serialize Dates to ISO strings */ },
    removeItem: (name) => localStorage.removeItem(name)
  }
  ```

### 2.3 Create Selector Hooks
- [ ] 2.3.1 Export: `useAuthStore()` (main hook)
- [ ] 2.3.2 Export: `useIsAuthenticated()` selector
- [ ] 2.3.3 Export: `useUser()` selector
- [ ] 2.3.4 Export: `useAccessToken()` selector
- [ ] 2.3.5 Export: `useRefreshToken()` selector
- [ ] 2.3.6 Export: `useAuthActions()` hook (returns all actions)

### 2.4 Add Type Definitions
- [ ] 2.4.1 Create/update `frontend/types/auth.ts` with:
  ```typescript
  type User = { userId: string; username: string; role: string }
  type TokenData = { access_token: string; refresh_token: string; expires_in: number; refresh_expires_in?: number }
  type AuthState = { isAuthenticated, user, accessToken, refreshToken, tokenTtl, tokenExpiry, refreshTokenExpiry }
  type AuthActions = { login, loginWithExpiry, logout, updateTokens, updateUser, setTokenExpiry, setRefreshTokenExpiry }
  ```

**Reference**: `web/stores/auth-store.ts` lines 1-200
**Test**: Import store in console, verify `useAuthStore.getState()` returns initial state

## ✅ Phase 3: Server-Side Auth Utilities (DAL) - COMPLETED

### 3.1 Create Server DAL
- [x] 3.1.1 Create file: `frontend/lib/dal/server.ts` (244 lines)
- [x] 3.1.2 Copy implementation from reference: `web/lib/dal/server.ts` (9089 bytes)
- [x] 3.1.3 Implement `serverApiFetch(url, init)`:
  - Extract `access_token` and `refresh_token` from cookies
  - Set Cookie header
  - Call backend API
  - Handle 401 with one retry using `handle401Retry()`
- [ ] 3.1.4 Implement `handle401Retry(url, init)`:
  - Call `refreshToken()` server action
  - If success, retry original request with new tokens
  - If fail, throw error for client handling

### 3.2 Implement checkAuth()
- [x] 3.2.1 Implement `checkAuth()` function:
  - Check for `access_token` + `refresh_token` cookies
  - If no cookies, return `null`
  - Call `/api/auth/me` via `serverApiFetch()`
  - Extract user data, roles, tokenTtl, expiresIn
  - Calculate `tokenExpiry = new Date(Date.now() + expiresIn * 1000)`
  - Return format:
    ```typescript
    {
      isAuthenticated: true,
      user: { userId, username, role },
      tokenTtl,
      tokenExpiry
    }
    ```
- [x] 3.2.2 Handle refresh expired scenario:
  - If error message contains "client will handle refresh"
  - Return partial auth for client-side refresh trigger
- [x] 3.2.3 Add comprehensive error handling and logging

### 3.3 Implement Auth Guards
- [x] 3.3.1 Implement `requireAuth()`: Check cookies → fetch user → redirect if fail
- [x] 3.3.2 Implement `requireRole(role)`: Call `requireAuth` → check role → redirect if fail
- [x] 3.3.3 Implement `requireAdmin()`: Wrapper for `requireRole("ROLE_ADMIN")`
- [x] 3.3.4 Implement `hasRole(role)`: Non-blocking role check, returns boolean
- [x] 3.3.5 Implement `isAdmin()`: Wrapper for `hasRole("admin")`

**Reference**: `web/lib/dal/server.ts` lines 1-250
**Test**: In Server Component, call `checkAuth()`, verify returns auth data or null

## ✅ Phase 4: AuthProvider Component - COMPLETED

### 4.1 Create AuthProvider
- [x] 4.1.1 Create file: `frontend/components/auth/providers/AuthProvider.tsx`
- [x] 4.1.2 Copy implementation from reference: `web/components/auth/providers/AuthProvider.tsx` (2306 bytes)
- [x] 4.1.3 Accept `initialAuth` prop (type from checkAuth return)
- [x] 4.1.4 In `useEffect`:
  - Check if `initialAuth?.isAuthenticated === true`
  - If yes, call `updateUser(initialAuth.user)`
  - Set `tokenExpiry` via `setTokenExpiry(initialAuth.tokenExpiry)`
  - If store not authenticated, call `loginWithExpiry({ access_token: "present", refresh_token: "present", expires_in: initialAuth.tokenTtl })`
- [x] 4.1.5 Call `useAutoRefresh()` hook to activate auto-refresh

### 4.2 Create AuthGuard
- [x] 4.2.1 In same file, export `AuthGuard` component
- [x] 4.2.2 For now, simple passthrough: `<>{children}</>`
- [x] 4.2.3 (Future: Can add route protection logic)

### 4.3 Create Index Export
- [x] 4.3.1 Create `frontend/components/auth/index.ts`
- [x] 4.3.2 Export: `AuthProvider`, `AuthGuard`, `AuthDebug` (will create next)

**Reference**: `web/components/auth/providers/AuthProvider.tsx`
**Test**: Wrap app in AuthProvider, verify store updates with initialAuth data

## ✅ Phase 5: AuthDebug Component - COMPLETED

### 5.1 Create AuthDebug Component
- [x] 5.1.1 Create file: `frontend/components/auth/debug/AuthDebug.tsx`
- [x] 5.1.2 Copy EXACT implementation from reference: `web/components/auth/debug/AuthDebug.tsx` (14056 bytes - 400+ lines!)
- [x] 5.1.3 Import required dependencies:
  - `useState`, `useEffect` from React
  - `useAuthStore` from stores
  - `useAuthentication` hook (for `syncUserFromApi`)
  - Lucide icons: `Eye`, `EyeOff`, `Shield`, `Clock`, `User`, `Key`, `RefreshCw`, `Maximize2`

### 5.2 Implement State Management
- [x] 5.2.1 State: `isExpanded` (boolean) - compact panel expand/collapse
- [x] 5.2.2 State: `isModalOpen` (boolean) - full-screen modal
- [x] 5.2.3 State: `currentTime` (Date) - updated every second
- [x] 5.2.4 `useEffect` with `setInterval` for 1-second updates

### 5.3 Implement Time Calculations
- [x] 5.3.1 Function `toDate(value)` - converts Date | number | string to Date
- [x] 5.3.2 Calculate `timeRemaining` (access token): `Math.max(0, (tokenExpiry - currentTime) / 1000)`
- [x] 5.3.3 Calculate `refreshTimeRemaining` (refresh token): similar calculation
- [x] 5.3.4 Function `calculateNextRefreshTime()`:
  ```typescript
  const msUntilExpiry = tokenExpiry - currentTime
  const dynamicLead = Math.max(120000, Math.min(300000, Math.floor(msUntilExpiry * 0.6)))
  const refreshDelay = Math.max(800, msUntilExpiry - dynamicLead)
  return Math.floor(refreshDelay / 1000)
  ```
- [x] 5.3.5 Function `formatTime(seconds)` - Format as "Xd Yh Zm Ws"

### 5.4 Implement UI Components
- [x] 5.4.1 **Floating Panel** (bottom-right, z-50):
  - Header with Shield icon, "Auth Debug" text, status dot, expand/collapse button
  - Maximize button to open modal
  - Expandable content area (max-height with scroll)
- [x] 5.4.2 **Modal Dialog**:
  - Full-screen overlay with backdrop
  - Large panel with header, scrollable content, footer
  - Close button (X)
- [x] 5.4.3 **Debug Content** (used in both panel and modal):
  - Authentication status with green/red indicator
  - User info (ID, username, role) with sync button
  - Access token section:
    - Valid/Expired badge
    - Location (HTTP-only cookie)
    - TTL from API
    - Expiry time
    - Time remaining (color-coded: green > 5min, yellow < 5min, red < 1min)
    - Auto-refresh countdown
    - Next refresh timestamp
  - Refresh token section:
    - Valid/Expired badge
    - Expiry date/time
    - Time remaining (days:hours:minutes)
    - Security info panel
  - Live indicators:
    - Green pulsing dot: "Live updates"
    - Red pulsing dot: "Token expiring soon!" (< 1min)
    - Orange pulsing dot: "Auto-refresh imminent" (< 15s)

### 5.5 Implement Conditional Rendering
- [x] 5.5.1 Return `null` if `process.env.NODE_ENV !== 'development'`
- [x] 5.5.2 Render floating panel always in dev
- [x] 5.5.3 Render modal only when `isModalOpen === true`

**Reference**: `web/components/auth/debug/AuthDebug.tsx` (lines 1-400+)
**Test**: Login, verify AuthDebug shows in bottom-right, click to expand, verify all fields populate

## ✅ Phase 6: QueryProvider Enhancement - COMPLETED

### 6.1 Create/Update QueryProvider
- [x] 6.1.1 Create file: `frontend/providers/query-provider.tsx`
- [x] 6.1.2 Copy implementation from reference: `web/providers/query-provider.tsx` (1116 bytes)
- [x] 6.1.3 Configure QueryClient with:
  ```typescript
  {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error?.status === 404) return false
        if (error?.status === 403) return false
        if (error?.status >= 500) return failureCount < 3
        return failureCount < 1
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
  ```

**Reference**: `web/providers/query-provider.tsx`
**Test**: Make API call that fails with 404, verify no retry; fail with 500, verify 3 retries

## ✅ Phase 7: Update Cookie Configuration - COMPLETED

### 7.1 Update setSession() in server.ts
- [x] 7.1.1 Open `frontend/lib/session/server.ts`
- [x] 7.1.2 Make `cookieOptions` environment-aware:
  ```typescript
  const cookieOptions = {
    httpOnly: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
  }
  ```
- [x] 7.1.3 Add logging in `setSession()`:
  ```typescript
  console.log('🍪 Setting access_token cookie:', {
    length: accessToken.length,
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    expires: expiresAtDate.toISOString()
  })
  ```
- [x] 7.1.4 Same logging for refresh_token cookie

**Reference**: `web/lib/session.ts:applyApiCookies()`
**Test**: Login in dev, check console for cookie logs; inspect DevTools → Cookies, verify NOT httpOnly

## ✅ Phase 8: Update Refresh API Route - COMPLETED

### 8.1 Normalize Response Format
- [x] 8.1.1 Open `frontend/app/api/auth/refresh/route.ts`
- [x] 8.1.2 After receiving `authData` from Symfony backend, normalize response:
  ```typescript
  const jsonResponse = NextResponse.json({
    success: true,
    message: 'Token refreshed successfully',
    access: {
      token: authData.access_token,
      expires_in: authData.expires_in
    },
    refresh: {
      token: authData.refresh_token,
      expires_in: authData.refresh_expires_in || 604800
    }
  })
  ```
- [x] 8.1.3 Set cookies on response using same cookie options as setSession
- [x] 8.1.4 Add comprehensive logging

**Reference**: `web/app/api/auth/refresh/route.ts`
**Test**: Call /api/auth/refresh, verify response has nested `access` and `refresh` objects

## ✅ Phase 9: Update useAutoRefresh Hook - COMPLETED

### 9.1 Integrate with Zustand Store
- [x] 9.1.1 Open `frontend/hooks/use-auto-refresh.ts`
- [x] 9.1.2 Replace `/api/auth/status` fetch with Zustand store read:
  ```typescript
  const { isAuthenticated, tokenExpiry } = useAuthStore()
  const { updateTokens } = useAuthActions()
  ```
- [x] 9.1.3 Remove `fetchStatusAndSchedule()` function
- [x] 9.1.4 Update `useEffect` to directly use `tokenExpiry` from store
- [x] 9.1.5 Calculate refresh delay from `tokenExpiry`:
  ```typescript
  const msUntilExpiry = tokenExpiry.getTime() - Date.now()
  const dynamicLead = Math.max(120000, Math.min(300000, Math.floor(msUntilExpiry * 0.6)))
  const refreshDelay = Math.max(800, msUntilExpiry - dynamicLead)
  ```
- [x] 9.1.6 In `performRefresh()` success handler:
  ```typescript
  const data = await response.json()
  const newExpiresIn = data.access?.expires_in || data.expires_in
  updateTokens({
    access_token: "present",
    refresh_token: "present",
    expires_in: newExpiresIn
  })
  setRetryTrigger(prev => prev + 1) // Re-schedule with new expiry
  ```

**Reference**: `web/hooks/use-auto-refresh.ts`
**Test**: Login with dev_ttl=30, watch AuthDebug, verify refresh triggers at ~18s

## ✅ Phase 10: Layout Integration - COMPLETED

### 10.1 Update Root Layout
- [x] 10.1.1 Open `frontend/app/layout.tsx`
- [x] 10.1.2 Import:
  ```typescript
  import { checkAuth } from '@/lib/dal/server'
  import { AuthProvider, AuthGuard, AuthDebug } from '@/components/auth'
  import QueryProvider from '@/providers/query-provider'
  ```
- [x] 10.1.3 Make layout `async`:
  ```typescript
  export default async function RootLayout({ children })
  ```
- [x] 10.1.4 Add server-side auth check:
  ```typescript
  const initialAuthData = await checkAuth()
  ```
- [x] 10.1.5 Wrap children with providers:
  ```tsx
  <QueryProvider>
    <AuthProvider initialAuth={initialAuthData || undefined}>
      <AuthGuard>{children}</AuthGuard>
      <AuthDebug />
    </AuthProvider>
  </QueryProvider>
  ```

**Reference**: `web/app/layout.tsx`
**Test**: Refresh page after login, verify no hydration mismatch, AuthDebug shows correct state

## ✅ Phase 11: Create use-authentication Hook - COMPLETED

### 11.1 Implement syncUserFromApi
- [x] 11.1.1 Create `frontend/hooks/use-authentication.ts` if it doesn't exist
- [x] 11.1.2 Implement `syncUserFromApi()` function:
  ```typescript
  const syncUserFromApi = async () => {
    const response = await fetch('/api/v1/user/me', { credentials: 'include' })
    const userData = await response.json()
    updateUser(userData)
  }
  ```
- [x] 11.1.3 Return from hook for use in AuthDebug refresh button

**Test**: In AuthDebug, click user refresh button, verify user data updates

## Phase 12: Testing & Validation

### 12.1 Quick Login Test
- [ ] 12.1.1 Start dev server: `bun dev`
- [ ] 12.1.2 Navigate to `/login`
- [ ] 12.1.3 Open DevTools → Console
- [ ] 12.1.4 Add hidden input: `<input type="hidden" name="dev_ttl" value="30" />`
- [ ] 12.1.5 Login
- [ ] 12.1.6 Verify console logs:
  - "🧪 DEV MODE - TTL Override: 30 seconds"
  - "🍪 Setting access_token cookie: { ... }"
  - "🍪 Setting refresh_token cookie: { ... }"
- [ ] 12.1.7 Verify AuthDebug shows:
  - Token TTL: 30s
  - Time remaining: countdown from 30s
  - Auto-refresh in: ~18s

### 12.2 Auto-Refresh Verification
- [ ] 12.2.1 Keep AuthDebug and Console open
- [ ] 12.2.2 At ~27 seconds (3s before refresh), verify AuthDebug shows orange "Auto-refresh imminent"
- [ ] 12.2.3 At ~18 seconds, verify:
  - Console: "🔄 Proactive refresh triggered"
  - Console: "✅ Token refreshed successfully"
  - AuthDebug: Time remaining resets to ~30s
  - Network tab: POST /api/auth/refresh with 200 status
- [ ] 12.2.4 Verify AuthDebug "Next refresh at" updates to new time

### 12.3 Store Persistence Test
- [ ] 12.3.1 After login, check DevTools → Application → Local Storage
- [ ] 12.3.2 Verify `auth-store` key exists with serialized state
- [ ] 12.3.3 Close browser tab
- [ ] 12.3.4 Reopen same URL
- [ ] 12.3.5 Verify AuthDebug shows restored state from localStorage
- [ ] 12.3.6 Verify auto-refresh continues from correct timing

### 12.4 Cookie Inspection (Dev Mode)
- [ ] 12.4.1 DevTools → Application → Cookies → `http://localhost:3000`
- [ ] 12.4.2 Verify cookies visible (NOT HttpOnly in dev):
  - `access_token`
  - `refresh_token`
  - `token_expires_at`
- [ ] 12.4.3 Verify Domain = `localhost`
- [ ] 12.4.4 Verify SameSite = `Lax`
- [ ] 12.4.5 Click cookie value, verify can read token (not HttpOnly)

### 12.5 Production Safety Test
- [ ] 12.5.1 Build production: `bun run build`
- [ ] 12.5.2 Start production: `bun start`
- [ ] 12.5.3 Login with normal credentials (no dev_ttl)
- [ ] 12.5.4 Verify AuthDebug NOT visible (hidden in production)
- [ ] 12.5.5 DevTools → Cookies, verify:
  - HttpOnly = true
  - Secure = true (if HTTPS)
  - Cannot read cookie values
- [ ] 12.5.6 Verify refresh still works (check Network tab)

### 12.6 Edge Cases
- [ ] 12.6.1 **Very Short TTL**: Login with `dev_ttl=5`, verify multiple refreshes
- [ ] 12.6.2 **Tab Close/Reopen**: Verify session persists across tab closures
- [ ] 12.6.3 **Manual Cookie Delete**: Delete refresh_token cookie, verify logout on next API call
- [ ] 12.6.4 **Expired Token**: Wait for token to expire, verify AuthDebug shows "Expired" badge

## Phase 13: Code Quality & Documentation

### 13.1 Linting & Type Checking
- [ ] 13.1.1 Run: `bun run lint`, fix all errors
- [ ] 13.1.2 Run: `bun run type-check`, fix all TypeScript errors
- [ ] 13.1.3 Verify no `@ts-ignore` comments added

### 13.2 Update Documentation
- [ ] 13.2.1 Update `frontend/CLAUDE.md`:
  - Document Zustand auth store architecture
  - Document AuthDebug usage
  - Document checkAuth() server function
  - Document quick login with dev_ttl
  - Add debugging tips section
- [ ] 13.2.2 Add inline comments in complex sections:
  - Zustand store persistence logic
  - checkAuth() server-side refresh handling
  - AuthDebug time calculation functions

### 13.3 Final Integration Test
- [ ] 13.3.1 **Full Flow**: Login → Wait for auto-refresh → Make API call → Verify works → Logout
- [ ] 13.3.2 **Visual Confirmation**: All AuthDebug indicators update correctly
- [ ] 13.3.3 **Console Logs**: All operations logged clearly
- [ ] 13.3.4 **No Errors**: Console and network tab show no errors

## Dependencies

**Sequential Phases**:
- Phase 1 (Setup) → Phase 2 (Store) → Phase 3-6 (Components) → Phase 7-9 (Integration) → Phase 10 (Layout) → Phase 12 (Testing)

**Parallel Work** (after Phase 2):
- Phase 3 (Server DAL) and Phase 5 (AuthDebug) can be done in parallel
- Phase 6 (QueryProvider) and Phase 7 (Cookies) can be done in parallel

**Blocking**:
- Phase 10 (Layout) requires Phases 2, 3, 4, 5, 6 complete
- Phase 12 (Testing) requires all previous phases complete

## Estimated Effort

- **Phase 1** (Setup): 15 minutes
- **Phase 2** (Zustand Store): 90 minutes (complex with persistence)
- **Phase 3** (Server DAL): 120 minutes (complex with retry logic)
- **Phase 4** (AuthProvider): 45 minutes
- **Phase 5** (AuthDebug): 180 minutes (400+ lines, complex UI)
- **Phase 6** (QueryProvider): 30 minutes
- **Phase 7** (Cookies): 45 minutes
- **Phase 8** (Refresh API): 45 minutes
- **Phase 9** (useAutoRefresh): 60 minutes
- **Phase 10** (Layout): 30 minutes
- **Phase 11** (use-authentication): 30 minutes
- **Phase 12** (Testing): 90 minutes
- **Phase 13** (Quality): 45 minutes

**Total**: ~13 hours (approximately 2 working days)

## Success Criteria

All tasks checked ✅ AND:
- ✅ Zustand store persists to localStorage with correct Date serialization
- ✅ AuthProvider syncs server `checkAuth()` data to client store on mount
- ✅ AuthDebug visible in development, hidden in production
- ✅ Quick login with `dev_ttl=30` shows live 30-second countdown
- ✅ Auto-refresh triggers at exactly 60% of TTL (18s for 30s token)
- ✅ AuthDebug shows visual indicators: green/yellow/red based on time remaining
- ✅ Console logs clearly show all cookie operations and refresh events
- ✅ Cookies inspectable in DevTools (dev mode), HttpOnly in production
- ✅ No hydration mismatches between server and client
- ✅ Token refresh works reliably with visual confirmation in AuthDebug
- ✅ Store state persists across tab close/reopen
- ✅ All edge cases tested and passing

## Critical Implementation Notes

1. **DO NOT** deviate from reference implementation - copy EXACTLY
2. **DO NOT** skip AuthDebug - it's ESSENTIAL for debugging
3. **DO NOT** use different store structure - match Zustand schema exactly
4. **DO NOT** skip localStorage persistence - required for tab restore
5. **DO** test with `dev_ttl=30` before considering complete
6. **DO** verify AuthDebug shows all fields updating in real-time
7. **DO** check production build hides AuthDebug completely
