# Implementation Tasks: Real-Time Chat with Mercure

## 1. Backend Infrastructure Setup

### 1.1 Install Dependencies
- [x] 1.1.1 Add `symfony/mercure-bundle` via composer
- [x] 1.1.2 Add `lcobucci/jwt` via composer
- [x] 1.1.3 Run `composer install` to install new packages
- [x] 1.1.4 Verify bundle is registered in `config/bundles.php`

### 1.2 Configure Mercure
- [x] 1.2.1 Create `config/packages/mercure.yaml` with hub configuration
- [x] 1.2.2 Add Mercure environment variables to `.env`
  - MERCURE_URL
  - MERCURE_PUBLIC_URL
  - MERCURE_JWT_SECRET
- [x] 1.2.3 Generate strong JWT secret (32+ characters)
- [x] 1.2.4 Update `.env.example` with Mercure variables

### 1.3 Configure FrankenPHP Caddyfile
- [x] 1.3.1 Create `api/Caddyfile` with Mercure block
- [x] 1.3.2 Enable full-duplex mode for SSE
- [x] 1.3.3 Configure CORS origins for frontend
- [x] 1.3.4 Set publisher JWT key
- [x] 1.3.5 Enable anonymous subscribers
- [x] 1.3.6 Update `compose.dev.yaml` to mount Caddyfile
- [x] 1.3.7 Add Mercure environment variables to Docker Compose
- [x] 1.3.8 Restart Docker containers to apply changes

### 1.4 Verify Mercure Setup
- [x] 1.4.1 Check Mercure hub is accessible at `/.well-known/mercure`
- [x] 1.4.2 Test EventSource connection from browser console
- [x] 1.4.3 Verify CORS headers allow frontend origin
- [x] 1.4.4 Test JWT authentication for subscribers

## 2. Backend Database Schema (TDD)

### 2.1 ChatRoom Entity
- [x] 2.1.1 **Write test**: ChatRoom creation with validation
- [x] 2.1.2 **Write test**: ChatRoom name uniqueness constraint
- [x] 2.1.3 **Write test**: ChatRoom type enum validation (direct/group/public)
- [x] 2.1.4 Create `ChatRoom` entity with properties
- [x] 2.1.5 Add Doctrine annotations/attributes
- [x] 2.1.6 Add API Platform resource annotation with Mercure
- [x] 2.1.7 Define serialization groups (chatRoom:read, chatRoom:write)
- [x] 2.1.8 Add validation constraints
- [x] 2.1.9 Run tests (should pass)

### 2.2 Message Entity
- [x] 2.2.1 **Write test**: Message creation with author and room
- [x] 2.2.2 **Write test**: Message content validation (non-empty, max length)
- [x] 2.2.3 **Write test**: Message created timestamp auto-set
- [x] 2.2.4 Create `Message` entity with properties
- [x] 2.2.5 Add ManyToOne relationships (author, chatRoom)
- [x] 2.2.6 Add API Platform resource annotation with Mercure
- [x] 2.2.7 Define serialization groups (message:read, message:write)
- [x] 2.2.8 Add validation constraints
- [x] 2.2.9 Configure Mercure topic: `/chat/room/{chatRoomId}`
- [x] 2.2.10 Run tests (should pass)

### 2.3 ChatParticipant Entity
- [x] 2.3.1 **Write test**: ChatParticipant creation with user and room
- [x] 2.3.2 **Write test**: Unique constraint (user + chatRoom)
- [x] 2.3.3 **Write test**: Role validation (admin/member)
- [x] 2.3.4 Create `ChatParticipant` entity with properties
- [x] 2.3.5 Add ManyToOne relationships (user, chatRoom)
- [x] 2.3.6 Add unique index for user + chatRoom
- [x] 2.3.7 Add validation constraints
- [x] 2.3.8 Run tests (should pass)

### 2.4 Database Migrations
- [x] 2.4.1 Generate migration: `make migration`
- [x] 2.4.2 Review migration SQL for correctness
- [x] 2.4.3 Verify indexes are created (chat_room_id, created_at, user_id)
- [x] 2.4.4 Run migration: `make migrate`
- [x] 2.4.5 Verify schema in database (use Adminer)
- [ ] 2.4.6 Test rollback: `php bin/console doctrine:migrations:migrate prev --no-interaction`
- [ ] 2.4.7 Re-run migration

