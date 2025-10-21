# Real-Time Chat Design with Mercure

## Context

The application currently has:
- **Backend**: Symfony 7.3 + API Platform 4.2 running on FrankenPHP
- **Frontend**: Next.js 15 with mock chat UI components
- **Infrastructure**: Docker Compose with PostgreSQL, Redis, FrankenPHP

We need to implement production-ready real-time chat functionality. The choice of real-time technology is critical as it affects:
- Infrastructure complexity
- Development effort
- Scalability
- Operational overhead
- Browser compatibility

**Stakeholders:**
- Development team (full-stack, TDD-focused)
- End users (expect instant messaging)
- Operations (prefer simple, reliable infrastructure)

**Constraints:**
- Must follow strict TDD principles (backend)
- Must work with existing FrankenPHP stack
- Must integrate with API Platform
- Must respect SOLID principles
- Budget: Favor built-in solutions over external services

## Goals / Non-Goals

### Goals
- ✅ Real-time bidirectional communication for chat messages
- ✅ Automatic reconnection on network failures
- ✅ Secure authorization (users only see their messages)
- ✅ Scalable to hundreds of concurrent connections
- ✅ Simple infrastructure (no external services if possible)
- ✅ Standards-based implementation
- ✅ Mobile browser support

### Non-Goals
- ❌ Video/voice calling (separate feature)
- ❌ File uploads in messages (can add later)
- ❌ Message encryption (use HTTPS for transport security)
- ❌ Message search/indexing (can add later)
- ❌ Multi-device synchronization (Phase 2)
- ❌ Read receipts (Phase 2)

## Decision: Use Mercure for Real-Time Communication

### Why Mercure Over Alternatives

| Technology | Pros | Cons | Verdict |
|------------|------|------|---------|
| **Mercure (SSE)** | ✅ Built into FrankenPHP<br>✅ Simple HTTP/SSE<br>✅ Auto-reconnection<br>✅ API Platform integration<br>✅ No external dependencies | ⚠️ Unidirectional (server→client)<br>⚠️ Client must POST for messages | **CHOSEN** |
| WebSockets | ✅ Full-duplex<br>✅ Lower latency | ❌ Requires separate server<br>❌ Complex connection management<br>❌ No FrankenPHP integration | Rejected |
| Long Polling | ✅ Universal compatibility | ❌ High server load<br>❌ Inefficient<br>❌ No FrankenPHP support | Rejected |
| Pusher/Ably | ✅ Managed service<br>✅ Feature-rich | ❌ External dependency<br>❌ Cost<br>❌ Vendor lock-in | Rejected |

**Rationale**: Mercure is the clear winner because:
1. **Zero infrastructure overhead**: Already included in FrankenPHP
2. **Standards-based**: SSE is a W3C standard with 96%+ browser support
3. **Symfony ecosystem**: Native API Platform support with `#[ApiResource(mercure: true)]`
4. **Simplicity**: HTTP-based, easier to debug than WebSockets
5. **Cost**: No additional services or licensing

For chat, unidirectional SSE is sufficient:
- Server pushes new messages to subscribers (SSE)
- Clients POST new messages via REST API
- This is the same pattern used by Slack, Discord, and other modern chat apps

### Mercure Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FrankenPHP                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Symfony App                        │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────┐     │   │
│  │  │  API Platform Resource                     │     │   │
│  │  │  #[ApiResource(mercure: true)]             │     │   │
│  │  │                                             │     │   │
│  │  │  POST /api/messages                         │     │   │
│  │  │    ↓                                        │     │   │
│  │  │  MessageService::create()                   │     │   │
│  │  │    ↓                                        │     │   │
│  │  │  Doctrine::persist()                        │     │   │
│  │  │    ↓                                        │     │   │
│  │  │  Mercure::publish()  ─────────────────┐    │     │   │
│  │  └────────────────────────────────────────┘    │     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                │             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Mercure Hub (Caddy)             │       │   │
│  │                                                      │   │
│  │  /.well-known/mercure?topic=/chat/room/{id}         │   │
│  │                                              │       │   │
│  │  ┌──────────────────────────────────┐       │       │   │
│  │  │  Topic Subscribers               │       │       │   │
│  │  │  - User 1: EventSource           │ ◄─────┘       │   │
│  │  │  - User 2: EventSource           │               │   │
│  │  │  - User 3: EventSource           │               │   │
│  │  └──────────────────────────────────┘               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               ▲
                               │ SSE Stream
                    ┌──────────┴──────────┐
                    │   Next.js Frontend  │
                    │                     │
                    │  EventSource API    │
                    └─────────────────────┘
