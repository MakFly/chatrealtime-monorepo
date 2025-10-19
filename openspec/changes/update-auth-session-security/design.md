## Context
Current JWT creation leverages LexikJWT bundle defaults which serialize the full user object including role arrays. Frontend expects user details as part of the login payload but not from direct token decoding. Cookies are stored through Next.js `cookies()` helper with static lifetimes (access token ~1h, refresh token 30d) and no synchronization with token TTL. There is no dedicated cookie status API nor a short-lived demo login.

## Decisions
- **JWT Claim Sanitization**: Use `JWTCreatedEvent` listener to override payload with minimal claims (subject, issued-at, expiration, token id) and expose user profile via response body only. This avoids leaking roles while keeping compatibility with refresh workflows.
- **Token Metadata Source of Truth**: Persist token TTL values in configuration and expose them both in API responses and frontend session helpers to avoid hard-coded durations.
- **Cookie Status Endpoint**: Implement a Next.js API route `/api/auth/status` that reads cookies server-side, validates expiry relative to access token TTL, and returns structured status for client polling.
- **Quick Login Demo**: Provide a Next.js page/action that triggers API login using fixed demo credentials from environment vars, issues a 20-second cookie (by overriding TTL during call), and demonstrates refresh flow automatically for documentation and manual QA.
- **Frontend API Client**: Ensure `apiClient` supports invocation from Server Components, Server Actions, and client hooks by abstracting fetch base and session retrieval strategy (fall back to `headers()` in server contexts when `cookies()` is unavailable).
- **Tutorial Delivery**: Author markdown tutorial under `frontend/AI-DD` (or docs location) with verified requests to jsonplaceholder; scripts/examples must be runnable and cite verification method.
- **Documentation Update**: Append required sourcing statement to all CLAUDE instruction files to keep assistants aligned with user directive.

## Open Questions
- Ensure demo login credentials and TTL overrides do not interfere with production configs; propose using `.env` gated flag.
- Determine automated test coverage scope (PHP unit/functional + Playwright or React Testing Library) during implementation phase.