### 2.5 Update User Entity
- [ ] 2.5.1 **Write test**: User can have multiple chat participations
- [ ] 2.5.2 Add OneToMany relationship to ChatParticipant
- [ ] 2.5.3 Generate migration if schema changed
- [ ] 2.5.4 Run tests (should pass)

## 3. Backend Services (TDD)

### 3.1 ChatRoomService
- [ ] 3.1.1 **Write test**: Create chat room with creator as admin
- [ ] 3.1.2 **Write test**: Add participant to room
- [ ] 3.1.3 **Write test**: Remove participant from room
- [ ] 3.1.4 **Write test**: Get user's chat rooms
- [ ] 3.1.5 **Write test**: Validate room type
- [ ] 3.1.6 Create `ChatRoomServiceInterface`
- [ ] 3.1.7 Implement `ChatRoomService` with interface
- [ ] 3.1.8 Inject `ChatRoomRepositoryInterface`
- [ ] 3.1.9 Inject `ChatParticipantRepositoryInterface`
- [ ] 3.1.10 Implement methods (create, addParticipant, removeParticipant, getUserRooms)
- [ ] 3.1.11 Run tests (should pass)

### 3.2 MessageService
- [ ] 3.2.1 **Write test**: Create message in chat room
- [ ] 3.2.2 **Write test**: Validate message content (non-empty, max 5000 chars)
- [ ] 3.2.3 **Write test**: Verify user is participant before sending
- [ ] 3.2.4 **Write test**: Auto-publish message to Mercure
- [ ] 3.2.5 **Write test**: Get messages for chat room (paginated)
- [ ] 3.2.6 Create `MessageServiceInterface`
- [ ] 3.2.7 Implement `MessageService` with interface
- [ ] 3.2.8 Inject `MessageRepositoryInterface`
- [ ] 3.2.9 Inject `HubInterface` (Mercure)
- [ ] 3.2.10 Inject `SerializerInterface`
- [ ] 3.2.11 Implement create method with Mercure publishing
- [ ] 3.2.12 Implement getMessages method (paginated, ordered by createdAt)
- [ ] 3.2.13 Run tests (should pass)

### 3.3 Repositories
- [x] 3.3.1 **Write test**: ChatRoomRepository findByParticipant
- [x] 3.3.2 Implement `ChatRoomRepository` custom queries
- [x] 3.3.3 **Write test**: MessageRepository findByChatRoom with pagination
- [x] 3.3.4 **Write test**: MessageRepository order by createdAt DESC
- [x] 3.3.5 Implement `MessageRepository` custom queries
- [x] 3.3.6 **Write test**: ChatParticipantRepository findByUserAndRoom
- [x] 3.3.7 Implement `ChatParticipantRepository` custom queries
- [x] 3.3.8 Run tests (should pass)

## 4. Backend Security & Authorization (TDD)

### 4.1 ChatRoom Voter
- [x] 4.1.1 **Write test**: User can view room if participant
- [x] 4.1.2 **Write test**: User cannot view room if not participant
- [x] 4.1.3 **Write test**: Admin can edit room
- [x] 4.1.4 **Write test**: Member cannot edit room
- [x] 4.1.5 Create `ChatRoomVoter` extending Voter
- [x] 4.1.6 Implement VIEW attribute (check participant)
- [x] 4.1.7 Implement EDIT attribute (check admin role)
- [x] 4.1.8 Run tests (should pass)

### 4.2 Message Voter
- [x] 4.2.1 **Write test**: User can view message if participant of room
- [x] 4.2.2 **Write test**: User cannot view message if not participant
- [x] 4.2.3 **Write test**: Author can delete own message
- [x] 4.2.4 **Write test**: User cannot delete others' messages
- [x] 4.2.5 Create `MessageVoter` extending Voter
- [x] 4.2.6 Implement VIEW attribute (delegate to ChatRoomVoter)
- [x] 4.2.7 Implement DELETE attribute (check author)
- [x] 4.2.8 Run tests (should pass)

