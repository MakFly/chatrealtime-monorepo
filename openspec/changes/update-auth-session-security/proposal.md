## Why
- JWT tokens currently embed full user roles; requirement is to avoid exposing roles and limit payload to essential claims.
- Frontend session cookies need to mirror token TTL and expose a way to verify cookie validity via dedicated status API.
- Provide a demonstrative quick-login flow and refresh example to validate the new session lifecycle.
- Align developer documentation (CLAUDE files) with guidance to avoid fabricated data and require verified sources.
- Deliver a comprehensive TanStack Query usage tutorial covering ISR, SSR, and client-side patterns using jsonplaceholder resources.

## What Changes
- Adjust API token generation to emit a minimal claim set while keeping behavior backward compatible for existing consumers.
- Introduce structures to expose safe user info separate from JWT, update refresh/login endpoints accordingly, and ensure TTL parity.
- Add cookie status API route and session helpers on frontend with 20s demo login + refresh flow wired against API.
- Enhance frontend API client for SSR/server action compatibility and clarify usage guidance.
- Publish TanStack Query tutorial leveraging jsonplaceholder endpoints with accurate, sourced examples.
- Update CLAUDE guidance files with explicit instruction about sourcing information.

## Impact
- Auth flows across API and frontend clients.
- Frontend session management, cookies, and dev tooling.
- Developer documentation and tutorials.
- Requires coordination between Symfony API and Next.js frontend deployments.
