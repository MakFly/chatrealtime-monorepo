# Chat Messaging Capability

## ADDED Requirements

### Requirement: Chat Room Management

The system SHALL provide chat room functionality for organizing conversations between users.

#### Scenario: Create Direct Chat Room

- **GIVEN** an authenticated user
- **WHEN** the user creates a direct chat room with another user
- **THEN** a chat room of type "direct" SHALL be created
- **AND** both users SHALL be added as participants
- **AND** the creator SHALL have "admin" role
- **AND** the other user SHALL have "member" role

#### Scenario: Create Group Chat Room

- **GIVEN** an authenticated user
- **WHEN** the user creates a group chat room with a name
- **THEN** a chat room of type "group" SHALL be created
- **AND** the creator SHALL be added as the first participant with "admin" role
- **AND** the room name SHALL be stored

#### Scenario: List User's Chat Rooms

- **GIVEN** an authenticated user who is a participant in multiple chat rooms
- **WHEN** the user requests their chat rooms via GET /api/v1/chat_rooms
- **THEN** the system SHALL return all rooms where the user is a participant
- **AND** each room SHALL include participant count
- **AND** rooms SHALL be ordered by last activity (most recent first)

#### Scenario: View Chat Room Details

- **GIVEN** an authenticated user who is a participant in a chat room
- **WHEN** the user requests chat room details via GET /api/v1/chat_rooms/{id}
- **THEN** the system SHALL return the room information
- **AND** the response SHALL include room name, type, participant list, and creation date

#### Scenario: Unauthorized Room Access

- **GIVEN** an authenticated user who is NOT a participant in a chat room
- **WHEN** the user attempts to access the room via GET /api/v1/chat_rooms/{id}
- **THEN** the system SHALL return 403 Forbidden
- **AND** no room information SHALL be disclosed

### Requirement: Message Persistence

The system SHALL persist chat messages to the database with full audit trail.

#### Scenario: Send Message to Chat Room

- **GIVEN** an authenticated user who is a participant in a chat room
- **WHEN** the user sends a message via POST /api/messages
- **AND** the request includes chatRoomId and content
- **THEN** the system SHALL create a new message record
- **AND** the message SHALL be associated with the user as author
- **AND** the message SHALL be associated with the chat room
- **AND** the createdAt timestamp SHALL be automatically set
- **AND** the message SHALL be persisted to the database

#### Scenario: Message Content Validation

- **GIVEN** an authenticated user attempting to send a message
- **WHEN** the message content is empty or exceeds 5000 characters
- **THEN** the system SHALL return 400 Bad Request
- **AND** the error SHALL indicate the validation failure

#### Scenario: Unauthorized Message Send

- **GIVEN** an authenticated user who is NOT a participant in a chat room
- **WHEN** the user attempts to send a message to that room
- **THEN** the system SHALL return 403 Forbidden
- **AND** no message SHALL be created

#### Scenario: Retrieve Chat Room Messages

- **GIVEN** an authenticated user who is a participant in a chat room
- **WHEN** the user requests messages via GET /api/messages?chatRoom={id}
- **THEN** the system SHALL return messages for that room
- **AND** messages SHALL be ordered by createdAt in descending order (newest first)
- **AND** messages SHALL include author information (id, email)
- **AND** the response SHALL be paginated with default 50 items per page

#### Scenario: Message Pagination

- **GIVEN** a chat room with more than 50 messages
- **WHEN** the user requests messages with page=2 and itemsPerPage=50
- **THEN** the system SHALL return messages 51-100
- **AND** the response SHALL include pagination metadata (totalItems, currentPage, itemsPerPage)

### Requirement: Participant Management

The system SHALL allow chat room administrators to manage participants.

#### Scenario: Add Participant to Room

- **GIVEN** an authenticated user who is an admin of a chat room
- **WHEN** the user adds another user as a participant via POST /api/chat_participants
- **THEN** the new user SHALL be added to the room with "member" role
- **AND** the joinedAt timestamp SHALL be set
- **AND** a unique constraint SHALL prevent duplicate participants

#### Scenario: Remove Participant from Room

- **GIVEN** an authenticated user who is an admin of a chat room
- **WHEN** the user removes a participant via DELETE /api/chat_participants/{id}
- **THEN** the participant SHALL be removed from the room
- **AND** the participant SHALL no longer have access to the room

#### Scenario: Non-Admin Cannot Manage Participants

- **GIVEN** an authenticated user who is a member (not admin) of a chat room
- **WHEN** the user attempts to add or remove participants
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Data Integrity

