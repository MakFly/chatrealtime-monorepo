# Project Context

## Purpose

This is a real-time chat application built with Symfony 7.3 and API Platform 4.2. The project aims to provide a modern, scalable chat platform with secure authentication, real-time messaging capabilities, and a clean API for frontend consumption.

## Tech Stack

### Backend
- **Symfony 7.3**: PHP framework for API backend
- **API Platform 4.2**: REST/GraphQL API framework with auto-generated OpenAPI docs
- **Doctrine ORM 3.5**: Database abstraction and entity management
- **PostgreSQL 15**: Primary database for data persistence
- **FrankenPHP**: Modern PHP application server with HTTP/2 and early hints support
- **LexikJWTAuthenticationBundle**: JWT token generation and validation (planned)
- **KnpUOAuth2ClientBundle**: OAuth 2.0 client for Google SSO (planned)

### Frontend
- **Next.js**: React framework (not yet built, future integration)
- **TypeScript**: Type-safe JavaScript for frontend development (planned)

### Infrastructure
- **Docker Compose**: Containerized development environment
- **PostgreSQL**: Database service
- **FrankenPHP**: Application server with built-in HTTP/2
- **Adminer**: Database management UI
- **Maildev**: Email testing tool
- **Dozzle**: Container log viewer

## Project Conventions

### Code Style
- **PHP 8.2+** with strict types (`declare(strict_types=1);`)
- **PSR-4 autoloading**: `App\` namespace maps to `src/`
- **Doctrine annotations**: Use PHP 8 attributes (`#[ORM\Entity]`, `#[ApiResource]`)
- **API Platform configuration**: Prefer attributes over YAML/XML
- **Naming conventions**:
  - PascalCase for class names
  - camelCase for methods and properties
  - snake_case for database columns
  - kebab-case for route paths and OpenSpec change IDs

### Architecture Patterns
- **API-first design**: Backend exposes RESTful API, frontend consumes it
- **Stateless authentication**: JWT tokens, no server-side sessions
- **Domain-Driven Design (lite)**: Entities represent business domain concepts
- **Repository pattern**: Custom queries in repositories, not controllers
- **Service layer**: Complex business logic in services, not controllers
- **Attribute-based configuration**: Leverage PHP 8 attributes for metadata
- **Separation of concerns**: Controllers handle HTTP, services handle business logic, repositories handle data access

### Testing Strategy
- **Unit tests**: Test individual classes and methods in isolation
- **Integration tests**: Test interactions between components (e.g., controllers + services + database)
- **Functional tests**: Test API endpoints end-to-end with HTTP requests
- **Security tests**: Verify authentication, authorization, and security controls
- **Code coverage target**: >80% for business-critical code (authentication, core features)
- **Test tools**: PHPUnit, API Platform test utilities
- **Mocking**: Use mocks for external services (e.g., Google OAuth) in tests

### Git Workflow
- **Main branch**: `main` or `master` (production-ready code)
- **Feature branches**: `feature/descriptive-name` or `add-feature-name`
- **Commit messages**: Descriptive, present tense (e.g., "Add JWT authentication")
- **Pull requests**: Required for merging to main, include description and testing notes
- **No direct commits to main**: All changes via feature branches and PRs

### Database Workflow
1. Modify entities in `src/Entity/`
2. Generate migration: `make migration` or `php bin/console make:migration`
3. Review migration SQL for correctness
4. Apply migration: `make migrate` or `php bin/console doctrine:migrations:migrate`
5. Update fixtures if needed: `src/DataFixtures/`
6. Load fixtures for testing: `make fixtures`

## Domain Context

### Chat Application Domain
- **Users**: People who use the chat application (authenticate, send messages, join channels)
- **Messages**: Text content sent by users (real-time delivery, persistence, threading)
- **Channels/Rooms**: Organized spaces for conversations (public, private, direct messages)
- **Authentication**: Secure user identity verification (email/password, Google SSO)
- **Authorization**: Access control to channels and messages (roles, permissions)
- **Real-time**: Instant message delivery (WebSockets, Server-Sent Events, or polling)

### Key Business Rules
- Users must be authenticated to send messages
- Users can only read messages in channels they have access to
- Messages are immutable once sent (edit/delete may be added later)
- User profiles include email, name, and optional profile picture
- Google SSO users may not have passwords (can set one later)

## Important Constraints

### Technical Constraints
- **PHP version**: 8.2 or higher (required by Symfony 7.3)
- **Database**: PostgreSQL 15 (schema must be compatible)
- **Stateless API**: No server-side sessions, JWT tokens for authentication
- **CORS**: Must support cross-origin requests from Next.js frontend
- **HTTPS**: Required in production for secure token transmission
- **Docker**: All services run in containers for consistent environments

