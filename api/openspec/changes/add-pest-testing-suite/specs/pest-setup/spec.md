# Specification: PEST PHP Setup and Configuration

## ADDED Requirements

### Requirement: PEST PHP Core Installation
PEST PHP framework SHALL be installed as a development dependency with version ^3.0 or higher.

#### Scenario: Install PEST core package
- WHEN `composer require --dev pestphp/pest:^3.0` is executed
- THEN pest

PHP is installed in `vendor/pestphp/pest`
- AND `vendor/bin/pest` executable is available
- AND PEST version is 3.0 or higher when running `vendor/bin/pest --version`

### Requirement: PEST Symfony Plugin Installation
PEST Symfony plugin SHALL be installed to provide Symfony-specific testing utilities and HTTP client integration.

#### Scenario: Install PEST Symfony plugin
- WHEN `composer require --dev pestphp/pest-plugin-symfony:^3.0` is executed
- THEN pest-plugin-symfony is installed
- AND Symfony HTTP test case is available for use in tests
- AND `postJson()`, `getJson()` methods are available in tests

### Requirement: PEST Architecture Plugin Installation
PEST Architecture plugin SHALL be installed to enforce architectural rules and naming conventions.

#### Scenario: Install PEST Architecture plugin
- WHEN `composer require --dev pestphp/pest-plugin-arch:^3.0` is executed
- THEN pest-plugin-arch is installed
- AND `expect()->toUse()`, `expect()->toExtend()` methods are available
- AND architectural tests can be written in `tests/Architecture/`

### Requirement: PHPUnit XML Configuration
PHPUnit configuration file SHALL define test suites, environment variables, and coverage settings.

#### Scenario: Create phpunit.xml.dist with test suites
- GIVEN `phpunit.xml.dist` is created in project root
- WHEN configuration defines testsuites: Unit, Feature, Security, Architecture
- THEN `vendor/bin/pest --testsuite=Unit` runs only unit tests
- AND `vendor/bin/pest --testsuite=Feature` runs only feature tests
- AND `vendor/bin/pest` runs all test suites

#### Scenario: Configure test environment in phpunit.xml.dist
- GIVEN phpunit.xml.dist contains `<env name="APP_ENV" value="test"/>`
- WHEN tests are executed
- THEN `$_ENV['APP_ENV']` equals "test" in all tests
- AND Symfony Kernel loads test environment configuration

#### Scenario: Configure code coverage in phpunit.xml.dist
- GIVEN phpunit.xml.dist contains coverage configuration
- WHEN `vendor/bin/pest --coverage` is executed
- THEN coverage report is generated in `var/coverage/` directory
- AND coverage includes `src/` directory
- AND coverage excludes `src/Kernel.php` and `src/DataFixtures/`

### Requirement: PEST Global Configuration
`tests/Pest.php` file SHALL provide global configuration, helper functions, and custom expectations for all tests.

#### Scenario: Configure base test case with uses()
- GIVEN `tests/Pest.php` defines `uses(Tests\TestCase::class)->in('Feature', 'Security')`
- WHEN tests in `tests/Feature/` directory are created
- THEN each test automatically extends `Tests\TestCase`
- AND Symfony Kernel is booted for each feature test

#### Scenario: Define global helper functions
- GIVEN `tests/Pest.php` defines `function createUser(array $attributes = []): User`
- WHEN any test calls `createUser(['email' => 'test@example.com'])`
- THEN new User entity is created with specified attributes
- AND User is NOT persisted to database (must explicitly persist if needed)

#### Scenario: Define custom expectations
- GIVEN `tests/Pest.php` defines `expect()->extend('toBeValidJwt', ...)`
- WHEN test uses `expect($token)->toBeValidJwt()`
- THEN assertion verifies token has 3 parts separated by dots (header.payload.signature)
- AND assertion verifies token matches JWT format regex

### Requirement: Test Environment Variables
`.env.test` file SHALL provide test-specific environment variables separate from development configuration.

#### Scenario: Configure test database in .env.test
- GIVEN `.env.test` contains `DATABASE_URL=postgresql://test:test@postgres:5432/chatrealtime_test`
- WHEN tests are executed
- THEN Doctrine connects to `chatrealtime_test` database
- AND test database is separate from `chatrealtime` development database

#### Scenario: Configure test JWT keys in .env.test
- GIVEN `.env.test` contains `JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem`
- AND `JWT_PASSPHRASE=test-passphrase`
- WHEN tests generate JWT tokens
- THEN tokens are signed with RSA key from `config/jwt/private.pem`
- AND tokens use test passphrase for key decryption

#### Scenario: Configure test Google OAuth credentials
- GIVEN `.env.test` contains `GOOGLE_CLIENT_ID=test-google-client-id`
- AND `GOOGLE_CLIENT_SECRET=test-google-client-secret`
- WHEN Google OAuth tests are executed
- THEN Google client is configured with test credentials
- AND real Google API is NOT called (mocked in tests)

### Requirement: Test Bootstrap File
`tests/bootstrap.php` file SHALL initialize Symfony Kernel and Doctrine schema for test execution.

#### Scenario: Bootstrap loads Symfony autoloader
- GIVEN `tests/bootstrap.php` requires `vendor/autoload.php`
- WHEN tests are executed
- THEN all Symfony and application classes are autoloaded
- AND test classes in `App\Tests\` namespace are available

#### Scenario: Bootstrap creates test database schema
- GIVEN test database does not exist
- WHEN tests are executed for the first time
- THEN `tests/bootstrap.php` creates test database
- AND applies Doctrine migrations to test database
- AND test schema matches development schema

### Requirement: Test Helpers and Traits
Test helper traits SHALL provide reusable functionality for database transactions and JWT authentication.

#### Scenario: InteractsWithDatabase trait wraps tests in transactions
- GIVEN test uses `InteractsWithDatabase` trait
- WHEN test creates/modifies database records
- THEN changes are automatically rolled back after test completes
- AND next test starts with clean database state

#### Scenario: InteractsWithJwt trait provides actingAs() method
- GIVEN test uses `InteractsWithJwt` trait
- WHEN test calls `actingAs($user)`
- THEN subsequent HTTP requests include `Authorization: Bearer <jwt>` header
- AND JWT is valid for the specified user

### Requirement: Gitignore Test Artifacts
Test artifacts and caches SHALL be excluded from version control.

#### Scenario: Exclude PHPUnit cache from git
- GIVEN `.phpunit.result.cache` is added to `.gitignore`
- WHEN tests are executed
- THEN `.phpunit.result.cache` is created
- AND cache file does not appear in `git status`

#### Scenario: Exclude coverage reports from git
- GIVEN `var/coverage/` is added to `.gitignore`
- WHEN coverage report is generated
- THEN `var/coverage/` directory is created with HTML files
- AND coverage files do not appear in `git status`