```

### Data Flow

#### Sending a Message
```
1. User types message in Next.js UI
2. Frontend: POST /api/messages { chatRoomId: 1, content: "Hello" }
3. Backend: MessageController → MessageService
4. Backend: MessageService validates + persists to PostgreSQL
5. Backend: API Platform auto-publishes to Mercure via #[ApiResource(mercure: true)]
6. Mercure Hub: Broadcasts to all subscribers of topic "/chat/room/1"
7. Frontend: EventSource receives event, updates UI
```

#### Receiving Messages
```
1. User opens chat room
2. Frontend: GET /api/messages?chatRoom=1 (initial load)
3. Frontend: new EventSource("/.well-known/mercure?topic=/chat/room/1")
4. Mercure Hub: Establishes SSE connection
5. When message arrives: Server sends SSE event
6. Frontend: EventSource.onmessage → setState → React re-render
```

## Database Schema

### Entity Relationship Diagram
```
┌──────────────┐       ┌────────────────────┐       ┌─────────────┐
│     User     │       │  ChatParticipant   │       │  ChatRoom   │
├──────────────┤       ├────────────────────┤       ├─────────────┤
│ id (PK)      │◄──────┤ id (PK)            │──────►│ id (PK)     │
│ email        │       │ user_id (FK)       │       │ name        │
│ password     │       │ chat_room_id (FK)  │       │ type        │
│ roles        │       │ joined_at          │       │ created_at  │
│ created_at   │       │ role               │       │ updated_at  │
└──────────────┘       └────────────────────┘       └─────────────┘
       ▲                                                    ▲
       │                                                    │
       │                 ┌──────────────┐                  │
       │                 │   Message    │                  │
       └─────────────────┤──────────────┤──────────────────┘
                         │ id (PK)      │
                         │ author_id    │
                         │ chat_room_id │
                         │ content      │
                         │ created_at   │
                         └──────────────┘
```

### Entity Details

#### ChatRoom
```php
#[ApiResource(
    mercure: true,
    normalizationContext: ['groups' => ['chatRoom:read']],
    denormalizationContext: ['groups' => ['chatRoom:write']]
)]
class ChatRoom
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(length: 50)]
    private string $type; // 'direct' | 'group' | 'public'

    #[ORM\OneToMany(mappedBy: 'chatRoom', targetEntity: Message::class)]
    private Collection $messages;

    #[ORM\OneToMany(mappedBy: 'chatRoom', targetEntity: ChatParticipant::class)]
    private Collection $participants;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;
}
```

#### Message
```php
#[ApiResource(
    mercure: true,
    normalizationContext: ['groups' => ['message:read']],
    denormalizationContext: ['groups' => ['message:write']],
    security: "is_granted('ROLE_USER')"
)]
class Message
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $author;

    #[ORM\ManyToOne(targetEntity: ChatRoom::class, inversedBy: 'messages')]
    #[ORM\JoinColumn(nullable: false)]
    private ChatRoom $chatRoom;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    // Mercure topic: /chat/room/{chatRoomId}
}
```

#### ChatParticipant
```php
#[ORM\Entity]
class ChatParticipant
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: ChatRoom::class, inversedBy: 'participants')]
    #[ORM\JoinColumn(nullable: false)]
    private ChatRoom $chatRoom;

    #[ORM\Column(length: 50)]
    private string $role; // 'admin' | 'member'

    #[ORM\Column]
    private \DateTimeImmutable $joinedAt;
}
```

### Indexes
```sql
CREATE INDEX idx_message_chat_room ON message(chat_room_id);
CREATE INDEX idx_message_created_at ON message(created_at DESC);
CREATE INDEX idx_chat_participant_user ON chat_participant(user_id);
CREATE INDEX idx_chat_participant_room ON chat_participant(chat_room_id);
CREATE UNIQUE INDEX idx_chat_participant_unique ON chat_participant(user_id, chat_room_id);
```

## Mercure Configuration

### Backend Configuration

#### composer.json
```json
{
    "require": {
        "symfony/mercure-bundle": "^0.3",
        "lcobucci/jwt": "^5.0"
    }
}
```

#### config/packages/mercure.yaml
```yaml
mercure:
    hubs:
        default:
            url: '%env(MERCURE_URL)%'
            public_url: '%env(MERCURE_PUBLIC_URL)%'
            jwt:
                secret: '%env(MERCURE_JWT_SECRET)%'
                publish: ['*']
                algorithm: 'HS256'