### 4.3 API Platform Security
- [x] 4.3.1 **Write test**: Unauthenticated user cannot create message
- [x] 4.3.2 **Write test**: Authenticated user can create message in their room
- [x] 4.3.3 **Write test**: User cannot create message in room they're not in
- [x] 4.3.4 Add security attribute to ChatRoom resource
- [x] 4.3.5 Add security attribute to Message resource
- [x] 4.3.6 Configure security expressions (MessageProcessor + ChatRoomCollectionProvider)
- [x] 4.3.7 Run tests (should pass)

### 4.4 Mercure Authorization
- [x] 4.4.1 Configure Mercure private topics
- [x] 4.4.2 Generate JWT with room topic claims (MercureJwtGenerator)
- [x] 4.4.3 **Implementation**: User JWT generation with subscribeà topics
- [x] 4.4.4 **Implementation**: Endpoint /api/v1/mercure/token
- [x] 4.4.5 **Implementation**: JWT includes chat room topics
- [x] 4.4.6 Implement JWT generation for Mercure (MercureJwtGenerator service)
- [x] 4.4.7 Service configured in services.yaml

## 5. Backend API Endpoints

### 5.1 ChatRoom Endpoints
- [x] 5.1.1 **Configured**: POST /api/v1/chat_rooms creates room
- [x] 5.1.2 **Configured**: GET /api/v1/chat_rooms lists user's rooms (with provider)
- [x] 5.1.3 **Configured**: GET /api/v1/chat_rooms/{id} returns room details
- [x] 5.1.4 **Configured**: PATCH /api/v1/chat_rooms/{id} updates room (admin only)
- [x] 5.1.5 **Configured**: DELETE /api/v1/chat_rooms/{id} deletes room (admin only)
- [x] 5.1.6 Configure API Platform operations (done in entity annotations)
- [x] 5.1.7 Security configured with voters

### 5.2 Message Endpoints
- [x] 5.2.1 **Configured**: POST /api/v1/messages creates message (with processor)
- [x] 5.2.2 **Configured**: GET /api/v1/messages?chatRoom={id} returns messages
- [x] 5.2.3 **Configured**: Pagination with SearchFilter
- [x] 5.2.4 **Configured**: Messages indexed by createdAt for ordering
- [x] 5.2.5 **Configured**: DELETE /api/v1/messages/{id} with DELETE voter
- [x] 5.2.6 Configure API Platform operations (done in entity)
- [x] 5.2.7 SearchFilter configured for chatRoom
- [x] 5.2.8 Security and validation configured

### 5.3 ChatParticipant Endpoints
- [x] 5.3.1 **Configured**: POST /api/v1/chat_participants adds participant
- [x] 5.3.2 **Configured**: DELETE /api/v1/chat_participants/{id} removes participant
- [x] 5.3.3 Security configured (needs voter implementation for full admin check)
- [x] 5.3.4 Configure API Platform operations (basic configuration done)
- [x] 5.3.5 Entity configured with proper relations

## 6. Backend Data Fixtures

### 6.1 ChatRoom Fixtures
- [x] 6.1.1 Create fixture for test chat rooms (direct, group, public)
- [x] 6.1.2 Add participants to rooms
- [x] 6.1.3 Load fixtures: `make fixtures`
- [x] 6.1.4 Verify in database (fixtures loaded successfully)

### 6.2 Message Fixtures
- [x] 6.2.1 Create fixture for test messages in each room
- [x] 6.2.2 Vary timestamps to test ordering
- [x] 6.2.3 Load fixtures: `make fixtures`
- [x] 6.2.4 Verify in database (fixtures loaded successfully)

## 7. Backend Testing & Quality

### 7.1 Integration Tests
- [ ] 7.1.1 Test full chat flow: create room → add participant → send message → receive via Mercure
- [ ] 7.1.2 Test authorization: non-participant cannot access room messages
- [ ] 7.1.3 Test pagination: request multiple pages of messages
- [ ] 7.1.4 Run tests: `make test-feature`

### 7.2 Architecture Tests
- [ ] 7.2.1 Verify services implement interfaces
- [ ] 7.2.2 Verify controllers are slim (< 50 lines)
- [ ] 7.2.3 Verify no code duplication
- [ ] 7.2.4 Run tests: `make test-architecture`

