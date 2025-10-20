# Fix Authentication Architecture: Complete Zustand + AuthDebug Implementation

## Why

The current authentication implementation in `frontend/` is **fundamentally incomplete** compared to the reference `nextjs-auth-symfony-v1`. Critical analysis reveals:

### Critical Missing Components

1. **❌ NO Zustand Store** - No client-side state management for auth
   - Current: Relies purely on cookies with no client state
   - Reference: Complete `auth-store.ts` with persistence

2. **❌ NO AuthDebug Component** - No development debugging tools
   - Current: No way to visualize token state, expiry, auto-refresh
   - Reference: 14KB AuthDebug.tsx with real-time monitoring

3. **❌ NO AuthProvider** - No server→client state synchronization
   - Current: No bridge between SSR `checkAuth()` and client state
   - Reference: AuthProvider syncs `initialAuth` to Zustand store

4. **❌ NO checkAuth() Server Function** - No SSR auth initialization
   - Current: No server-side auth check for layout hydration
   - Reference: `dal/server.ts:checkAuth()` provides `initialAuthData`

5. **❌ INCOMPLETE use-auto-refresh** - Doesn't use Zustand store
   - Current: Fetches /api/auth/status, no state sync
   - Reference: Reads from + updates Zustand store directly

6. **❌ NO QueryProvider Configuration** - Missing TanStack Query setup
   - Current: Basic setup without retry logic
   - Reference: Intelligent retry strategy for 401/403/5xx

### Impact

**Refresh token does NOT work reliably because:**
- No client-side `tokenExpiry` state → can't schedule proactive refresh
- No `AuthProvider` → SSR auth data never reaches client
- No `AuthDebug` → impossible to debug token refresh flow
- No Zustand store → `use-auto-refresh` can't read/update token state

**Developer experience is broken:**
- Quick login with `dev_ttl` has no visual feedback
- Cannot see when auto-refresh triggers
- No way to verify cookie operations
- Blind debugging of token issues

## What Changes

Complete re-architecture to match `MakFly/nextjs-auth-symfony-v1` **EXACTLY**:

### 1. Zustand Auth Store (NEW)
**File**: `frontend/stores/auth-store.ts` (6.6KB)

- Full client-side auth state management
- State: `isAuthenticated`, `user`, `accessToken`, `refreshToken`, `tokenTtl`, `tokenExpiry`, `refreshTokenExpiry`
- Actions: `login`, `loginWithExpiry`, `logout`, `updateTokens`, `updateUser`, `setTokenExpiry`, `setRefreshTokenExpiry`
- LocalStorage persistence with Date serialization
- SSR-safe with `skipHydration`
- Selector hooks: `useAuthStore()`, `useAuthActions()`, `useIsAuthenticated()`, etc.

### 2. AuthDebug Component (NEW)
**File**: `frontend/components/auth/debug/AuthDebug.tsx` (14KB)

- Real-time auth status monitoring (updates every second)
- Visual display of:
  - Authentication status with color indicators
  - User info (ID, username, role)
  - Access token expiry countdown (minutes:seconds)
  - Refresh token expiry (days:hours:minutes)
  - Next auto-refresh countdown
  - Live cookie status
- Modes: Compact floating panel + Full-screen modal
- Dev-only (hidden in production)
- Icons from Lucide React
- **ESSENTIAL** for debugging token refresh

### 3. AuthProvider (NEW)
**File**: `frontend/components/auth/providers/AuthProvider.tsx` (2.3KB)

- Bridges SSR `checkAuth()` → Zustand store
- Receives `initialAuth` prop from server
- Syncs server data to client store on mount
- Activates `useAutoRefresh()` hook
- Updates `tokenExpiry` from server data
- Prevents hydration mismatches

### 4. Server Auth Utilities (NEW)
**File**: `frontend/lib/dal/server.ts` (9KB)

- `checkAuth()`: SSR-safe auth check for layout
- `requireAuth()`: Protected route helper
- `serverApiFetch()`: Authenticated server-side fetch
- Returns format compatible with AuthProvider:
  ```typescript
  {
    isAuthenticated: boolean,
    user: { userId, username, role },
    tokenTtl: number,
    tokenExpiry: Date
  }
  ```

### 5. QueryProvider Enhancement
**File**: `frontend/providers/query-provider.tsx`

- Intelligent retry logic:
  - No retry on 404 (not found)
  - No retry on 403 (forbidden)
  - Max 3 retries on 5xx (server errors)
  - Exponential backoff (cap at 30s)
- StaleTime: 60s, GC: 5min

### 6. Cookie Configuration Updates
**Files**: `frontend/lib/session/server.ts`, `frontend/app/api/auth/refresh/route.ts`

- Dev mode: `httpOnly: false`, `secure: false`, `domain: 'localhost'`
- Production: `httpOnly: true`, `secure: true`, `domain: undefined`
- Comprehensive logging for cookie operations

### 7. Auto-Refresh Hook Updates
**File**: `frontend/hooks/use-auto-refresh.ts`

- Read `tokenExpiry` from Zustand store (NOT /api/auth/status)
- Update store after successful refresh via `updateTokens()`
- Calculate refresh delay: 60% of TTL (2-5min bounds)
- Trigger at 60% of token lifetime

### 8. Layout Integration
**File**: `frontend/app/layout.tsx`

