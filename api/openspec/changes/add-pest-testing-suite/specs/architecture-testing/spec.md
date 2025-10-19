# Specification: Architecture Testing

## ADDED Requirements

### Requirement: Layer Separation Tests
Controllers SHALL NOT directly interact with Doctrine EntityManager to enforce proper layering.

#### Scenario: Controllers do not use EntityManager
- GIVEN all classes in `src/Controller/` namespace
- WHEN architecture test checks dependencies
- THEN no controller imports `Doctrine\ORM\EntityManagerInterface`
- AND controllers delegate database operations to repositories or services

#### Scenario: Controllers delegate to services for business logic
- GIVEN all classes in `src/Controller/` namespace
- WHEN controller methods are analyzed
- THEN controllers call methods on services in `src/Service/` namespace
- AND business logic is NOT implemented directly in controller methods

#### Scenario: Entities do not contain complex business logic
- GIVEN all classes in `src/Entity/` namespace
- WHEN entity methods are analyzed
- THEN entities only have getters, setters, and lifecycle callbacks
- AND entities do NOT contain multi-step business processes or external service calls

### Requirement: Naming Convention Tests
Classes SHALL follow Symfony naming conventions with appropriate suffixes.

#### Scenario: Controllers have "Controller" suffix
- GIVEN all classes in `src/Controller/` directory
- WHEN class names are checked
- THEN all class names end with "Controller" (e.g., AuthController, GoogleController)

#### Scenario: Services have descriptive suffixes
- GIVEN all classes in `src/Service/` directory
- WHEN class names are checked
- THEN class names end with "Service", "Provisioner", "Manager", or "Handler"
- AND names clearly describe service purpose (e.g., GoogleUserProvisioner)

#### Scenario: Repositories have "Repository" suffix
- GIVEN all classes in `src/Repository/` directory
- WHEN class names are checked
- THEN all class names end with "Repository" (e.g., UserRepository)
- AND repositories extend Doctrine ServiceEntityRepository

### Requirement: Security Pattern Tests
Controllers SHALL use Symfony security attributes for route protection and authorization.

#### Scenario: All controllers use Route attributes
- GIVEN all public methods in controllers
- WHEN method attributes are checked
- THEN methods have `#[Route]` attribute
- OR method is `__construct` or `__invoke` (special cases)

#### Scenario: Protected routes require authentication
- GIVEN routes defined with `#[Route]` in controllers
- WHEN route path starts with `/api/v1/` and is NOT in `/api/v1/auth`
- THEN route is protected by JWT authentication (security.yaml firewall)
- AND unauthenticated requests return 401

#### Scenario: Admin operations require ROLE_ADMIN
- GIVEN API Platform operations with security attribute
- WHEN operation is Delete on User resource
- THEN security attribute requires `is_granted('ROLE_ADMIN')`
- AND regular users (ROLE_USER) cannot perform operation

### Requirement: Code Organization Tests
Project structure SHALL follow Symfony best practices for maintainability.

#### Scenario: No business logic in controllers
- GIVEN all controller classes
- WHEN method bodies are analyzed
- THEN methods call services or repositories (1-5 lines)
- AND methods do NOT contain loops, complex conditionals, or database queries

#### Scenario: Services are in Service namespace
- GIVEN classes with business logic (multi-step operations)
- WHEN namespace is checked
- THEN classes are in `App\Service\` namespace
- AND NOT in `App\Controller\` or `App\Entity\`

#### Scenario: Entities are in Entity namespace
- GIVEN classes with `#[ORM\Entity]` attribute
- WHEN namespace is checked
- THEN classes are in `App\Entity\` namespace
- AND classes implement domain model concepts (User, Message, Channel, etc.)