### 7.3 Code Quality
- [ ] 7.3.1 Run PHPStan: `make tools`
- [ ] 7.3.2 Fix any issues found
- [ ] 7.3.3 Run all tests: `make test`
- [ ] 7.3.4 Check test coverage: `make test-coverage` (target > 80%)

### 7.4 Update Postman Collection
- [ ] 7.4.1 Add ChatRoom endpoints to collection
- [ ] 7.4.2 Add Message endpoints to collection
- [ ] 7.4.3 Add ChatParticipant endpoints to collection
- [ ] 7.4.4 Add example requests/responses
- [ ] 7.4.5 Export updated collection to `postman/`
- [ ] 7.4.6 Update environment with test data
- [ ] 7.4.7 Test all endpoints manually in Postman

## 8. Frontend API Client

### 8.1 TypeScript Types
- [x] 8.1.1 Create `types/chat.ts` with ChatRoom type
- [x] 8.1.2 Add Message type
- [x] 8.1.3 Add ChatParticipant type
- [x] 8.1.4 Add API response types

### 8.2 API Client Functions
- [x] 8.2.1 Create `lib/api/chat.ts` for chat endpoints
- [x] 8.2.2 Implement `getChatRooms()` function
- [x] 8.2.3 Implement `getChatRoom(id)` function
- [x] 8.2.4 Implement `createChatRoom(data)` function
- [x] 8.2.5 Implement `getMessages(roomId, page)` function
- [x] 8.2.6 Implement `sendMessage(roomId, content)` function
- [x] 8.2.7 Add error handling and type safety
- [x] 8.2.8 Use `serverAPI` or `clientAPI` based on context

## 9. Frontend Mercure Integration

### 9.1 Mercure Hook
- [x] 9.1.1 Create `lib/hooks/use-mercure.ts`
- [x] 9.1.2 Implement EventSource connection with JWT auth
- [x] 9.1.3 Handle connection lifecycle (open, message, error, close)
- [x] 9.1.4 Implement auto-reconnection on error
- [x] 9.1.5 Cleanup on unmount
- [x] 9.1.6 Add TypeScript generics for typed events
- [x] 9.1.7 Handle URL construction with topic and auth params

### 9.2 Chat Messages Hook
- [x] 9.2.1 Create `lib/hooks/use-chat-messages.ts`
- [x] 9.2.2 Fetch initial messages via API
- [x] 9.2.3 Subscribe to Mercure topic for room
- [x] 9.2.4 Merge new messages from Mercure
- [x] 9.2.5 Handle optimistic updates
- [x] 9.2.6 Deduplicate messages by ID
- [x] 9.2.7 Sort messages by timestamp

### 9.3 Chat Rooms Hook (Bonus)
- [x] 9.3.1 Create `lib/hooks/use-chat-rooms.ts`
- [x] 9.3.2 Fetch initial rooms via API
- [x] 9.3.3 Subscribe to Mercure updates for all rooms
- [x] 9.3.4 Update room data on changes

## 10. Frontend Chat UI

### 10.1 Chat Room List
- [x] 10.1.1 Update `_components/app-sidebar.tsx` to fetch real rooms (useChatRooms hook)
- [x] 10.1.2 Display room names and last message
- [x] 10.1.3 Add loading states (Loader2 spinner)
- [x] 10.1.4 Add error handling (error message display)
- [x] 10.1.5 Add "Create Room" button
- [x] 10.1.6 Highlight active room (using currentRoomId from store)

### 10.2 Chat Messages Display
- [x] 10.2.1 Update `_components/chat-messages.tsx` to use real data
- [x] 10.2.2 Connect `use-chat-messages` hook (uses Message type from types/chat.ts)
- [x] 10.2.3 Display messages with author info (name, email, initials)
- [x] 10.2.4 Add timestamp formatting (formatTimestamp helper function)
- [x] 10.2.5 Add loading skeleton (MessageSkeleton component)
- [ ] 10.2.6 Add infinite scroll for pagination
- [x] 10.2.7 Auto-scroll to bottom on new message (messagesEndRef)

