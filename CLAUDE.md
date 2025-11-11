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

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **real-time chat application** built with a **monorepo architecture**:

- **Backend (API)**: Symfony 7.3 + API Platform 4.2 + PostgreSQL + Redis
- **Frontend**: Next.js 15.5 + React 19 + TypeScript 5 + Tailwind CSS 4
- **Infrastructure**: Docker Compose with FrankenPHP, PostgreSQL, Redis, Adminer, Maildev, Dozzle

### Technology Stack

#### Backend (`api/`)
- **Symfony 7.3**: PHP framework with strict TDD and SOLID principles
- **API Platform 4.2**: RESTful API with auto-generated OpenAPI docs
- **Doctrine ORM 3.5**: Database abstraction and entity management
- **PostgreSQL 15**: Primary database
- **Redis 7**: Session storage and caching
- **JWT Authentication**: Lexik JWT Bundle with refresh token rotation
- **OAuth2**: Google SSO integration
- **FrankenPHP**: Modern PHP application server
- **Pest PHP 3.0**: TDD testing framework

#### Frontend (`frontend/`)
- **Next.js 15.5**: React framework with App Router and Server Components
- **React 19.1**: Latest React with Server Components
- **TypeScript 5**: Strict type safety
- **Tailwind CSS 4**: Utility-first styling with CSS variables
- **shadcn/ui**: 50+ accessible UI components (New York style)
- **TanStack Query v5**: Server state management
- **React Hook Form + Zod**: Form handling and validation
- **next-safe-action**: Type-safe server actions
- **Zustand**: Client state management

---

## Quick Start

### Development Environment

Start the entire stack from the root:

```bash
# Start API (from root or api/)
cd api && make dev

# Start Frontend (from root or frontend/)
cd frontend && bun dev
```

**Services:**
- **Backend API**: https://localhost (FrankenPHP)
- **Frontend**: http://localhost:3000 (Next.js dev server)
- **PostgreSQL**: localhost:5432 (user: test, password: test, db: chatrealtime)
- **Redis**: localhost:6379
- **Adminer** (DB GUI): http://localhost:9080
- **Maildev** (Email testing): http://localhost:1080
- **Dozzle** (Log viewer): http://localhost:8888

### Common Commands

#### Backend (API)
All commands use the Makefile in `api/`:

```bash
# Development
make dev          # Start all services
make workspace    # Open bash in webapp container
make logs         # View container logs
make stop         # Stop containers
make down         # Stop and remove containers

# Testing (Pest PHP)
make test                # Run all tests
make test-unit           # Unit tests only
make test-feature        # Feature tests only
make test-security       # Security tests only
make test-architecture   # Architecture tests only
make test-coverage       # Tests with coverage report
make test-watch          # Watch mode

# Database
make migrate      # Run migrations
make fixtures     # Load fixtures
make migration    # Create new migration

# Code Quality
make tools        # Run PHPStan analysis
make cache        # Clear Symfony cache

# Security
make cleanup-tokens        # Delete expired refresh tokens
make security-dashboard    # Open security dashboard
```

#### Frontend
All commands run from `frontend/`:

```bash
bun dev           # Start development server with Turbopack
bun run build     # Build for production with Turbopack
bun start         # Start production server
bun run lint      # Lint code
bun install       # Install dependencies
bun add <pkg>     # Add package
bun add -d <pkg>  # Add dev dependency
```

---

## Architecture Principles

### Backend: TDD + SOLID + Clean Architecture

**CRITICAL**: The backend follows **strict TDD and SOLID principles** documented in `api/AI-DD/`.

#### Core Principles (see `api/AI-DD/README.md`)

1. **TDD First**: Always write tests before code (Red → Green → Refactor)
2. **SOLID**: Follow all 5 principles for every class
3. **Interfaces**: Use interfaces for all injected dependencies
4. **Slim Controllers**: Controllers < 50 lines, logic in services
5. **No Duplication**: DRY principle everywhere
6. **No Partial Code**: No TODO comments, mock objects, or stubs

