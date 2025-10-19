## ADDED Requirements

### Requirement: PHP 8.3 Strict Type System
The codebase SHALL enforce PHP 8.3 strict types across all files.

#### Scenario: Strict types declared
- **WHEN** a new PHP file is created
- **THEN** it MUST start with `declare(strict_types=1);`
- **AND** use typed properties for all class properties
- **AND** use readonly properties where immutability is intended
- **AND** use return types for all methods

#### Scenario: Modern PHP features
- **WHEN** writing PHP code
- **THEN** enums SHOULD be used instead of class constants for fixed sets
- **AND** DateTimeImmutable SHOULD be used instead of DateTime
- **AND** named arguments SHOULD be used for clarity with >3 parameters

### Requirement: Static Analysis Level 9
The project SHALL maintain PHPStan level 9 with zero violations for new code.

#### Scenario: PHPStan validation
- **WHEN** running `composer analyse` or `vendor/bin/phpstan analyse`
- **THEN** PHPStan MUST run at level 9
- **AND** MUST fail CI if new violations are introduced
- **AND** MAY use baseline file for legacy code

#### Scenario: Type coverage
- **WHEN** writing new code
- **THEN** all method parameters MUST have type hints
- **AND** all method returns MUST have type hints
- **AND** all class properties MUST have type declarations
- **AND** mixed type SHOULD be avoided unless genuinely needed

### Requirement: Code Style Enforcement
The project SHALL enforce consistent PSR-12 compatible code style.

#### Scenario: Symfony projects with PHP CS Fixer
- **WHEN** running `composer fix` or `vendor/bin/php-cs-fixer fix`
- **THEN** code MUST follow Symfony preset rules
- **AND** MUST include `declare_strict_types` rule
- **AND** MUST enforce `ordered_imports` rule
- **AND** MUST remove `no_unused_imports`

#### Scenario: Laravel projects with Pint
- **WHEN** running `composer pint` or `./vendor/bin/pint`
- **THEN** code MUST follow Laravel preset rules
- **AND** MUST be compatible with PSR-12
- **AND** MUST enforce strict types declaration

### Requirement: Pest Testing Framework
All new tests SHALL use Pest framework with descriptive test names.

#### Scenario: Pest test structure
- **WHEN** writing unit tests
- **THEN** use `it('describes behavior')` or `test('describes behavior')` syntax
- **AND** organize tests with `describe()` blocks for related tests
- **AND** use Pest's built-in assertions over PHPUnit compatibility layer

#### Scenario: Test types
- **WHEN** creating tests
- **THEN** unit tests SHALL go in `tests/Unit/`
- **AND** integration tests SHALL go in `tests/Integration/`
- **AND** API/Feature tests SHALL go in `tests/Feature/` or `tests/Api/`
- **AND** each test file SHOULD mirror source file structure

#### Scenario: Test coverage
- **WHEN** running `composer test:coverage`
- **THEN** Domain layer SHOULD have ≥95% coverage
- **AND** Application layer SHOULD have ≥90% coverage
- **AND** Infrastructure layer MAY have lower coverage (focus on integration tests)

### Requirement: CI Pipeline Quality Gates
The CI pipeline SHALL enforce quality standards before merge.

#### Scenario: CI jobs
- **WHEN** a pull request is opened
- **THEN** CI MUST run separate jobs for:
  - `lint` (PHP CS Fixer/Pint check mode)
  - `analyse` (PHPStan level 9)
  - `test` (Pest with coverage report)
  - `security` (composer audit)
  - `openapi` (OpenAPI schema validation)
- **AND** all jobs MUST pass before merge is allowed

#### Scenario: Composer scripts
- **WHEN** defining quality scripts in `composer.json`
- **THEN** MUST include at minimum:
  - `test`: Run Pest test suite
  - `test:coverage`: Run tests with coverage report
  - `analyse`: Run PHPStan analysis
  - `fix`: Auto-fix code style issues
  - `check`: Check code style without fixing
  - `audit`: Security audit dependencies

### Requirement: Documentation Standards
Code SHALL be self-documenting with minimal but strategic comments.

#### Scenario: DocBlock usage
- **WHEN** writing class or method documentation
- **THEN** DocBlocks SHOULD be minimal (types already declared)
- **AND** SHOULD explain "why" not "what" for complex logic
- **AND** MUST document `@throws` for checked exceptions
- **AND** MAY document `@param` for complex array shapes not expressible in types

#### Scenario: README requirements
- **WHEN** creating new capability or module
- **THEN** MUST update relevant README with:
  - Purpose and use cases
  - Installation/setup steps if applicable
  - Example usage with code snippet
  - Links to related specs or documentation
