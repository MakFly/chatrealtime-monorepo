## ADDED Requirements

### Requirement: Hexagonal Architecture Layering
The codebase SHALL follow hexagonal (ports and adapters) architecture with strict layer separation.

#### Scenario: Layer structure
- **WHEN** organizing code
- **THEN** Domain layer (src/Domain/) MUST contain:
  - Entities and Aggregates (business rules)
  - Value Objects (immutable, validated)
  - Domain Events (state changes)
  - Domain Interfaces (ports)
- **AND** Application layer (src/Application/) MUST contain:
  - Commands and Queries (use case inputs)
  - Command/Query Handlers (orchestration)
  - Application Services (business workflows)
  - DTOs for Application boundaries
- **AND** Infrastructure layer (src/Infrastructure/) MUST contain:
  - ORM Repositories (Doctrine/Eloquent adapters)
  - External API clients (HTTP, SOAP adapters)
  - File system adapters
  - Messaging adapters (Queue, EventBus)
- **AND** API layer (src/Api/ or app/Http/) MUST contain:
  - API Resources/DTOs (input/output)
  - Controllers (thin routing)
  - Request/Response transformers

#### Scenario: Dependency direction
- **WHEN** referencing code across layers
- **THEN** Infrastructure MAY depend on Application and Domain
- **AND** Application MAY depend on Domain
- **AND** Domain MUST NOT depend on Application or Infrastructure
- **AND** API layer MUST NOT depend on Infrastructure directly (use Application)

### Requirement: DTO-First API Design
API endpoints SHALL never expose ORM entities directly, always use DTOs.

#### Scenario: Input DTOs
- **WHEN** accepting API input (POST, PUT, PATCH)
- **THEN** create dedicated DTO or Request class
- **AND** validate DTO with Symfony Validator or Laravel FormRequest
- **AND** transform validated DTO to Domain model in Application Service

#### Scenario: Output DTOs
- **WHEN** returning API response
- **THEN** create API Resource or Response DTO
- **AND** transform Domain entities to DTOs in Application Service
- **AND** NEVER serialize ORM entities directly (avoid lazy loading issues)

#### Scenario: Symfony API Platform
- **WHEN** using API Platform
- **THEN** create separate Resource classes with `#[ApiResource]`
- **AND** use custom State Providers for read operations
- **AND** use custom State Processors for write operations
- **AND** map Entity ↔ Resource in Provider/Processor

#### Scenario: Laravel API
- **WHEN** using Laravel
- **THEN** use FormRequest for input validation
- **AND** use API Resource for output transformation
- **AND** NEVER return Eloquent models directly from controllers

### Requirement: RFC7807 Problem Details
All API errors SHALL return RFC7807 Problem Details format.

#### Scenario: Error response format
- **WHEN** an API error occurs
- **THEN** response Content-Type MUST be `application/problem+json`
- **AND** response MUST include fields:
  - `type`: URI reference (default: "about:blank")
  - `title`: Short human-readable summary
  - `status`: HTTP status code (matches response status)
  - `detail`: Human-readable explanation
  - `trace_id`: UUID v4 for log correlation
- **AND** MAY include additional fields:
  - `violations`: Array of validation errors
  - `instance`: URI reference to specific occurrence

#### Scenario: Validation errors
- **WHEN** validation fails (HTTP 422)
- **THEN** MUST include `violations` array with:
  - `field`: Property path that failed
  - `message`: Human-readable error message
- **AND** `title` SHOULD be "Validation Failed"

#### Scenario: Symfony implementation
- **WHEN** implementing in Symfony
- **THEN** create EventListener for `KernelEvents::EXCEPTION`
- **AND** map Throwable to RFC7807 JsonResponse
- **AND** include `trace_id` from request header `X-Request-Id` or generate UUID

#### Scenario: Laravel implementation
- **WHEN** implementing in Laravel
- **THEN** create Response macro `Response::problem()`
- **AND** override Handler's `render()` to return problem+json
- **AND** include `trace_id` from `request()->header('X-Request-Id')` or generate UUID

### Requirement: Stateless API with Proper Authentication
APIs SHALL be stateless with token-based or stateless session authentication.

#### Scenario: Symfony authentication
- **WHEN** implementing authentication in Symfony
- **THEN** prefer JWT tokens (LexikJWTAuthenticationBundle) OR
- **AND** use stateless session with `stateless: true` in firewall

#### Scenario: Laravel authentication
- **WHEN** implementing authentication in Laravel
- **THEN** prefer Sanctum for SPA/mobile tokens OR
- **AND** use Passport for OAuth2 flows

#### Scenario: Authorization header
- **WHEN** authenticating requests
- **THEN** clients MUST send `Authorization: Bearer <token>` header
- **AND** API MUST validate token on each request
- **AND** API MUST return 401 with RFC7807 for invalid/expired tokens

### Requirement: API Versioning
APIs SHALL support versioning to enable backward-compatible evolution.

#### Scenario: URI versioning
- **WHEN** versioning API
- **THEN** SHOULD use URI path versioning: `/api/v1/users`, `/api/v2/users`
- **AND** SHOULD maintain at least 1 previous version during transition
- **AND** MUST document deprecation timeline for old versions

#### Scenario: Symfony routing
- **WHEN** implementing in Symfony
- **THEN** group routes by version: `prefix: /api/v1`
- **AND** duplicate and modify for new versions
- **AND** MAY use route conditions for version selection

#### Scenario: Laravel routing
- **WHEN** implementing in Laravel
- **THEN** use route groups: `Route::prefix('api/v1')->group(...)`
- **AND** organize controllers by version if needed: `app/Http/Controllers/Api/V1/`

### Requirement: Pagination by Default
List endpoints SHALL return paginated results with metadata.

