# Real-Time Updates Capability

## ADDED Requirements

### Requirement: Mercure Hub Configuration

The system SHALL configure FrankenPHP with an embedded Mercure hub for real-time event broadcasting.

#### Scenario: Mercure Hub Availability

- **GIVEN** the FrankenPHP application server is running
- **WHEN** a client accesses the Mercure endpoint at `/.well-known/mercure`
- **THEN** the Mercure hub SHALL respond with a valid SSE (Server-Sent Events) stream
- **AND** the response SHALL have Content-Type: text/event-stream
- **AND** the response SHALL support chunked transfer encoding

#### Scenario: Caddyfile Mercure Configuration

- **GIVEN** the FrankenPHP Caddyfile configuration
- **THEN** the Caddyfile SHALL include a `mercure` block
- **AND** the block SHALL define a publisher JWT key
- **AND** the block SHALL enable anonymous subscribers or require JWT authentication
- **AND** the block SHALL configure CORS origins for the frontend

#### Scenario: Full-Duplex Mode

- **GIVEN** the FrankenPHP Caddyfile configuration
- **THEN** the global options SHALL enable full-duplex mode
- **AND** the configuration SHALL include `servers { enable_full_duplex }`
- **AND** SSE connections SHALL be properly supported

#### Scenario: Environment Variable Configuration

