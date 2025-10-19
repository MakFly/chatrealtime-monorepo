# Implementation Tasks

## 1. Foundation Setup
- [ ] 1.1 Create `.cursor/rules/` directory structure
- [ ] 1.2 Review existing `.cursor/commands/` to ensure no conflicts
- [ ] 1.3 Document rule file naming and loading conventions

## 2. Common API Rules (01-common-api.md)
- [ ] 2.1 Define RFC7807 Problem Details format and snippets
- [ ] 2.2 Create pagination patterns (offset + cursor) with validation
- [ ] 2.3 Document filtering and sorting standards
- [ ] 2.4 Add OpenAPI generation and validation commands
- [ ] 2.5 Define CORS and security headers configuration
- [ ] 2.6 Create structured logging patterns (Monolog JSON + trace_id)
- [ ] 2.7 Add health endpoint patterns (`/healthz`, `/readyz`)

## 3. Symfony + API Platform Rules (02-symfony-api-platform.md)
- [ ] 3.1 Define ApiResource DTO patterns with attributes
- [ ] 3.2 Create State Provider templates (read operations)
- [ ] 3.3 Create State Processor templates (write operations)
- [ ] 3.4 Document Symfony Voter patterns for authorization
- [ ] 3.5 Define serialization group conventions (read/write separation)
- [ ] 3.6 Add Doctrine patterns (repositories, QueryBuilder, lazy loading)
- [ ] 3.7 Create Messenger async event handling patterns
- [ ] 3.8 Define HTTP cache patterns (ETag, Last-Modified, Cache-Control)
- [ ] 3.9 Add API Platform filter configurations (Search, Order, Range, Date)
- [ ] 3.10 Document FrankenPHP + HTTP/2 optimization patterns

## 4. Laravel API Rules (03-laravel-api.md)
- [ ] 4.1 Define invocable controller patterns (single action classes)
- [ ] 4.2 Create FormRequest templates (validation + authorization)
- [ ] 4.3 Document API Resource transformers (item + collection)
- [ ] 4.4 Define Policy patterns with Gate integration
- [ ] 4.5 Create Service layer templates (business logic separation)
- [ ] 4.6 Add Eloquent optimization patterns (with, withCount, scopes)
- [ ] 4.7 Document Sanctum/Passport authentication setup
- [ ] 4.8 Create middleware patterns (throttle, auth, CORS)
- [ ] 4.9 Add route grouping patterns (versioning, auth, rate limit)
- [ ] 4.10 Define cache patterns (Cache::remember, ETag middleware)

## 5. Code Quality Rules (04-code-quality.md)
- [ ] 5.1 Define PHP 8.3 requirements (strict_types, typed properties, readonly)
- [ ] 5.2 Create PHP CS Fixer configuration (Symfony preset + customs)
- [ ] 5.3 Create Laravel Pint configuration (Laravel preset + customs)
- [ ] 5.4 Define PHPStan level 9 configuration with baseline
- [ ] 5.5 Add Psalm configuration (optional, strict mode)
- [ ] 5.6 Create Pest test templates (unit, integration, HTTP)
- [ ] 5.7 Define coverage targets (Application: 90%+, Domain: 95%+)
- [ ] 5.8 Add CI pipeline patterns (lint, analysis, tests, OpenAPI)
- [ ] 5.9 Document composer script patterns (test, lint, analyse, fix)

## 6. Refactoring Actions (05-refactoring-actions.md)
- [ ] 6.1 Create "Fat Controller → Hexagonal" refactoring workflow
- [ ] 6.2 Define N+1 query detection and resolution patterns
- [ ] 6.3 Create "Entity Exposure → DTO" migration workflow
- [ ] 6.4 Document "Inline Validation → FormRequest/DTO" refactoring
- [ ] 6.5 Add "Direct ORM → Repository" extraction workflow
- [ ] 6.6 Create "Manual Error → RFC7807" conversion patterns
- [ ] 6.7 Define "Missing Tests → Pest Suite" scaffolding
- [ ] 6.8 Add "Blocking Code → Async Messenger" refactoring

## 7. Templates (06-templates.md)
- [ ] 7.1 Create Symfony ApiResource DTO template
- [ ] 7.2 Create Symfony State Provider template
- [ ] 7.3 Create Symfony State Processor template
- [ ] 7.4 Create Symfony Voter template
- [ ] 7.5 Create Symfony Application Service template
- [ ] 7.6 Create Symfony Domain Entity template
- [ ] 7.7 Create Symfony Pest API test template
- [ ] 7.8 Create Laravel invocable Controller template
- [ ] 7.9 Create Laravel FormRequest template
- [ ] 7.10 Create Laravel API Resource template
- [ ] 7.11 Create Laravel Policy template
- [ ] 7.12 Create Laravel Service template
- [ ] 7.13 Create Laravel Pest Feature test template

## 8. Validation and Testing
- [ ] 8.1 Validate all rule files load correctly in Cursor IDE
- [ ] 8.2 Test snippet syntax for PHP 8.3 compatibility
- [ ] 8.3 Generate sample files from templates
- [ ] 8.4 Test refactoring actions on dummy controller
- [ ] 8.5 Verify rules work with existing OpenSpec workflow
- [ ] 8.6 Check rules don't conflict with CLAUDE.md instructions
- [ ] 8.7 Test CI command snippets execute correctly
- [ ] 8.8 Validate OpenSpec proposal with `openspec validate --strict`

## 9. Documentation
- [ ] 9.1 Add usage guide to each rule file header
- [ ] 9.2 Document rule precedence and loading order
- [ ] 9.3 Create examples for common refactoring scenarios
- [ ] 9.4 Add troubleshooting section for common issues
- [ ] 9.5 Document integration with IDE features (autocomplete, quick fixes)
- [ ] 9.6 Create migration guide from manual patterns to rule-based
