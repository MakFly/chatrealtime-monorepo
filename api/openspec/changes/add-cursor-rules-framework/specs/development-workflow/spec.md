## ADDED Requirements

### Requirement: Cursor Rules File Organization
The project SHALL maintain organized Cursor rules in `.cursor/rules/` directory.

#### Scenario: Rule file naming
- **WHEN** creating rule files
- **THEN** files MUST use numbered prefix for loading order: `01-`, `02-`, etc.
- **AND** file names SHOULD be descriptive: `01-common-api.md`, `02-symfony-api-platform.md`
- **AND** files SHOULD be Markdown format for readability

#### Scenario: Rule file structure
- **WHEN** writing rule content
- **THEN** each file MUST include:
  - Header with title and description
  - Table of contents for quick navigation
  - When/Then patterns for triggering rules
  - Code snippets with syntax highlighting
  - Templates with placeholder documentation
  - Examples showing correct usage
- **AND** files SHOULD be <500 lines for performance

#### Scenario: Rule precedence
- **WHEN** multiple rules could apply
- **THEN** project-specific rules (`.cursor/rules/`) MUST override
- **AND** numbered files SHOULD load in order (01 before 02)
- **AND** later rules MAY override earlier rules if explicitly stated

### Requirement: Template-Based File Generation
Cursor rules SHALL provide complete file templates for common patterns.

#### Scenario: Template variables
- **WHEN** defining templates
- **THEN** use clear placeholder syntax: `{EntityName}`, `{Namespace}`, `{Fields}`
- **AND** document each variable in template header
- **AND** provide example values for clarity

#### Scenario: Template completeness
- **WHEN** creating templates
- **THEN** templates MUST include:
  - Full file structure (namespace, imports, class)
  - PHP 8.3 features (readonly, types, strict_types)
  - DocBlocks where necessary
  - Example method implementations
  - TODO comments for required customization
- **AND** templates MUST compile without errors when placeholders replaced

#### Scenario: Symfony templates
- **WHEN** generating Symfony files
- **THEN** provide templates for:
  - ApiResource DTO with serialization groups
  - State Provider (custom read logic)
  - State Processor (custom write logic)
  - Symfony Voter (authorization)
  - Application Service (use case handler)
  - Domain Entity (with validation)
  - Doctrine Repository (custom queries)
  - Pest API test (HTTP assertions)

#### Scenario: Laravel templates
- **WHEN** generating Laravel files
- **THEN** provide templates for:
  - Invocable Controller (single action)
  - FormRequest (validation + authorization)
  - API Resource (transformation)
  - Policy (authorization rules)
  - Service class (business logic)
  - Eloquent Model with relationships
  - Pest Feature test (HTTP + database)

### Requirement: Refactoring Workflow Actions
Cursor rules SHALL define step-by-step refactoring workflows for common improvements.

#### Scenario: Fat controller detection
- **WHEN** reviewing controller code
- **THEN** flag as needing refactoring if:
  - Controller method >80 lines
  - Contains inline database queries (Doctrine/Eloquent)
  - Contains validation logic inline
  - Contains business logic (not just routing)
  - Returns ORM entities directly

#### Scenario: Hexagonal refactoring steps
- **WHEN** refactoring fat controller to hexagonal
- **THEN** follow workflow:
  1. Extract validation to FormRequest/DTO
  2. Create Application Service for use case
  3. Move database queries to Repository
  4. Transform response to API Resource/DTO
  5. Slim controller to 1 line: `return $service->execute($dto);`
  6. Add Pest tests for Service and Controller

#### Scenario: N+1 elimination workflow
- **WHEN** N+1 query detected
- **THEN** follow workflow:
  1. Identify relationship causing N+1
  2. Add eager loading (Doctrine join, Eloquent `with()`)
  3. Profile before/after query count
  4. Add test asserting query count: `$this->assertQueryCount(2)`

#### Scenario: Entity exposure to DTO migration
- **WHEN** API endpoint exposes entity
- **THEN** follow workflow:
  1. Create API Resource/DTO for output
  2. Create Input DTO for write operations
  3. Add transformer in Service layer
  4. Update Controller to use DTOs
  5. Remove entity serialization configuration
  6. Test API response shape unchanged

### Requirement: Code Quality Automation
Development workflow SHALL include automated quality checks.

#### Scenario: Pre-commit hooks
- **WHEN** committing code
- **THEN** pre-commit hook SHOULD run:
  - PHP CS Fixer/Pint in check mode (no auto-fix)
  - PHPStan on changed files
  - Pest tests for changed files
- **AND** commit SHOULD be blocked if checks fail