The system SHALL enforce data integrity constraints for chat entities.

#### Scenario: Unique Participant Constraint

- **GIVEN** a user who is already a participant in a chat room
- **WHEN** an attempt is made to add the same user to the room again
- **THEN** the system SHALL return 400 Bad Request
- **AND** the error SHALL indicate the user is already a participant

#### Scenario: Cascade Delete Protection

- **GIVEN** a chat room with messages and participants
- **WHEN** the room is deleted
- **THEN** the system SHALL cascade delete all messages
- **AND** the system SHALL cascade delete all participants
- **AND** no orphaned records SHALL remain

#### Scenario: Author Reference Integrity

- **GIVEN** a message in a chat room
- **WHEN** the author's user account is deleted
- **THEN** the system SHALL either:
  - **OPTION A**: Soft-delete the user and preserve messages (recommended)
  - **OPTION B**: Set author to a system "deleted user" placeholder
- **AND** message history SHALL remain accessible

### Requirement: API Platform Integration

The system SHALL expose chat entities through API Platform with proper serialization.

#### Scenario: ChatRoom Serialization

- **GIVEN** a chat room resource
- **WHEN** the resource is serialized for API response
- **THEN** the response SHALL include groups: chatRoom:read
- **AND** the response SHALL exclude sensitive internal fields
- **AND** nested participants SHALL use minimal serialization (id, user:read)

#### Scenario: Message Serialization

- **GIVEN** a message resource
- **WHEN** the resource is serialized for API response
- **THEN** the response SHALL include groups: message:read
- **AND** the author SHALL be serialized with user:read group (id, email, NOT password)
- **AND** the chatRoom SHALL be serialized with minimal fields (id, name)

#### Scenario: API Platform Operations

- **GIVEN** the chat entities (ChatRoom, Message, ChatParticipant)
- **WHEN** API Platform is configured
- **THEN** standard REST operations SHALL be available (GET, POST, PATCH, DELETE)
- **AND** each operation SHALL respect security constraints
- **AND** Mercure SHALL be enabled on Message resource

### Requirement: Database Indexes

The system SHALL create database indexes for optimal query performance.

#### Scenario: Message Query Performance

- **GIVEN** a chat room with thousands of messages
- **WHEN** messages are queried by chatRoom and ordered by createdAt
- **THEN** the database SHALL use indexes for efficient retrieval
- **AND** the query SHALL complete in under 100ms for typical datasets

#### Scenario: Required Indexes

- **GIVEN** the chat database schema
- **THEN** the following indexes SHALL exist:
  - **message.chat_room_id** (foreign key index)
  - **message.created_at** (ordering index)
  - **chat_participant.user_id** (foreign key index)
  - **chat_participant.chat_room_id** (foreign key index)
  - **chat_participant(user_id, chat_room_id)** (unique composite index)

### Requirement: Test Coverage

The system SHALL have comprehensive test coverage following TDD principles.

#### Scenario: Unit Test Coverage

- **GIVEN** chat services and repositories
- **WHEN** unit tests are executed
- **THEN** all business logic SHALL be tested in isolation
- **AND** tests SHALL follow the Red-Green-Refactor cycle
- **AND** code coverage SHALL exceed 80%

#### Scenario: Feature Test Coverage

- **GIVEN** chat API endpoints
- **WHEN** feature tests are executed
- **THEN** all HTTP endpoints SHALL be tested end-to-end
- **AND** authentication and authorization SHALL be tested
- **AND** error cases SHALL be tested (4xx, 5xx responses)

#### Scenario: Architecture Test Coverage

- **GIVEN** chat implementation
- **WHEN** architecture tests are executed
- **THEN** services SHALL implement interfaces
- **AND** controllers SHALL be slim (< 50 lines)
- **AND** SOLID principles SHALL be enforced

### Requirement: Audit Trail

The system SHALL maintain a complete audit trail of chat activity.

#### Scenario: Message Timestamps

- **GIVEN** any message in the system
- **THEN** the message SHALL have a createdAt timestamp
- **AND** the timestamp SHALL be immutable
- **AND** the timestamp SHALL use UTC timezone

#### Scenario: Participant Join Tracking

- **GIVEN** any participant in a chat room
- **THEN** the participant SHALL have a joinedAt timestamp
- **AND** the timestamp SHALL record when the user joined the room

#### Scenario: Room Activity Tracking

- **GIVEN** a chat room
- **THEN** the room SHALL have createdAt and updatedAt timestamps
- **AND** updatedAt SHALL be automatically updated on any room modification