#### Architecture Pattern

```
Controller (< 50 lines)
    ↓ delegates to
Service Layer (Business Logic)
    ↓ uses
Repository/Infrastructure (Data Access)
```

#### Backend Pre-commit Checklist

Before committing backend code:
- [ ] Tests written FIRST (TDD)
- [ ] All tests pass (`make test`)
- [ ] Code coverage > 80%
- [ ] PHPStan clean (`make tools`)
- [ ] SOLID principles respected
- [ ] Interfaces used for dependencies
- [ ] Controllers < 50 lines
- [ ] No code duplication

**See `api/AI-DD/` for comprehensive TDD and SOLID documentation.**

---

### Frontend: Server-First + TypeScript Strict + Feature-First

**CRITICAL**: The frontend follows **2025 best practices** documented in `AI-DD/nextjs`.

#### Core Principles (see `AI-DD/nextjs/00-README.md`)

1. **Server Components by Default**: Use `"use client"` only when necessary
2. **TypeScript Strict**: NO `any` types, explicit typing everywhere
3. **Feature-First Architecture**: Organize by features, not file types
4. **API Integration**: Use unified `serverAPI/clientAPI` clients
5. **Type over Interface**: Always use `type`, never `interface`

#### Critical Project Rules

```typescript
type ProjectRules = {
  types: "ALWAYS 'type', NEVER 'interface'"
  architecture: "Feature-first (features/ not components/)"
  serverFirst: "Server Components by default, 'use client' only when needed"
  typeStrict: "NO 'any' types - strict TypeScript enforcement"
  api: "Use serverAPI/clientAPI unified clients"
}
```

#### Frontend Documentation

Consult `AI-DD/nextjs` when:
- Creating new features or components
- Implementing data fetching patterns
- Writing forms with validation
- Building server actions
- Managing state
- Following architecture patterns

**Quick Reference:**
- New component: `AI-DD/nextjs/04-SHADCN-UI.md`, `AI-DD/nextjs/02-TYPESCRIPT-REACT.md`
- New route/page: `AI-DD/nextjs/01-NEXTJS-PATTERNS.md`, `AI-DD/nextjs/03-CLEAN-ARCHITECTURE.md`
- Data fetching: `AI-DD/nextjs/05-TANSTACK-QUERY.md`, `AI-DD/nextjs/16-API-PATTERNS.md`
- Forms: `AI-DD/nextjs/05-REACT-HOOK-FORM.md` (cursor rules)
- Server actions: `AI-DD/nextjs/06-SAFE-ACTIONS.md`
- State: `AI-DD/nextjs/07-ZUSTAND.md`
- Standards: `AI-DD/nextjs/10-CODING-STANDARDS.md`

---

## Directory Structure