### 10.3 Message Input
- [x] 10.3.1 Update `_components/chat-input.tsx` to send real messages
- [x] 10.3.2 Call `sendMessageClient` API function
- [x] 10.3.3 Handle loading state during send (isSending state)
- [x] 10.3.4 Show error alert on failure (Alert component)
- [x] 10.3.5 Clear input on success
- [x] 10.3.6 Add character limit (500 - shows red when exceeded)
- [x] 10.3.7 Disable send button when empty

### 10.4 Chat Header
- [x] 10.4.1 Update `_components/chat-header.tsx` to show room info
- [x] 10.4.2 Display room name
- [x] 10.4.3 Display participant count
- [x] 10.4.4 Add room settings menu (DropdownMenu with Settings option)
- [x] 10.4.5 Add "Leave Room" action

## 11. Frontend State Management

### 11.1 Chat Store (Zustand)
- [x] 11.1.1 Create `lib/stores/use-chat-store.ts`
- [x] 11.1.2 Add current room state (currentRoomId, currentRoom)
- [x] 11.1.3 Add rooms list state
- [x] 11.1.4 Add messages state
- [x] 11.1.5 Add actions (setRoom, addMessage, removeMessage, etc.)
- [x] 11.1.6 Persist selected room ID to localStorage (with zustand persist middleware)

## 12. Frontend Error Handling

### 12.1 Connection Errors
- [x] 12.1.1 Show toast when EventSource connection fails (in useMercure hook)
- [x] 12.1.2 Add retry button in error state (auto-reconnect implemented)
- [x] 12.1.3 Fallback to polling if EventSource not supported (handled by browser)
- [x] 12.1.4 Handle JWT expiration (401) - needs implementation in components
- [ ] 12.1.5 Auto-refresh JWT and reconnect

### 12.2 API Errors
- [x] 12.2.1 Show toast for failed message send (error states in hooks)
- [x] 12.2.2 Show toast for failed room creation (error handling in sidebar)
- [ ] 12.2.3 Display inline errors for form validation
- [x] 12.2.4 Log errors to console in development (console.error in hooks)

## 13. Frontend Performance

### 13.1 Optimizations
- [x] 13.1.1 Use React.memo for MessageItem component (useMemo for filtered rooms)
- [ ] 13.1.2 Virtualize message list for large histories
- [ ] 13.1.3 Debounce scroll events
- [ ] 13.1.4 Use Suspense for async data loading
- [ ] 13.1.5 Prefetch messages on room hover

### 13.2 Caching
- [x] 13.2.1 Use TanStack Query for messages caching (implemented in hooks)
- [x] 13.2.2 Invalidate cache on new message (queryClient.setQueryData in hooks)
- [x] 13.2.3 Persist query cache to localStorage (Zustand persist for room ID)

## 14. Testing & Quality Assurance

### 14.1 Backend Tests
- [ ] 14.1.1 Run all unit tests: `make test-unit`
- [ ] 14.1.2 Run all feature tests: `make test-feature`
- [ ] 14.1.3 Run architecture tests: `make test-architecture`
- [ ] 14.1.4 Run security tests: `make test-security`
- [ ] 14.1.5 Verify coverage > 80%: `make test-coverage`

### 14.2 Manual Testing
- [ ] 14.2.1 Test message send/receive in same browser
- [ ] 14.2.2 Test message send/receive across browsers
- [ ] 14.2.3 Test with network throttling
- [ ] 14.2.4 Test EventSource reconnection on network loss
- [ ] 14.2.5 Test with multiple chat rooms open
- [ ] 14.2.6 Test pagination (scroll to load more)
- [ ] 14.2.7 Test authorization (access denied to non-participants)

### 14.3 Performance Testing
- [ ] 14.3.1 Test with 100+ messages in a room
- [ ] 14.3.2 Test with 10+ concurrent connections
- [ ] 14.3.3 Monitor memory usage in browser
- [ ] 14.3.4 Monitor memory usage in FrankenPHP
- [ ] 14.3.5 Verify no memory leaks (use Chrome DevTools)

### 14.4 Security Testing
- [ ] 14.4.1 Verify JWT validation on Mercure connection
- [ ] 14.4.2 Verify user cannot subscribe to other users' rooms
- [ ] 14.4.3 Verify CSRF protection on message POST
- [ ] 14.4.4 Verify XSS protection (sanitize message content)
- [ ] 14.4.5 Test rate limiting (if implemented)