#### Scenario: Composer scripts
- **WHEN** defining composer scripts
- **THEN** `composer.json` MUST include:
  ```json
  "scripts": {
    "test": "pest",
    "test:coverage": "pest --coverage",
    "analyse": "phpstan analyse",
    "fix": "php-cs-fixer fix",
    "check": "php-cs-fixer fix --dry-run",
    "audit": "composer audit"
  }
  ```

#### Scenario: IDE integration
- **WHEN** using Cursor/VSCode/PHPStorm
- **THEN** configure to:
  - Run PHP CS Fixer on file save
  - Show PHPStan errors inline
  - Run tests on file save (optional)

### Requirement: CI/CD Pipeline Configuration
Projects SHALL include comprehensive CI configuration for quality gates.

#### Scenario: GitHub Actions workflow
- **WHEN** using GitHub Actions
- **THEN** `.github/workflows/ci.yml` MUST include jobs:
  ```yaml
  jobs:
    lint:
      # PHP CS Fixer/Pint check
    analyse:
      # PHPStan level 9
    test:
      # Pest with coverage
    security:
      # composer audit
    openapi:
      # Generate and validate OpenAPI
  ```

#### Scenario: GitLab CI pipeline
- **WHEN** using GitLab CI
- **THEN** `.gitlab-ci.yml` MUST include stages:
  ```yaml
  stages:
    - lint
    - analyse
    - test
    - security
    - openapi
  ```

#### Scenario: CI failure handling
- **WHEN** CI job fails
- **THEN** block merge until fixed
- **AND** provide clear failure message with fix instructions
- **AND** allow override only for baseline updates (documented)

### Requirement: Snippet Library for Common Patterns
Cursor rules SHALL provide code snippets for frequently used patterns.

#### Scenario: RFC7807 error helper (Symfony)
- **WHEN** implementing error responses in Symfony
- **THEN** provide snippet:
  ```php
  #[AsEventListener(event: KernelEvents::EXCEPTION)]
  final class ProblemJsonListener {
      public function __invoke(ExceptionEvent $event): void {
          $exception = $event->getThrowable();
          $response = new JsonResponse([
              'type' => 'about:blank',
              'title' => 'An error occurred',
              'status' => 500,
              'detail' => $exception->getMessage(),
              'trace_id' => $event->getRequest()->headers->get('X-Request-Id') ?? Uuid::v4()->toString(),
          ], 500, ['Content-Type' => 'application/problem+json']);
          $event->setResponse($response);
      }
  }
  ```

#### Scenario: RFC7807 response macro (Laravel)
- **WHEN** implementing error responses in Laravel
- **THEN** provide snippet for AppServiceProvider:
  ```php
  Response::macro('problem', function (int $status, string $title, string $detail = '', array $extra = []) {
      return response()->json(array_merge([
          'type' => 'about:blank',
          'title' => $title,
          'status' => $status,
          'detail' => $detail,
          'trace_id' => request()->header('X-Request-Id') ?? Str::uuid()->toString(),
      ], $extra), $status, ['Content-Type' => 'application/problem+json']);
  });
  ```

#### Scenario: Pagination helper
- **WHEN** implementing pagination
- **THEN** provide snippet for offset pagination:
  ```php
  // Symfony
  return new JsonResponse([
      'data' => $items,
      'meta' => [
          'total' => $total,
          'page' => $page,
          'limit' => $limit,
          'pages' => (int) ceil($total / $limit),
      ],
      'links' => [
          'self' => $request->getUri(),
          'first' => $this->buildPageUrl($request, 1),
          'last' => $this->buildPageUrl($request, $lastPage),
          'next' => $page < $lastPage ? $this->buildPageUrl($request, $page + 1) : null,
          'prev' => $page > 1 ? $this->buildPageUrl($request, $page - 1) : null,
      ],
  ]);
  ```

#### Scenario: API Resource transformation
- **WHEN** transforming entities to DTOs
- **THEN** provide snippet:
  ```php
  // API Platform Symfony
  #[ApiResource(
      operations: [new Get(), new GetCollection()],
      normalizationContext: ['groups' => ['user:read']],
      denormalizationContext: ['groups' => ['user:write']]
  )]
  final readonly class UserResource {
      public function __construct(
          #[Groups(['user:read'])]
          public string $id,
          #[Groups(['user:read', 'user:write'])]
          public string $email,
          #[Groups(['user:read'])]
          public \DateTimeImmutable $createdAt,
      ) {}
  }
  ```

### Requirement: Documentation Integration
Cursor rules SHALL reference and integrate with project documentation.