```
chat-realtime/
├── api/                          # Symfony 7.3 backend
│   ├── src/
│   │   ├── ApiResource/          # API Platform resources
│   │   ├── Command/              # Console commands
│   │   ├── Controller/           # Slim controllers (<50 lines)
│   │   ├── DataFixtures/         # Doctrine fixtures
│   │   ├── Entity/               # Doctrine entities
│   │   ├── EventListener/        # Event listeners
│   │   ├── EventSubscriber/      # Event subscribers
│   │   ├── Factory/              # Object factories
│   │   ├── Repository/           # Doctrine repositories
│   │   ├── Security/             # Security components
│   │   ├── Service/              # Business logic services
│   │   └── Kernel.php            # Application kernel
│   ├── config/                   # Configuration
│   │   ├── packages/
│   │   │   ├── api_platform.yaml # API Platform settings
│   │   │   ├── security.yaml     # Security & authentication
│   │   │   ├── doctrine.yaml     # ORM configuration
│   │   │   └── nelmio_cors.yaml  # CORS settings
│   │   └── routes/               # Routing
│   ├── tests/                    # Pest PHP tests
│   ├── migrations/               # Database migrations
│   ├── AI-DD/                    # TDD + SOLID documentation
│   ├── postman/                  # API collection
│   ├── Makefile                  # Development commands
│   ├── composer.json             # PHP dependencies
│   └── phpunit.xml               # Test configuration
│
├── frontend/                     # Next.js 15 frontend
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # Route group - public routes
│   │   ├── (protected)/          # Route group - auth required
│   │   ├── api/                  # API route handlers
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   ├── components/               # Shared components
│   │   └── ui/                   # shadcn/ui components (50+)
│   ├── lib/                      # Core business logic
│   │   ├── actions/              # Server actions
│   │   ├── api/                  # API client (Symfony backend)
│   │   ├── queries/              # TanStack Query hooks
│   │   ├── validations/          # Zod schemas
│   │   └── utils.ts              # Utility functions
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   ├── AI-DD/                    # Frontend best practices (2025)
│   ├── .cursor/rules/            # Cursor AI rules
│   ├── package.json              # Dependencies
│   └── tsconfig.json             # TypeScript config
│
├── openspec/                     # OpenSpec change management
│   ├── project.md                # Project conventions
│   ├── specs/                    # Current specs
│   ├── changes/                  # Proposed changes
│   └── AGENTS.md                 # OpenSpec instructions
│
├── .claude/                      # Claude Code configuration
├── CLAUDE.md                     # This file
└── AGENTS.md                     # AI agent guidelines
```

---

## API Integration

### Backend Endpoints

From `api/postman/` collection:

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | JWT login |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/status` | Check auth status |

#### User Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update user profile |

#### Google OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |

### Frontend API Client Pattern

The frontend uses unified API clients documented in `frontend/AI-DD/16-API-PATTERNS.md`:

```typescript
// Server-side (Server Components, Server Actions)
import { serverAPI } from '@/lib/api/server'

export async function getUserProfile() {
  const { data, error } = await serverAPI.get('/users/me')
  return data
}

// Client-side (Client Components)
import { clientAPI } from '@/lib/api/client'

export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => clientAPI.get('/users/me')
  })
}
```

### Authentication Flow

1. **JWT Tokens**: Include in `Authorization` header as `Bearer <token>`
2. **Refresh Token Rotation**: Backend implements automatic refresh token rotation
3. **Cookie-based Sessions**: Token expiration read from cookie metadata
4. **CORS**: Configured for localhost in `api/config/packages/nelmio_cors.yaml`

---

## Testing Strategy

### Backend Testing (Pest PHP)

**Philosophy**: Strict TDD (Test-Driven Development)

```bash
make test                # Run all tests
make test-unit           # Unit tests only
make test-feature        # Feature tests only
make test-security       # Security tests only
make test-architecture   # Architecture tests only
make test-coverage       # With coverage report
make test-watch          # Watch mode
```

**TDD Workflow** (see `api/AI-DD/tdd/test-first.md`):
1. Write failing test (RED)
2. Write minimum code to pass (GREEN)
3. Refactor while keeping tests green (REFACTOR)

### Frontend Testing

Testing setup recommended (not yet configured):

```bash
bun add -d vitest @testing-library/react @testing-library/jest-dom
bun add -d @testing-library/user-event @vitejs/plugin-react jsdom
```

---

## Code Quality Tools

### Backend
- **PHPStan**: Static analysis (`make tools`)
- **Pest PHP**: Testing framework with architecture tests
- **Doctrine Migrations**: Database versioning
- **PHP CS Fixer**: Code formatting (recommended to add)

### Frontend
- **ESLint 9**: Linting (`bun run lint`)
- **TypeScript Strict Mode**: Type checking
- **Prettier**: Code formatting (recommended to add)

---

## OpenSpec Workflow

This project uses **OpenSpec** for spec-driven development.

### When to Create a Proposal

**Always create a proposal for:**
- New features or capabilities
- Breaking changes (API, schema)
- Architecture changes
- Performance optimizations (that change behavior)
- Security pattern updates

**Skip proposal for:**
- Bug fixes (restoring intended behavior)
- Typos, formatting, comments
- Non-breaking dependency updates
- Configuration changes
- Tests for existing behavior

### OpenSpec Commands

```bash
# List items
openspec list               # Active changes
openspec list --specs       # Specifications

