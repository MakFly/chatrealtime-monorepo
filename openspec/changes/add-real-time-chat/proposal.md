# Add Real-Time Chat with Mercure

## Why

The application name is "chat-realtime" but currently lacks actual real-time chat functionality. The frontend has a chat UI mockup that calls non-existent backend endpoints. Users expect instant message delivery and live updates without page refreshes, which is essential for a modern chat application.

Implementing real-time chat with Mercure provides:
- **Native FrankenPHP integration**: Mercure is built into FrankenPHP (already in use), avoiding external WebSocket servers
- **Standards-based**: Uses Server-Sent Events (SSE), a mature W3C standard with excellent browser support
- **Simpler than WebSockets**: Unidirectional server-to-client push over HTTP, easier to implement and debug
- **Auto-reconnection**: EventSource API handles reconnection automatically
- **Symfony ecosystem fit**: First-class API Platform integration

## What Changes

### Backend (api/)
- **BREAKING**: Install `symfony/mercure-bundle` and `lcobucci/jwt` packages
- **NEW**: Create `ChatRoom` entity with API Platform resource
- **NEW**: Create `Message` entity with API Platform resource and Mercure publishing
- **NEW**: Create `ChatParticipant` entity for room membership
- **NEW**: Add Mercure configuration in `config/packages/mercure.yaml`
- **NEW**: Configure FrankenPHP Caddyfile with Mercure hub
- **NEW**: Add Mercure environment variables (MERCURE_URL, MERCURE_PUBLIC_URL, MERCURE_JWT_SECRET)
- **NEW**: Implement message persistence service with TDD
- **NEW**: Add authorization checks (users can only see their rooms/messages)
- **NEW**: Create database migrations for chat entities

### Frontend (frontend/)
- **BREAKING**: Replace mock chat implementation with real Symfony API integration
- **NEW**: Implement EventSource subscriptions for real-time message updates
- **NEW**: Create API client functions for chat endpoints
- **NEW**: Add proper error handling and connection management
- **NEW**: Implement chat room management UI
- **NEW**: Add typing indicators using Mercure (optional Phase 2)
- **NEW**: Add online/offline status using Mercure (optional Phase 2)

### Infrastructure
- **BREAKING**: Update Docker Compose with Mercure environment variables
- **NEW**: Update Caddyfile to enable Mercure hub at `/.well-known/mercure`
- **NEW**: Configure full-duplex mode in FrankenPHP for SSE support

## Impact

### Affected Specs
- **NEW**: `chat-messaging` - Core chat functionality (rooms, messages, participants)
- **NEW**: `real-time-updates` - Mercure infrastructure and SSE subscriptions
- **MODIFIED**: `user-authentication` - Extended for chat room authorization

### Affected Code

#### Backend
- `api/compose.dev.yaml` - Add Mercure environment variables
- `api/Dockerfile.dev` - May need Caddyfile volume mount
- `api/src/Entity/` - New: `ChatRoom.php`, `Message.php`, `ChatParticipant.php`
- `api/src/Service/` - New: `ChatService.php`, `MessagePublisher.php`
- `api/config/packages/` - New: `mercure.yaml`
- `api/migrations/` - New migration files for chat schema
- `api/tests/` - Comprehensive test coverage (TDD approach)
- `api/.env` - Mercure configuration variables
- `api/postman/` - New chat endpoints in collection

#### Frontend
- `frontend/app/(protected)/chat/_components/` - Complete rewrite for real backend
- `frontend/lib/api/` - New: `chat.ts` (API client)
- `frontend/lib/hooks/` - New: `use-mercure.ts`, `use-chat-messages.ts`
- `frontend/types/` - New: `chat.ts` (domain types)
- `frontend/.env.local` - Mercure public URL configuration

### Breaking Changes
- **Frontend**: Existing mock chat components will be replaced
- **Backend**: Requires FrankenPHP Caddyfile modification
- **Infrastructure**: New environment variables required for deployment

### Migration Path
1. Backend implementation first (TDD with comprehensive tests)
2. Deploy backend with Mercure configuration
3. Update frontend to consume real endpoints
4. Gradual rollout with feature flags (optional)

### Risks
- **Mercure hub configuration**: Requires careful Caddyfile setup
- **JWT secret management**: Must match between Symfony and Mercure hub
- **Browser compatibility**: EventSource widely supported but verify in target browsers
- **Scaling considerations**: Mercure hub can handle thousands of connections but monitor performance
- **Message persistence**: Database writes on every message, consider async processing for high volume

### Testing Strategy
- **Unit tests**: All service layer logic (TDD)
- **Feature tests**: API endpoints with authentication
- **Integration tests**: Mercure publishing and subscription flow
- **E2E tests**: Full chat flow from frontend to backend to Mercure
- **Security tests**: Authorization boundaries, JWT validation
- **Performance tests**: Message throughput, concurrent connections

### Performance Considerations
- Use database indexes on `ChatRoom.id`, `Message.chatRoom`, `Message.createdAt`
- Consider pagination for message history (limit 50 messages per page)
- Implement message archiving strategy for old messages
- Monitor Mercure hub memory usage (SSE connections are long-lived)

### Documentation Updates
- Update `api/CLAUDE.md` with Mercure configuration
- Update `frontend/CLAUDE.md` with EventSource patterns
- Update `api/postman/` collection with chat endpoints
- Add examples to `AI-DD/` for real-time patterns