#### Scenario: OpenSpec cross-reference
- **WHEN** implementing features with specs
- **THEN** rules SHOULD reference OpenSpec files: `specs/auth/spec.md`
- **AND** templates SHOULD include comments linking to specs
- **AND** refactoring workflows SHOULD check for spec compliance

#### Scenario: README updates
- **WHEN** generating new components
- **THEN** prompt to update README if:
  - New API endpoint created (document in API section)
  - New capability added (document in Features section)
  - Configuration changed (document in Setup section)

#### Scenario: CLAUDE.md compatibility
- **WHEN** rules conflict with CLAUDE.md
- **THEN** rules MUST defer to project-specific CLAUDE.md
- **AND** rules SHOULD document known conflicts in header
- **AND** precedence MUST be: Project context > Cursor rules > Defaults

### Requirement: Interactive Refactoring Prompts
Cursor SHALL ask clarifying questions before applying complex refactoring.

#### Scenario: Authentication method selection
- **WHEN** generating authentication code
- **THEN** ask: "Which authentication method? (JWT/Session for Symfony, Sanctum/Passport for Laravel)"
- **AND** use answer to customize generated code

#### Scenario: Pagination strategy selection
- **WHEN** generating list endpoints
- **THEN** ask: "Which pagination strategy? (offset/cursor)"
- **AND** generate appropriate implementation

#### Scenario: Domain context clarification
- **WHEN** generating domain entities
- **THEN** ask: "What is the bounded context name? (e.g., Auth, Order, Inventory)"
- **AND** use for namespace and directory structure

#### Scenario: Test strategy clarification
- **WHEN** generating tests
- **THEN** ask: "Test type? (unit/integration/api)"
- **AND** generate in appropriate directory with proper setup

### Requirement: Performance Optimization Patterns
Cursor rules SHALL provide performance optimization guidance.

#### Scenario: Database query optimization
- **WHEN** writing database queries
- **THEN** rules SHOULD suggest:
  - Use indexes for WHERE/JOIN columns
  - Avoid SELECT * (specify columns)
  - Use pagination for large result sets
  - Profile queries in development

#### Scenario: Cache pattern suggestions
- **WHEN** reading data frequently
- **THEN** suggest application cache:
  ```php
  // Symfony
  $data = $cache->get('key', function (ItemInterface $item) {
      $item->expiresAfter(3600);
      return $this->repository->find($id);
  });

  // Laravel
  $data = Cache::remember('key', 3600, fn() => User::find($id));
  ```

#### Scenario: HTTP cache suggestions
- **WHEN** returning GET responses
- **THEN** suggest ETag/Last-Modified headers
- **AND** provide snippet for 304 handling

### Requirement: Security Pattern Enforcement
Cursor rules SHALL enforce security best practices.

#### Scenario: Input validation reminder
- **WHEN** accepting user input
- **THEN** remind to validate with:
  - Symfony Validator or Laravel FormRequest
  - Type hints for primitive types
  - Custom validation for business rules

#### Scenario: Authorization checks
- **WHEN** accessing resources
- **THEN** remind to check authorization:
  - Symfony: `$this->denyAccessUnlessGranted('VIEW', $resource)`
  - Laravel: `$this->authorize('view', $resource)`

#### Scenario: SQL injection prevention
- **WHEN** writing raw SQL
- **THEN** warn against string concatenation
- **AND** suggest parameterized queries:
  - Doctrine: `->setParameter('id', $id)`
  - Eloquent: `DB::select('...', [$id])`

#### Scenario: XSS prevention
- **WHEN** outputting user content
- **THEN** remind that JSON encoding auto-escapes
- **AND** warn if using `|raw` filter in Twig

### Requirement: Error Handling Consistency
Cursor rules SHALL enforce consistent error handling patterns.

#### Scenario: Domain exceptions
- **WHEN** throwing domain errors
- **THEN** create custom exceptions extending base:
  ```php
  final class UserNotFoundException extends DomainException {
      public static function withId(string $id): self {
          return new self("User with ID {$id} not found");
      }
  }
  ```

#### Scenario: Application exceptions
- **WHEN** throwing application errors
- **THEN** map to HTTP status codes:
  - 400: ValidationException
  - 401: UnauthorizedException
  - 403: ForbiddenException
  - 404: NotFoundException
  - 422: ValidationException (with violations)
  - 500: InternalServerException

#### Scenario: Infrastructure exceptions
- **WHEN** infrastructure failures occur (DB, API, file)
- **THEN** catch and wrap in application exception
- **AND** log original exception with context
- **AND** return RFC7807 to client without exposing internal details