- **GIVEN** the backend application environment
- **THEN** the following environment variables SHALL be defined:
  - **MERCURE_URL**: Internal hub URL (e.g., http://localhost/.well-known/mercure)
  - **MERCURE_PUBLIC_URL**: Public hub URL for frontend (e.g., http://localhost/.well-known/mercure)
  - **MERCURE_JWT_SECRET**: Secret key for signing JWT tokens (min 32 characters)

### Requirement: Symfony Mercure Bundle Integration

The system SHALL integrate Symfony Mercure Bundle for publishing events to the Mercure hub.

#### Scenario: Mercure Bundle Installation

- **GIVEN** the Symfony application
- **THEN** the `symfony/mercure-bundle` package SHALL be installed via Composer
- **AND** the `lcobucci/jwt` package SHALL be installed for JWT token generation
- **AND** the bundle SHALL be registered in `config/bundles.php`

#### Scenario: Mercure Configuration File

- **GIVEN** the Symfony configuration directory
- **THEN** a `config/packages/mercure.yaml` file SHALL exist
- **AND** the file SHALL define the default hub configuration
- **AND** the configuration SHALL reference environment variables for URLs and secrets
- **AND** JWT configuration SHALL include publish topics and algorithm

#### Scenario: Mercure Service Availability

- **GIVEN** the Symfony service container
- **WHEN** the application is bootstrapped
- **THEN** the Mercure `HubInterface` SHALL be available for dependency injection
- **AND** the hub SHALL be configured with the specified URL and JWT secret

### Requirement: Message Broadcasting

The system SHALL automatically broadcast chat messages to subscribed clients via Mercure.

#### Scenario: Automatic Message Publishing

- **GIVEN** a new message is created via API Platform
- **WHEN** the message is persisted to the database
- **THEN** API Platform SHALL automatically publish the message to Mercure
- **AND** the publication SHALL be triggered by `#[ApiResource(mercure: true)]` annotation
- **AND** no manual publishing code SHALL be required in the controller

#### Scenario: Message Topic Structure

- **GIVEN** a message belongs to a chat room with ID 42
- **WHEN** the message is published to Mercure
- **THEN** the topic SHALL be `/chat/room/42`
- **AND** the topic SHALL follow the pattern `/chat/room/{chatRoomId}`
- **AND** subscribers to this topic SHALL receive the message

#### Scenario: Message Payload Format

- **GIVEN** a message is published to Mercure
- **WHEN** the event is broadcasted
- **THEN** the payload SHALL be JSON-encoded
- **AND** the payload SHALL match the API Platform serialization (message:read group)
- **AND** the payload SHALL include: id, content, author, chatRoom, createdAt

#### Scenario: Private Updates

- **GIVEN** a message is published to Mercure
- **THEN** the update SHALL be marked as private
- **AND** only subscribers with a valid JWT containing the matching topic SHALL receive it
- **AND** unauthorized subscribers SHALL NOT receive the message

### Requirement: Client Subscription

The system SHALL enable frontend clients to subscribe to real-time updates using the EventSource API.

#### Scenario: EventSource Connection

- **GIVEN** a frontend client wants to receive real-time updates for chat room 42
- **WHEN** the client creates an EventSource connection
- **THEN** the URL SHALL be `/.well-known/mercure?topic=/chat/room/42`
- **AND** the connection SHALL use the HTTP GET method
- **AND** the response SHALL stream SSE events

#### Scenario: JWT Authentication for Subscription

- **GIVEN** a user is authenticated and wants to subscribe to a chat room
- **WHEN** the client creates an EventSource connection
- **THEN** the request SHALL include a JWT token in the authorization query parameter
- **AND** the JWT SHALL be signed with the MERCURE_JWT_SECRET
- **AND** the JWT SHALL include the subscribed topic in claims
- **AND** the Mercure hub SHALL validate the JWT before accepting the subscription

#### Scenario: Unauthorized Subscription Attempt

- **GIVEN** a user attempts to subscribe to a chat room without a valid JWT
- **WHEN** the EventSource connection is attempted
- **THEN** the Mercure hub SHALL return 401 Unauthorized
- **AND** the connection SHALL be rejected
- **AND** no events SHALL be streamed to the client

#### Scenario: Multiple Topic Subscription

- **GIVEN** a user is a participant in multiple chat rooms (e.g., room 1, room 2, room 3)
- **WHEN** the client wants to receive updates from all rooms
- **THEN** the client MAY create separate EventSource connections for each topic
- **OR** the client MAY use a single connection with multiple topic query parameters
- **AND** the Mercure hub SHALL broadcast events to all matching subscriptions

### Requirement: Connection Management

The system SHALL handle EventSource connection lifecycle properly.

#### Scenario: Auto-Reconnection

- **GIVEN** an established EventSource connection
- **WHEN** the connection is interrupted (network failure, server restart)
- **THEN** the EventSource API SHALL automatically attempt to reconnect
- **AND** the reconnection SHALL use exponential backoff
- **AND** the Last-Event-ID header SHALL be sent to resume from the last received event

#### Scenario: Connection Cleanup

- **GIVEN** a frontend component with an active EventSource connection
- **WHEN** the component is unmounted (user navigates away)
- **THEN** the EventSource connection SHALL be explicitly closed
- **AND** the connection SHALL call `eventSource.close()`
- **AND** server resources SHALL be released

#### Scenario: Error Handling

- **GIVEN** an EventSource connection
- **WHEN** an error occurs (network issue, invalid response)
- **THEN** the `onerror` event handler SHALL be invoked
- **AND** the frontend SHALL log the error
- **AND** the frontend SHALL display a user-friendly error message
- **AND** the frontend MAY attempt to reconnect after a delay

#### Scenario: Heartbeat Support

- **GIVEN** a long-lived EventSource connection
- **WHEN** no messages are sent for an extended period (e.g., 30 seconds)
- **THEN** the Mercure hub SHOULD send a heartbeat (comment line)
- **AND** the heartbeat SHALL prevent connection timeout
- **AND** the heartbeat SHALL be a line starting with `:` (SSE comment)

### Requirement: Security & Authorization

The system SHALL enforce strict authorization for Mercure subscriptions.

#### Scenario: JWT Token Generation

- **GIVEN** an authenticated user wants to subscribe to a chat room
- **WHEN** the backend generates a Mercure JWT
- **THEN** the JWT SHALL be signed with the MERCURE_JWT_SECRET
- **AND** the JWT SHALL use the HS256 algorithm
- **AND** the JWT SHALL include the subscribe claim with the room topic
- **AND** the JWT SHALL have an expiration time (e.g., 1 hour)

#### Scenario: Topic-Based Authorization

- **GIVEN** a user is a participant in chat room 42 but NOT in chat room 99
- **WHEN** the user's JWT is generated
- **THEN** the JWT subscribe claim SHALL include `/chat/room/42`
- **AND** the JWT SHALL NOT include `/chat/room/99`
- **AND** attempts to subscribe to `/chat/room/99` SHALL be rejected

#### Scenario: JWT Refresh

- **GIVEN** a user has an active EventSource connection
- **WHEN** the JWT token is about to expire
- **THEN** the frontend SHALL refresh the JWT using the refresh token flow
- **AND** the frontend SHALL close the old EventSource connection
- **AND** the frontend SHALL create a new EventSource connection with the new JWT
- **AND** message delivery SHALL not be interrupted (use Last-Event-ID)

### Requirement: CORS Configuration

The system SHALL properly configure CORS to allow frontend access to the Mercure hub.

#### Scenario: CORS Preflight Request

- **GIVEN** a frontend at http://localhost:3000 attempts to connect to Mercure
- **WHEN** the browser sends an OPTIONS preflight request
- **THEN** the Mercure hub SHALL respond with appropriate CORS headers
- **AND** Access-Control-Allow-Origin SHALL include http://localhost:3000
- **AND** Access-Control-Allow-Credentials SHALL be true (if using cookies)

#### Scenario: CORS Headers in SSE Response

- **GIVEN** an EventSource connection from the frontend
- **WHEN** the Mercure hub streams SSE events
- **THEN** each response SHALL include Access-Control-Allow-Origin header
- **AND** the header SHALL match the frontend origin

#### Scenario: Multiple Frontend Origins

- **GIVEN** the application has multiple frontend origins (development, staging, production)
- **WHEN** the Caddyfile is configured
- **THEN** the `cors_origins` directive SHALL list all allowed origins
- **OR** the `cors_origins` directive SHALL use a wildcard pattern (with caution)
- **AND** each origin SHALL be validated before accepting connections

### Requirement: Performance & Scalability

The system SHALL handle multiple concurrent SSE connections efficiently.

#### Scenario: Concurrent Connection Limit

- **GIVEN** the Mercure hub is configured
- **THEN** the hub SHALL support at least 100 concurrent SSE connections
- **AND** each connection SHALL consume minimal memory (< 1MB)
- **AND** the hub SHALL not degrade under typical load

#### Scenario: Message Throughput

- **GIVEN** a high-traffic chat room with frequent messages
- **WHEN** messages are published to Mercure
- **THEN** the hub SHALL deliver messages to subscribers with minimal latency (< 100ms)
- **AND** the hub SHALL handle at least 100 messages per second
- **AND** no messages SHALL be lost or duplicated

#### Scenario: Memory Management

- **GIVEN** long-lived SSE connections
- **WHEN** the application runs for extended periods
- **THEN** the Mercure hub SHALL not exhibit memory leaks
- **AND** connection buffers SHALL be properly released on disconnect
- **AND** the hub SHALL use bounded memory buffers

### Requirement: Monitoring & Debugging

The system SHALL provide visibility into Mercure hub operation.

#### Scenario: Connection Logging

- **GIVEN** the Mercure hub is running in development mode
- **WHEN** a client connects or disconnects
- **THEN** the hub SHALL log connection events
- **AND** the logs SHALL include timestamp, client IP, and topic
- **AND** the logs SHALL be accessible via Docker logs or Dozzle

#### Scenario: Error Logging

- **GIVEN** the Mercure hub encounters an error
- **WHEN** a JWT validation fails or a malformed request is received
- **THEN** the hub SHALL log the error with details
- **AND** the log level SHALL be appropriate (ERROR for failures, WARN for retries)

#### Scenario: Metrics Endpoint

- **GIVEN** the Mercure hub is configured (optional for Phase 2)
- **THEN** the hub SHOULD expose a metrics endpoint (e.g., `/metrics`)
- **AND** the endpoint SHALL report active connection count
- **AND** the endpoint SHALL report message throughput

### Requirement: Frontend Implementation

The system SHALL provide reusable React hooks for Mercure integration.

#### Scenario: Mercure Hook

- **GIVEN** a React component needs to subscribe to real-time updates
- **WHEN** the component uses the `useMercure` hook
- **THEN** the hook SHALL accept a topic string as parameter
- **AND** the hook SHALL return data, error, and loading states
- **AND** the hook SHALL manage the EventSource connection lifecycle
- **AND** the hook SHALL clean up on component unmount

#### Scenario: Type Safety

- **GIVEN** the Mercure hook implementation
- **THEN** the hook SHALL be TypeScript-generic `useMercure<T>(topic: string)`
- **AND** the returned data SHALL be typed as `T[]`
- **AND** TypeScript SHALL enforce type safety at compile time

#### Scenario: Hook Dependency Management

- **GIVEN** the Mercure hook is used with a dynamic topic
- **WHEN** the topic parameter changes
- **THEN** the hook SHALL close the old EventSource connection
- **AND** the hook SHALL create a new EventSource connection with the new topic
- **AND** React SHALL manage the effect dependencies correctly

### Requirement: Fallback & Degradation

The system SHALL gracefully degrade if Mercure is unavailable.

#### Scenario: Mercure Hub Unavailable

- **GIVEN** the Mercure hub is down or unreachable
- **WHEN** a client attempts to connect
- **THEN** the EventSource connection SHALL fail
- **AND** the frontend SHALL catch the error
- **AND** the frontend SHALL display a warning message
- **AND** the frontend MAY fall back to polling (GET /api/messages every 5 seconds)

#### Scenario: Browser Compatibility

- **GIVEN** a browser that does not support EventSource (IE 11, older browsers)
- **WHEN** the frontend detects EventSource is unavailable
- **THEN** the frontend SHALL fall back to polling or long-polling
- **AND** the user SHALL receive a message indicating limited functionality
- **OR** the application SHALL use an EventSource polyfill

### Requirement: Testing

The system SHALL include tests for Mercure integration.

#### Scenario: Integration Test for Publishing

- **GIVEN** a test environment with Mercure hub running
- **WHEN** a message is created via API
- **THEN** the test SHALL verify the message is published to Mercure
- **AND** the test SHALL subscribe to the topic and receive the event
- **AND** the test SHALL validate the event payload

#### Scenario: Authorization Test

- **GIVEN** a test user without access to a chat room
- **WHEN** the test attempts to subscribe to the room's Mercure topic
- **THEN** the test SHALL verify a 401 Unauthorized response
- **AND** the test SHALL confirm no events are received

#### Scenario: Connection Lifecycle Test

- **GIVEN** a frontend component test
- **WHEN** the component mounts and unmounts
- **THEN** the test SHALL verify the EventSource is created on mount
- **AND** the test SHALL verify the EventSource is closed on unmount
- **AND** the test SHALL check for memory leaks