# View details
openspec show [item]        # Display change or spec
openspec diff [change]      # Show spec differences

# Validation
openspec validate [item]    # Validate changes/specs
openspec validate --strict  # Comprehensive validation

# Archive (after deployment)
openspec archive [change] --yes
```

### Workflow

1. **Before coding**: Check `openspec list` and `openspec list --specs`
2. **Create proposal**: See `openspec/AGENTS.md` for detailed instructions
3. **Validate**: `openspec validate [change-id] --strict`
4. **Implement**: Follow `tasks.md` checklist
5. **Archive**: After deployment, archive the change

**See `openspec/AGENTS.md` for comprehensive OpenSpec documentation.**

---

## Development Workflow

### Standard Development Flow

1. **Start backend**: `cd api && make dev`
2. **Start frontend**: `cd frontend && bun dev`
3. **Create feature branch**: `git checkout -b feature/your-feature`
4. **Check for OpenSpec**: If adding new capability, create proposal first
5. **Backend development**:
   - Write tests first (TDD)
   - Follow SOLID principles
   - Keep controllers < 50 lines
   - Run `make test` frequently
6. **Frontend development**:
   - Follow `frontend/AI-DD/` patterns
   - Use Server Components by default
   - No `any` types
   - Consult AI-DD docs for patterns
7. **Commit frequently**: Meaningful commit messages
8. **Update Postman** (if API changed): See `api/.cursor/rules/postman-api-sync.md`
9. **Run quality checks**:
   - Backend: `make test && make tools`
   - Frontend: `bun run lint`
10. **Create PR**: Reference OpenSpec change if applicable

### Git Workflow

```bash
# Start session
git status && git branch

# Create feature branch (never work on main)
git checkout -b feature/chat-ui

# Work on feature...

# Commit frequently
git add .
git commit -m "feat: add chat message component"

# Before risky operations
git commit -m "chore: checkpoint before refactor"
```

---

## AI Agent Guidelines

### File Creation Rules

**NEVER create summary/recap .md files without explicit permission.**

Forbidden files:
- ❌ `summary.md`, `recap.md`, `changes.md`, `migration.md`, `notes.md`, `todo.md`
- ❌ Any other `.md` file not explicitly requested

**What to do instead:**
- ✅ Provide summaries in chat
- ✅ Update existing docs (CLAUDE.md, AGENTS.md)
- ✅ Add inline code comments
- ✅ Update AI-DD/ documentation
- ✅ Create detailed commit messages

### Workspace Organization

**Think before creating files:**
- **Claude-specific docs**: Place in `claudedocs/` (if created)
- **Tests**: Place in `tests/`, `__tests__/`, or `test/` directories
- **Scripts**: Place in `scripts/`, `tools/`, or `bin/` directories
- **Never scatter**: No `test_*.py` next to source, no `debug.sh` in root

### When Working on Backend

1. **Read** `api/AI-DD/` documentation first
2. **Write tests first** (TDD is mandatory)
3. **Follow SOLID principles** strictly
4. **Use interfaces** for dependencies
5. **Keep controllers slim** (< 50 lines)
6. **Run tests frequently** (`make test`)
7. **Check PHPStan** (`make tools`)

### When Working on Frontend

1. **Read** `frontend/AI-DD/` documentation first
2. **Use Server Components** by default
3. **No `any` types** - strict TypeScript
4. **Use `type`, never `interface`**
5. **Follow feature-first architecture**
6. **Use unified API clients** (serverAPI/clientAPI)
7. **Consult AI-DD** for patterns

---

## Environment Variables

### Backend (`api/.env`)

```bash
# Database
DATABASE_URL=postgresql://test:test@postgres:5432/chatrealtime

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET_KEY=%kernel.project_dir%/config/jwt/private.pem
JWT_PUBLIC_KEY=%kernel.project_dir%/config/jwt/public.pem
JWT_PASSPHRASE=your-passphrase