```tsx
const initialAuthData = await checkAuth()

<QueryProvider>
  <AuthProvider initialAuth={initialAuthData}>
    <AuthGuard>{children}</AuthGuard>
    <AuthDebug /> {/* Dev-only panel */}
  </AuthProvider>
</QueryProvider>
```

### 9. Response Format Normalization
**File**: `frontend/app/api/auth/refresh/route.ts`

Return normalized structure:
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "access": { "token": "...", "expires_in": 3600 },
  "refresh": { "token": "...", "expires_in": 604800 }
}
```

## Impact

### Affected Specs
- `auth-architecture` (NEW) - Complete client-side auth architecture
- `jwt-refresh` (MODIFIED) - Token refresh with Zustand integration
- `auth-debug` (NEW) - Development debugging tools

### New Files Created
- `frontend/stores/auth-store.ts` (~200 lines)
- `frontend/components/auth/debug/AuthDebug.tsx` (~400 lines)
- `frontend/components/auth/providers/AuthProvider.tsx` (~70 lines)
- `frontend/components/auth/index.ts` (exports)
- `frontend/lib/dal/server.ts` (~250 lines)
- `frontend/providers/query-provider.tsx` (~40 lines)
- `frontend/hooks/use-authentication.ts` (if needed for `syncUserFromApi`)

### Modified Files
- `frontend/app/layout.tsx` - Add providers + AuthDebug
- `frontend/lib/session/server.ts` - Cookie config
- `frontend/app/api/auth/refresh/route.ts` - Response normalization
- `frontend/hooks/use-auto-refresh.ts` - Zustand integration
- `frontend/package.json` - Add Zustand dependency

### Dependencies Added
```json
{
  "zustand": "^4.5.0"
}
```

### Breaking Changes
**NONE** - Pure addition, existing functionality enhanced

### Migration Path
No migration needed - new system activates on first login/page load

## Reference Implementation

**Source**: `https://github.com/MakFly/nextjs-auth-symfony-v1`

**Critical Files Analyzed** (100% fidelity):
- ✅ `web/stores/auth-store.ts` (6643 bytes)
- ✅ `web/components/auth/debug/AuthDebug.tsx` (14056 bytes)
- ✅ `web/components/auth/providers/AuthProvider.tsx` (2306 bytes)
- ✅ `web/lib/dal/server.ts` (9089 bytes)
- ✅ `web/hooks/use-auto-refresh.ts` (4248 bytes)
- ✅ `web/app/api/auth/refresh/route.ts` (4570 bytes)
- ✅ `web/lib/session.ts` (4458 bytes)
- ✅ `web/app/layout.tsx` (1430 bytes)
- ✅ `web/providers/query-provider.tsx` (1116 bytes)

## Architecture Comparison

### Current (Broken)
```
Server → Cookies → Client (blind, no state)
         ↓
    use-auto-refresh fetches /api/auth/status
         ↓
    No visual feedback, unreliable scheduling
```

### Reference (Working) ✅
```
Server (checkAuth) → AuthProvider → Zustand Store
                                        ↓
                            use-auto-refresh reads store
                                        ↓
                            Updates store + cookies
                                        ↓
                            AuthDebug visualizes state
```

## Testing Strategy

### 1. Quick Login Test
- Login with `dev_ttl=30`
- **AuthDebug** should show:
  - Token TTL: 30s
  - Time remaining: countdown from 30s
  - Auto-refresh in: ~18s (60% of 30s)
  - Next refresh at: exact timestamp

### 2. Auto-Refresh Verification
- Watch **AuthDebug** panel
- At ~18 seconds, should see:
  - "Auto-refresh imminent" indicator (orange pulse)
  - Console: "🔄 Proactive refresh triggered"
  - Console: "✅ Token refreshed successfully"
  - Time remaining resets to 30s

### 3. Store Persistence Test
- Login → Close tab → Reopen
- AuthDebug should show restored state from localStorage
- Auto-refresh should continue working

### 4. Production Safety Test
- Build production: `bun run build`
- Verify AuthDebug hidden
- Verify cookies have `httpOnly: true`

## Success Criteria

- ✅ Zustand store persists auth state to localStorage
- ✅ AuthProvider syncs SSR data to client store on mount
- ✅ AuthDebug visible in dev, hidden in production
- ✅ Quick login (`dev_ttl=30`) shows real-time countdown
- ✅ Auto-refresh triggers at 60% of TTL (18s for 30s token)
- ✅ Console logs show clear cookie operations
- ✅ Cookies accessible in DevTools (dev mode only)
- ✅ Production build maintains security (`httpOnly: true`)
- ✅ No hydration mismatches between server/client
- ✅ Token refresh works reliably with visual confirmation

## Architecture Decision

**Why Zustand over Context API?**
- Better performance (no unnecessary re-renders)
- Built-in persistence with middleware
- Type-safe selectors
- SSR-safe with `skipHydration`
- **Reference implementation uses it** - proven to work

**Why AuthDebug is essential?**
- Without it, debugging token refresh is **impossible**
- Visual confirmation that auto-refresh works
- Shows exact timing of refresh triggers
- Validates cookie operations
- **14KB of code** that saves hours of debugging

**Why AuthProvider pattern?**
- Clean separation: Server data → Client state
- Prevents SSR/CSR hydration mismatches
- Activates auto-refresh hook in one place
- Matches Next.js 15 best practices