#### Scenario: Offset pagination
- **WHEN** implementing offset pagination
- **THEN** accept query params: `?page=1&limit=20`
- **AND** return response with:
  - `data`: Array of items
  - `meta`: Object with `total`, `page`, `limit`, `pages`
  - `links`: Object with `self`, `first`, `last`, `next`, `prev` URLs

#### Scenario: Cursor pagination
- **WHEN** implementing cursor pagination for large datasets
- **THEN** accept query params: `?cursor=<token>&limit=20`
- **AND** return response with:
  - `data`: Array of items
  - `meta`: Object with `limit`, `has_more`
  - `links`: Object with `self`, `next` (if has_more)

#### Scenario: Default limits
- **WHEN** no limit specified
- **THEN** default to 20 items per page
- **AND** MUST enforce max limit (e.g., 100) to prevent abuse
- **AND** MUST validate limit is positive integer

### Requirement: Filtering and Sorting
List endpoints SHALL support filtering and sorting via query parameters.

#### Scenario: Filtering syntax
- **WHEN** filtering list endpoints
- **THEN** accept filters as query params: `?status=active&role=admin`
- **AND** support comparison operators: `?created_at[gte]=2024-01-01`
- **AND** validate filter values against schema

#### Scenario: Sorting syntax
- **WHEN** sorting list endpoints
- **THEN** accept sort param: `?sort=created_at` (ascending)
- **AND** support descending: `?sort=-created_at` (minus prefix)
- **AND** support multiple: `?sort=status,-created_at`
- **AND** MUST validate sortable fields (whitelist)

#### Scenario: Symfony API Platform filters
- **WHEN** using API Platform
- **THEN** use built-in filters: SearchFilter, OrderFilter, RangeFilter, DateFilter
- **AND** configure via attributes: `#[ApiFilter(SearchFilter::class, properties: ['status' => 'exact'])]`

#### Scenario: Laravel query filters
- **WHEN** using Laravel
- **THEN** apply filters via Eloquent scopes or query builder
- **AND** validate filter params via FormRequest rules

### Requirement: OpenAPI as Single Source of Truth
The OpenAPI specification SHALL be the authoritative API contract.

#### Scenario: Symfony API Platform generation
- **WHEN** using API Platform
- **THEN** generate OpenAPI with: `bin/console api:openapi:export --yaml > openapi.yaml`
- **AND** customize via attributes: `#[ApiResource(description: '...', operations: [...])]`

#### Scenario: Laravel OpenAPI generation
- **WHEN** using Laravel
- **THEN** use Scribe or L5-Swagger for generation
- **AND** annotate controllers/resources with docblocks
- **AND** generate with: `php artisan scribe:generate`

#### Scenario: CI validation
- **WHEN** running CI pipeline
- **THEN** MUST include job to generate OpenAPI spec
- **AND** MUST fail if spec has breaking changes (use openapi-diff)
- **AND** SHOULD validate examples against JSON Schema

### Requirement: N+1 Query Prevention
Database queries SHALL be optimized to prevent N+1 query problems.

#### Scenario: Doctrine eager loading
- **WHEN** loading entities with relationships in Symfony
- **THEN** use QueryBuilder joins or DQL with `LEFT JOIN`
- **AND** use Doctrine's `fetch="EXTRA_LAZY"` for collections only accessed conditionally
- **AND** profile queries in dev with Symfony Profiler

#### Scenario: Eloquent eager loading
- **WHEN** loading models with relationships in Laravel
- **THEN** use `with()` for relationships: `User::with('posts')->get()`
- **AND** use `withCount()` for counts: `User::withCount('posts')->get()`
- **AND** enable query logging in dev: `DB::enableQueryLog()`

#### Scenario: Detection
- **WHEN** reviewing code
- **THEN** MUST reject PRs with N+1 queries
- **AND** SHOULD use tools: Symfony Profiler, Laravel Debugbar, Telescope

### Requirement: HTTP Caching
APIs SHALL implement HTTP caching with ETag and Cache-Control headers.

#### Scenario: ETag generation
- **WHEN** returning GET responses for cacheable resources
- **THEN** calculate ETag from resource content hash
- **AND** return `ETag: "<hash>"` header
- **AND** compare with `If-None-Match` request header
- **AND** return 304 Not Modified if match

#### Scenario: Cache-Control
- **WHEN** setting cache headers
- **THEN** use `Cache-Control: private, max-age=3600` for user-specific
- **AND** use `Cache-Control: public, max-age=3600` for public resources
- **AND** use `Cache-Control: no-store` for sensitive data

#### Scenario: Last-Modified
- **WHEN** resource has timestamp
- **THEN** return `Last-Modified` header
- **AND** compare with `If-Modified-Since` request header
- **AND** return 304 if not modified

### Requirement: Rate Limiting
APIs SHALL implement rate limiting to prevent abuse.

#### Scenario: Symfony rate limiting
- **WHEN** implementing in Symfony
- **THEN** use `framework.rate_limiter` configuration
- **AND** apply to routes via firewall or controller attributes
- **AND** return 429 Too Many Requests with `Retry-After` header

#### Scenario: Laravel rate limiting
- **WHEN** implementing in Laravel
- **THEN** use `throttle` middleware: `->middleware('throttle:60,1')`
- **AND** customize in `RouteServiceProvider` for different limits
- **AND** return 429 with RFC7807 format

#### Scenario: Rate limit response
- **WHEN** rate limit exceeded
- **THEN** return HTTP 429 with headers:
  - `X-RateLimit-Limit`: Max requests per window
  - `X-RateLimit-Remaining`: Remaining requests
  - `Retry-After`: Seconds until reset
- **AND** return RFC7807 problem details body
