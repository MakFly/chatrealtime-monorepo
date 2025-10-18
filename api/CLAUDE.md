<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Symfony 7.3 real-time chat application built with:
- **API Platform 4.2**: RESTful API with auto-generated OpenAPI documentation
- **Doctrine ORM 3.5**: Database abstraction and entity management
- **PostgreSQL 15**: Primary database
- **FrankenPHP**: Modern PHP application server with HTTP/2 and early hints support
- **Docker Compose**: Containerized development environment

## Development Environment

### Starting the Environment

Use the comprehensive Makefile for all operations:

```bash
make dev        # Start all services (app, postgres, adminer, maildev, dozzle)
make workspace  # Open bash in webapp container for PHP/Symfony commands
make logs       # View container logs
make stop       # Stop containers
make down       # Stop and remove containers
```

**Services Available:**
- **App**: https://localhost (FrankenPHP)
- **PostgreSQL**: localhost:5432 (user: test, password: test, db: chatrealtime)
- **Adminer**: http://localhost:9080 (database GUI)
- **Maildev**: http://localhost:1080 (email testing)
- **Dozzle**: http://localhost:8888 (log viewer)

### Common Commands

All Symfony commands must be run inside the container via `make workspace` or `docker compose exec`:

```bash
# Inside container or via: docker compose -f compose.dev.yaml exec webapp <command>

# Console
php bin/console <command>

# Database
php bin/console doctrine:migrations:migrate --no-interaction
php bin/console doctrine:fixtures:load --no-interaction
php bin/console make:migration

# Cache
php bin/console cache:clear

# Code Quality (inside container)
vendor/bin/phpstan analyse src

# Create entities/controllers
php bin/console make:entity
php bin/console make:controller
```

**Makefile shortcuts:**
```bash
make migrate    # Run migrations
make fixtures   # Load fixtures
make migration  # Create new migration
make cache      # Clear cache
make tools      # Run PHPStan analysis
```

## Architecture

### Directory Structure

```
src/
├── ApiResource/      # API Platform resource configurations (if using separate classes)
├── Controller/       # Traditional Symfony controllers (minimal with API Platform)
├── DataFixtures/     # Doctrine fixtures for seeding database
├── Entity/          # Doctrine entities (database models)
├── Repository/      # Doctrine repositories for custom queries
└── Kernel.php       # Application kernel

config/
├── packages/        # Bundle configurations
│   ├── api_platform.yaml  # API Platform settings
│   ├── security.yaml      # Security & authentication
│   ├── doctrine.yaml      # ORM configuration
│   └── nelmio_cors.yaml   # CORS settings
└── routes/          # Routing configuration
```

### API Platform Pattern

Entities are annotated with `#[ApiResource]` attributes to expose them as API endpoints:

```php
#[ApiResource(operations: [
    new Get(),
    new Post(),
    new Put(),
    new Delete(),
])]
class User implements UserInterface
{
    // Entity properties...
}
```

The User entity (src/Entity/User.php:17-128) implements Symfony security interfaces and includes:
- Email-based authentication (unique identifier)
- Role-based authorization (default ROLE_USER)
- Password hashing support
- CRC32C password hashing in sessions (Symfony 7.3 feature)

### Database Workflow

1. Modify entities in `src/Entity/`
2. Generate migration: `make migration` or `php bin/console make:migration`
3. Review migration in `migrations/` directory
4. Apply migration: `make migrate` or `php bin/console doctrine:migrations:migrate`
5. Load fixtures (if needed): `make fixtures`

### Code Standards

- **PHP 8.2+** with strict types (`declare(strict_types=1);`)
- **PSR-4** autoloading: `App\` namespace maps to `src/`
- **Doctrine Annotations**: Use PHP 8 attributes (`#[ORM\Entity]`, `#[ApiResource]`)
- **API Platform**: Prefer attribute configuration over YAML/XML
- **Stateless API**: Default configuration (config/packages/api_platform.yaml:5)

## Docker Development Notes

- **Container name**: `chatrealtime` (webapp), `chatrealtime-postgres` (database)
- **Volume mounting**: Project root mounted at `/app` in container (live code updates)
- **Node.js**: Available in container (Node 20.x) for asset compilation
- **PHP extensions**: pdo_pgsql, gd, intl, zip, bcmath, opcache, redis, pcntl, sockets
- **PHP config**: Development mode with error reporting enabled

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection (default: `postgresql://test:test@postgres:5432/chatrealtime`)
- `APP_ENV`: dev/prod (default: dev)
- `APP_SECRET`: Generate random secret for sessions
- `CORS_ALLOW_ORIGIN`: Allowed origins for CORS (default: localhost regex)

## API Platform Features

- **Auto-generated OpenAPI documentation**: Available at `/docs` (Swagger UI)
- **JSON-LD & Hydra**: Enabled by default for rich API responses
- **Content negotiation**: JSON, JSON-LD, HTML (documentation)
- **CORS**: Configured via nelmio/cors-bundle for cross-origin requests
- **Cache headers**: Vary on Content-Type, Authorization, Origin (config/packages/api_platform.yaml:7)

## Testing

No test suite currently configured. To add testing:

```bash
# Inside container
composer require --dev symfony/test-pack
php bin/console make:test

# Run tests
make test  # or: vendor/bin/phpunit
```

## Development Tips

- Use `make dozzle` for real-time log viewing in browser instead of terminal logs
- Check container health: `make status`
- Rebuild after dependency changes: `make rebuild`
- Access database via Adminer (GUI) or direct psql connection
- PHPStan analysis available via `make tools` for static analysis