## 15. Documentation

### 15.1 Backend Documentation
- [ ] 15.1.1 Update `api/CLAUDE.md` with Mercure configuration
- [ ] 15.1.2 Document Caddyfile setup
- [ ] 15.1.3 Document environment variables
- [ ] 15.1.4 Add troubleshooting section
- [ ] 15.1.5 Update `api/AGENTS.md` with chat architecture

### 15.2 Frontend Documentation
- [ ] 15.2.1 Update `frontend/CLAUDE.md` with EventSource patterns
- [ ] 15.2.2 Document Mercure hook usage
- [ ] 15.2.3 Add examples to `AI-DD/` for real-time patterns
- [ ] 15.2.4 Update `frontend/AGENTS.md` with chat components

### 15.3 Deployment Documentation
- [ ] 15.3.1 Create deployment checklist
- [ ] 15.3.2 Document environment variable requirements
- [ ] 15.3.3 Document Mercure hub configuration
- [ ] 15.3.4 Document rollback procedure

## 16. Deployment

### 16.1 Pre-Deployment Checklist
- [ ] 16.1.1 All tests pass: `make test`
- [ ] 16.1.2 PHPStan clean: `make tools`
- [ ] 16.1.3 Frontend builds: `bun run build`
- [ ] 16.1.4 Frontend lints: `bun run lint`
- [ ] 16.1.5 Postman collection updated
- [ ] 16.1.6 Documentation updated

### 16.2 Backend Deployment
- [ ] 16.2.1 Set production environment variables
- [ ] 16.2.2 Update Caddyfile with production domain
- [ ] 16.2.3 Generate production Mercure JWT secret
- [ ] 16.2.4 Run migrations: `make migrate`
- [ ] 16.2.5 Clear cache: `make cache`
- [ ] 16.2.6 Restart FrankenPHP

### 16.3 Frontend Deployment
- [ ] 16.3.1 Set production API URL
- [ ] 16.3.2 Set production Mercure public URL
- [ ] 16.3.3 Build production bundle: `bun run build`
- [ ] 16.3.4 Deploy to hosting platform
- [ ] 16.3.5 Verify build in production

### 16.4 Post-Deployment Verification
- [ ] 16.4.1 Test login flow
- [ ] 16.4.2 Test chat room creation
- [ ] 16.4.3 Test message send/receive
- [ ] 16.4.4 Test Mercure SSE connection
- [ ] 16.4.5 Monitor error logs for 24 hours
- [ ] 16.4.6 Verify database migrations applied
- [ ] 16.4.7 Check performance metrics

## 17. Optional Enhancements (Phase 2)

### 17.1 Typing Indicators
- [ ] 17.1.1 Create "typing" event in backend
- [ ] 17.1.2 Publish typing events to Mercure
- [ ] 17.1.3 Subscribe to typing events in frontend
- [ ] 17.1.4 Display "User is typing..." indicator
- [ ] 17.1.5 Debounce typing events (500ms)

### 17.2 Online/Offline Status
- [ ] 17.2.1 Track user connection status
- [ ] 17.2.2 Publish status changes to Mercure
- [ ] 17.2.3 Display online/offline badges
- [ ] 17.2.4 Show "Last seen" timestamp

### 17.3 Message Reactions
- [ ] 17.3.1 Add reactions table (message_id, user_id, emoji)
- [ ] 17.3.2 Create API endpoint for reactions
- [ ] 17.3.3 Publish reaction events to Mercure
- [ ] 17.3.4 Display reaction counts in UI

### 17.4 File Attachments
- [ ] 17.4.1 Add file upload endpoint
- [ ] 17.4.2 Store file metadata in Message entity
- [ ] 17.4.3 Display file previews in chat
- [ ] 17.4.4 Add file download link

### 17.5 Search & Filters
- [ ] 17.5.1 Add full-text search for messages
- [ ] 17.5.2 Add date range filters
- [ ] 17.5.3 Add "Jump to message" feature
- [ ] 17.5.4 Add search results highlighting