# App
APP_ENV=dev
APP_SECRET=generate-random-secret

# CORS
CORS_ALLOW_ORIGIN=^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$
```

### Frontend (`frontend/.env.local`)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://localhost/api

# Authentication (if using NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Google OAuth (if needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## Postman API Collection

**MANDATORY**: Always update Postman collection after API modifications.

### Collection Location
```
api/postman/
├── Chat-Realtime-API.postman_collection.json    # Main collection
└── Chat-Realtime-API.postman_environment.json   # Environment
```

### When to Update
- ✅ Add new endpoint
- ✅ Modify endpoint (path, method, parameters, response)
- ✅ Remove endpoint
- ✅ Change request/response schema
- ✅ Modify authentication

**See `api/.cursor/rules/postman-api-sync.md` for detailed workflow.**

---

## Performance Best Practices

### Backend
- Use Redis for session storage and caching
- Optimize database queries with indexes
- Use Doctrine query caching
- Enable OPcache in production
- Use FrankenPHP worker mode for production

### Frontend
- Server Components by default (minimize client JS)
- Use `next/image` for image optimization
- Use `next/font` for font optimization
- Code splitting with React.lazy() and Suspense
- Streaming with Suspense boundaries
- Prefetch data in Server Components

---

## Deployment Checklist

### Backend
- [ ] All tests pass (`make test`)
- [ ] PHPStan clean (`make tools`)
- [ ] Migrations up to date
- [ ] Environment variables set
- [ ] JWT keys generated
- [ ] Redis configured
- [ ] Database backup strategy
- [ ] Monitoring configured

### Frontend
- [ ] Build succeeds (`bun run build`)
- [ ] Test production build (`bun start`)
- [ ] Environment variables set
- [ ] API endpoints reachable
- [ ] Authentication flows work
- [ ] CORS configured
- [ ] Lighthouse audit passed
- [ ] Multiple devices tested

---

## Documentation References

### Internal Documentation
- **This file**: Project overview and quick reference
- **Backend**: `api/CLAUDE.md` - Symfony 7.3 backend details
- **Frontend**: `frontend/CLAUDE.md` - Next.js 15 frontend details
- **Backend AI-DD**: `api/AI-DD/` - TDD + SOLID principles
- **Frontend AI-DD**: `frontend/AI-DD/` - 2025 best practices
- **OpenSpec**: `openspec/AGENTS.md` - Spec-driven development
- **Postman**: `api/postman/` - API collection

### External Documentation
- **Symfony**: https://symfony.com/doc/current/
- **API Platform**: https://api-platform.com/docs/
- **Doctrine**: https://www.doctrine-project.org/
- **Next.js 15**: https://nextjs.org/docs
- **React 19**: https://react.dev
- **shadcn/ui**: https://ui.shadcn.com
- **TanStack Query**: https://tanstack.com/query
- **React Hook Form**: https://react-hook-form.com
- **Zod**: https://zod.dev

---

## Getting Help

### Development Issues
- Check relevant AI-DD/ documentation first
- Review existing tests and patterns
- Consult OpenAPI docs at https://localhost/docs
- Check git history for similar implementations

### Testing Issues
- Backend: See `api/AI-DD/tdd/test-first.md`
- Run tests in watch mode for faster feedback
- Check test coverage: `make test-coverage`

### Architecture Questions
- Backend: See `api/AI-DD/architecture/clean-architecture.md`
- Frontend: See `frontend/AI-DD/03-CLEAN-ARCHITECTURE.md`
- Review OpenSpec proposals for design decisions

---

**Remember**: This is a strict TDD + SOLID backend with a modern Next.js 15 frontend. Always consult the AI-DD/ documentation in both directories before coding.
