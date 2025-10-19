# Add Comprehensive Cursor Rules Framework for API-Only Development

## Why

The project currently lacks standardized Cursor IDE rules for Symfony + API Platform development. Without comprehensive `.cursor/rules/` configuration:
- AI assistance provides inconsistent code patterns and architectures
- No enforcement of hexagonal/clean architecture principles
- DTO usage and API Platform best practices are not systematically followed
- Security patterns (RFC7807, JWT, CORS) require manual verification
- Code quality standards (PHPStan, PHP CS Fixer, Pest) are not automatically enforced
- Laravel patterns are not available for potential multi-framework projects

This proposal creates a complete `.cursor/rules/` framework that enforces API-only best practices for both Symfony + API Platform and Laravel, with shared common rules for quality, security, and observability.

## What Changes

### Core Rule Packs
- **Common API Rules** (01-common-api.md): RFC7807 error handling, pagination, filtering, OpenAPI documentation, security headers, observability
- **Symfony + API Platform Rules** (02-symfony-api-platform.md): Resource DTOs, State Providers/Processors, Voters, serialization groups, HTTP cache, Doctrine patterns
- **Laravel API Rules** (03-laravel-api.md): API Resources, FormRequest validation, Policies, Eloquent optimization, Service layer patterns
- **Code Quality Rules** (04-code-quality.md): PHP 8.3 strict types, PSR-4/PSR-12, PHPStan level 9, PHP CS Fixer/Pint, Pest testing
- **Refactoring Actions** (05-refactoring-actions.md): Fat controller detection, hexagonal migration, N+1 query elimination
- **File Templates** (06-templates.md): Ready-to-use scaffolds for DTOs, Services, Voters, Policies, Tests

### Configuration Structure
```
.cursor/
├── rules/
│   ├── 01-common-api.md           # Shared API patterns
│   ├── 02-symfony-api-platform.md # Symfony-specific
│   ├── 03-laravel-api.md          # Laravel-specific
│   ├── 04-code-quality.md         # PHP quality standards
│   ├── 05-refactoring-actions.md  # Automated refactoring
│   └── 06-templates.md            # Code scaffolds
└── commands/
    └── (existing OpenSpec commands)
```

### Key Features
- **Hexagonal Architecture Enforcement**: Domain ← Application ← Infrastructure separation
- **DTO-First API Design**: Never expose ORM entities via API
- **RFC7807 Problem Details**: Standardized error responses with trace_id
- **Security by Default**: CORS, rate limiting, JWT/Session auth, input validation
- **Performance Patterns**: HTTP cache (ETag/Last-Modified), N+1 prevention, pagination
- **Observability**: Structured JSON logging with correlation IDs, health endpoints
- **Test-Driven**: Pest unit + integration + contract tests with coverage tracking
- **OpenAPI Driven**: Single source of truth for API documentation

### Framework-Specific Patterns

#### Symfony + API Platform
- DTO Resources with `#[ApiResource]` attributes
- Custom State Providers/Processors (no ORM in controllers)
- Symfony Voters for authorization (`is_granted()`)
- Serializer groups for read/write separation
- Messenger async processing for domain events
- FrankenPHP + HTTP/2 optimization

#### Laravel
- Invocable controllers with single responsibility
- FormRequest for validation + authorization
- API Resources for transformation (no Eloquent in responses)
- Policies with Gate integration
- Service layer for business logic
- Sanctum/Passport authentication (configurable)

## Impact

### Affected Specifications
- **NEW**: `specs/code-quality/` - PHP standards, static analysis, testing requirements
- **NEW**: `specs/api-architecture/` - Hexagonal patterns, DTO usage, layering rules
- **NEW**: `specs/development-workflow/` - CI/CD, refactoring workflows, template usage

### Affected Code
- **NEW**: `.cursor/rules/01-common-api.md` - Shared API patterns and snippets
- **NEW**: `.cursor/rules/02-symfony-api-platform.md` - Symfony rules and templates
- **NEW**: `.cursor/rules/03-laravel-api.md` - Laravel rules and templates
- **NEW**: `.cursor/rules/04-code-quality.md` - Quality enforcement rules
- **NEW**: `.cursor/rules/05-refactoring-actions.md` - Automated refactoring instructions
- **NEW**: `.cursor/rules/06-templates.md` - File scaffolds and boilerplate

### Integration with Existing Project
- Complements existing `CLAUDE.md` project instructions
- Works alongside OpenSpec workflow (no conflicts)
- Enhances current Symfony 7.3 + API Platform 4.2 setup
- Provides templates matching current FrankenPHP + PostgreSQL stack

### Breaking Changes
- **NONE** - Additive only, existing code unchanged

## Migration Strategy

1. **Phase 1**: Create `.cursor/rules/` directory structure
2. **Phase 2**: Generate common API rules (RFC7807, pagination, OpenAPI)
3. **Phase 3**: Generate Symfony + API Platform specific rules and templates
4. **Phase 4**: Generate Laravel rules for potential future use
5. **Phase 5**: Generate code quality and refactoring rules
6. **Phase 6**: Validate rules with Cursor IDE and test on sample refactoring

## Testing Strategy

- **Validation**: Test each rule file loads correctly in Cursor IDE
- **Snippet Testing**: Verify code snippets compile and follow syntax
- **Template Testing**: Generate files from templates and ensure they work
- **Refactoring Testing**: Apply refactoring actions to existing controllers
- **Integration Testing**: Use rules in real development scenarios with Cursor

## Success Criteria

- [ ] All rule files load without errors in Cursor IDE
- [ ] Cursor correctly suggests patterns from rules during development
- [ ] Templates generate valid, compilable PHP code
- [ ] Refactoring actions successfully transform fat controllers
- [ ] Rules align with project's `CLAUDE.md` and OpenSpec workflow
- [ ] Documentation includes usage examples for common scenarios