```

#### .env
```bash
# Mercure Configuration
MERCURE_URL=http://localhost/.well-known/mercure
MERCURE_PUBLIC_URL=http://localhost/.well-known/mercure
MERCURE_JWT_SECRET=!ChangeThisMercureHubJWTSecretKey!
```

### FrankenPHP Configuration

#### Caddyfile (embedded in FrankenPHP)
Create `/etc/frankenphp/Caddyfile` or mount via Docker:

```caddyfile
{
    # Enable full-duplex for SSE
    servers {
        enable_full_duplex
    }
}

{$SERVER_NAME:localhost}

# Enable Mercure
mercure {
    # Publisher JWT key (must match MERCURE_JWT_SECRET)
    publisher_jwt {env.MERCURE_JWT_SECRET} {
        alg HS256
    }
    # Allow anonymous subscribers (authenticated via cookies)
    anonymous
    # CORS configuration
    cors_origins http://localhost:3000 http://127.0.0.1:3000
}

# PHP-FPM configuration
php_server
```

#### compose.dev.yaml
```yaml
services:
  webapp:
    environment:
      - MERCURE_JWT_SECRET=!ChangeThisMercureHubJWTSecretKey!
      - MERCURE_PUBLISHER_JWT_KEY=!ChangeThisMercureHubJWTSecretKey!
      - MERCURE_SUBSCRIBER_JWT_KEY=!ChangeThisMercureHubJWTSecretKey!
      - SERVER_NAME=:80
    volumes:
      - ./Caddyfile:/etc/frankenphp/Caddyfile:ro
```

## Security Model

### Authentication Flow
```
1. User logs in → receives JWT access token
2. Frontend stores JWT in memory (not localStorage)
3. Frontend creates EventSource with JWT in URL query param:
   new EventSource("/.well-known/mercure?topic=/chat/room/1&authorization=Bearer%20{JWT}")
4. Mercure Hub validates JWT signature
5. If valid: establish SSE connection
6. If invalid: return 401 Unauthorized
```

### Authorization Rules

#### Room Access
```php
// ChatRoom::security
security: "is_granted('VIEW', object)"

// ChatRoomVoter
class ChatRoomVoter extends Voter
{
    protected function voteOnAttribute($attribute, $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        $room = $subject;

        // Check if user is participant
        return $room->getParticipants()
            ->filter(fn($p) => $p->getUser() === $user)
            ->count() > 0;
    }
}
```

#### Message Access
```php
// Only participants of the room can see messages
security: "is_granted('VIEW', object.getChatRoom())"
```

#### Mercure Topics
Topics are based on chat room ID:
- Public topic: `/chat/room/{chatRoomId}`
- Only participants can subscribe (checked via JWT claims)

### JWT Claims for Mercure
```php
// MessageService::publish()
$update = new Update(
    topics: ["/chat/room/{$message->getChatRoom()->getId()}"],
    data: $serializer->serialize($message, 'json'),
    private: true, // Requires JWT with matching topic
);