### Business Constraints
- **Security-first**: Authentication and authorization must be robust and tested
- **Scalability**: Design should support future growth (caching, queuing, horizontal scaling)
- **User experience**: Authentication should be seamless (Google SSO, token refresh)
- **Privacy**: User data must be protected (GDPR considerations, secure storage)

### Development Constraints
- **Container-based workflow**: All Symfony commands run inside Docker container
- **No direct database access**: Use Doctrine ORM exclusively
- **API Platform conventions**: Follow API Platform best practices for resource design
- **Environment variables**: Sensitive config via .env files (not checked into git)

## External Dependencies

### Google OAuth 2.0
- **Purpose**: Third-party authentication provider for Google Sign-In
- **Integration**: OAuth 2.0 authorization code flow
- **API**: Google UserInfo API for fetching user profile data
- **Credentials**: Client ID and secret from Google Cloud Console
- **Scope**: `email` and `profile` (basic user information)
- **Rate limits**: Google OAuth has rate limits; ensure error handling for quota exceeded

### API Platform
- **Purpose**: REST/GraphQL API framework with auto-generated documentation
- **Documentation**: OpenAPI 3.0 spec generated automatically
- **Serialization**: JSON-LD and Hydra for rich API responses
- **Filters**: Built-in filtering, sorting, pagination
- **Validation**: Symfony Validator integration

### LexikJWTAuthenticationBundle
- **Purpose**: JWT token generation and validation for Symfony
- **Algorithm**: RS256 (RSA asymmetric encryption)
- **Key management**: RSA key pair stored in `config/jwt/`
- **Token structure**: Standard JWT with custom claims (user_id, email, roles)

### KnpUOAuth2ClientBundle
- **Purpose**: OAuth 2.0 client for Symfony (integrates with League OAuth2)
- **Providers**: Google, GitHub, Facebook, etc. (we use Google)
- **Flow**: Authorization code grant with PKCE
- **State management**: CSRF protection via state parameter

## Future Considerations

### Planned Features (not yet in scope)
- **Real-time messaging**: WebSocket or SSE integration for instant message delivery
- **Message persistence**: Store messages in database with timestamps and metadata
- **Channel management**: Create, join, leave channels; manage permissions
- **Direct messaging**: One-on-one private conversations
- **File uploads**: Share images, documents in chat
- **Notifications**: Email/push notifications for missed messages
- **Search**: Full-text search across messages and channels
- **Multi-factor authentication (MFA)**: Additional security layer beyond password
- **Password reset flow**: Allow users to reset forgotten passwords via email
- **Email verification**: Verify user email addresses before granting full access
- **Admin panel**: Manage users, channels, messages; view analytics

### Technical Debt and Improvements
- **Rate limiting**: Implement comprehensive rate limiting for all API endpoints
- **Redis caching**: Cache frequently accessed data (user profiles, channel lists)
- **Message queues**: Offload heavy tasks (email sending, notifications) to background jobs
- **Monitoring**: Application performance monitoring (APM) with tools like New Relic or Datadog
- **Automated backups**: Regular database backups with point-in-time recovery
- **CI/CD pipeline**: Automated testing, linting, deployment on git push
- **Load testing**: Stress test API under realistic traffic loads
- **Security audits**: Regular third-party security assessments

## OpenSpec Guidelines

### Capability Naming
- Use verb-noun format: `jwt-authentication`, `google-sso-integration`, `message-persistence`
- Single purpose per capability (split if description needs "AND")
- Keep names short and descriptive (10-minute understandability rule)

### Change ID Naming
- Use kebab-case: `add-jwt-google-sso-auth`, `update-user-profile-api`
- Start with verb: `add-`, `update-`, `remove-`, `refactor-`, `fix-`
- Be specific and descriptive: `add-jwt-auth` is better than `auth`
- Ensure uniqueness across all changes (append `-2`, `-3` if needed)

### Spec Writing
- Use SHALL/MUST for normative requirements (SHOULD/MAY for optional)
- Include at least one `#### Scenario:` per requirement
- Write scenarios in GIVEN-WHEN-THEN or WHEN-THEN format
- Reference code locations as `file.php:line` (e.g., `AuthController.php:42`)
- Cross-reference related capabilities when dependencies exist

### Breaking Changes
- Mark breaking changes clearly in `proposal.md` with **BREAKING** label
- Consider migration path for existing data/users
- Document rollback strategy in `design.md`
- Communicate breaking changes to frontend team before deployment