$hub->publish($update);
```

## Frontend Implementation

### EventSource Connection
```typescript
// lib/hooks/use-mercure.ts
export function useMercure<T>(topic: string) {
  const [data, setData] = useState<T[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const url = new URL('/.well-known/mercure', process.env.NEXT_PUBLIC_API_URL)
    url.searchParams.append('topic', topic)

    // Get JWT from auth context
    const jwt = getAccessToken()
    if (jwt) {
      url.searchParams.append('authorization', `Bearer ${jwt}`)
    }

    const eventSource = new EventSource(url.toString())

    eventSource.onmessage = (event) => {
      const newData = JSON.parse(event.data) as T
      setData((prev) => [...prev, newData])
    }

    eventSource.onerror = (err) => {
      setError(new Error('EventSource connection failed'))
      eventSource.close()
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [topic])

  return { data, error }
}
```

### Usage in Chat Component
```typescript
'use client'

export function ChatMessages({ roomId }: { roomId: number }) {
  const { data: messages } = useMercure<Message>(`/chat/room/${roomId}`)

  return (
    <div>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  )
}
```

## Alternatives Considered

### Alternative 1: Raw WebSockets
**Pros**: Full-duplex, lower latency
**Cons**: Requires separate WebSocket server (e.g., Ratchet, Socket.IO), complex connection management, no FrankenPHP integration
**Verdict**: Rejected - too much infrastructure overhead for chat use case

### Alternative 2: Firebase Realtime Database
**Pros**: Managed service, easy setup
**Cons**: External dependency, cost, vendor lock-in, data lives outside our control
**Verdict**: Rejected - prefer self-hosted solution

### Alternative 3: Polling
**Pros**: Simple implementation
**Cons**: High server load, inefficient, poor UX (delay in updates)
**Verdict**: Rejected - not suitable for real-time chat

## Risks / Trade-offs

### Risk: Mercure Hub Configuration Complexity
- **Impact**: High (blocking deployment)
- **Probability**: Medium (Caddyfile syntax is tricky)
- **Mitigation**:
  - Use exact example from FrankenPHP docs
  - Test configuration locally first
  - Add validation step in deployment pipeline
  - Document configuration in CLAUDE.md

### Risk: JWT Secret Mismatch
- **Impact**: High (authentication fails)
- **Probability**: Medium (easy to misconfigure)
- **Mitigation**:
  - Use single environment variable for both Symfony and Mercure
  - Add startup validation to check JWT configuration
  - Include in deployment checklist

### Risk: EventSource Browser Compatibility
- **Impact**: Low (SSE is widely supported)
- **Probability**: Low (96%+ browser support)
- **Mitigation**:
  - Test on target browsers (Chrome, Firefox, Safari, Edge)
  - Provide polyfill for older browsers if needed
  - Graceful degradation to polling as fallback

### Risk: Scalability Under Load
- **Impact**: Medium (poor UX if slow)
- **Probability**: Low (current expected load is low)
- **Mitigation**:
  - Monitor Mercure hub memory usage
  - Implement connection limits per user
  - Load test with realistic concurrency (100+ connections)
  - Consider horizontal scaling of FrankenPHP instances

### Risk: Message Ordering
- **Impact**: Medium (confusing chat if out of order)
- **Probability**: Low (single server, PostgreSQL sequence)
- **Mitigation**:
  - Use `created_at` timestamp for ordering
  - Add sequence number to messages
  - Sort messages client-side by timestamp

### Trade-off: SSE vs WebSocket
- **Chosen**: SSE (unidirectional)
- **Rationale**: Chat doesn't need full-duplex; clients POST messages via REST
- **Consequence**: Slightly higher latency (HTTP POST + SSE) vs pure WebSocket
- **Acceptable**: Latency difference is negligible (<100ms)

## Migration Plan

### Phase 1: Backend Foundation (Week 1-2)
1. Install Mercure bundle and dependencies
2. Configure Mercure in Symfony
3. Create database entities (TDD)
4. Implement API endpoints (TDD)
5. Configure FrankenPHP Caddyfile
6. Test Mercure publishing locally

### Phase 2: Frontend Integration (Week 2-3)
1. Create API client for chat endpoints
2. Implement EventSource hook
3. Update chat UI components
4. Add error handling and reconnection
5. Test end-to-end flow

### Phase 3: Polish & Launch (Week 3-4)
1. Add loading states and optimistic updates
2. Implement typing indicators (optional)
3. Add online/offline status (optional)
4. Performance testing
5. Security audit
6. Documentation updates
7. Production deployment

### Rollback Strategy
If critical issues arise:
1. **Quick fix**: Disable Mercure, keep message persistence
2. **Fallback**: Revert to polling (add interval fetching in frontend)
3. **Full rollback**: Restore previous deployment, keep database migrations

## Open Questions

1. **Message retention policy**: How long to keep messages? Archive after 30 days?
   - **Decision needed by**: Backend implementation
   - **Impact**: Database storage costs

2. **Typing indicators**: Should we implement in Phase 1 or Phase 2?
   - **Recommendation**: Phase 2 (nice-to-have, not MVP)

3. **File attachments**: Separate feature or part of chat?
   - **Recommendation**: Separate feature (complex upload flow)

4. **Rate limiting**: Limit messages per user per minute?
   - **Recommendation**: Yes, add rate limiter (e.g., 60 messages/minute)

5. **Message editing/deletion**: Support soft deletes?
   - **Recommendation**: Phase 2 (adds complexity to real-time sync)
