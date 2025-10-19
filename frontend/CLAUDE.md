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

# AI-DD Documentation

**AI-Driven Development (AI-DD)** - Comprehensive frontend development guidelines

## 📚 Quick Reference

The `AI-DD/` directory contains **complete documentation** for building production-quality features with Next.js 15, React 19, and the modern 2025 stack.

### When to Consult AI-DD

**ALWAYS reference AI-DD documentation when:**
- Creating new features or components
- Implementing data fetching patterns
- Writing forms with validation
- Building server actions
- Managing state
- Following architecture patterns
- Ensuring code quality and standards

### Documentation Structure

```
AI-DD/
├── 00-INDEX.md                    # Complete index with quick start
├── 00-README.md                   # Overview and principles
├── QUICKSTART.md                  # Quick reference guide

# Core Patterns & Technologies
├── 01-NEXTJS-PATTERNS.md         # Next.js 15 App Router patterns
├── 02-TYPESCRIPT-REACT.md        # TypeScript & React 19 best practices
├── 03-CLEAN-ARCHITECTURE.md      # Feature-first architecture
├── 04-SHADCN-UI.md               # shadcn/ui + Tailwind CSS v4
├── 05-TANSTACK-QUERY.md          # TanStack Query v5 data fetching
├── 06-SAFE-ACTIONS.md            # next-safe-action server actions
├── 07-ZUSTAND.md                 # Zustand state management
├── 08-PATTERNS-RECIPES.md        # Combined patterns & complete examples

# Code Quality & Standards
├── 09-TYPESCRIPT-STRICT-TYPING.md # TypeScript strict mode, no any
├── 10-CODING-STANDARDS.md         # Project coding standards
├── 11-SHARED-COMPONENTS.md        # Shared component library
├── 12-LINT-ROADMAP.md            # ESLint 100% compliance roadmap
├── 13-LINT-FIX-EXAMPLES.md       # Practical lint fix examples
├── 14-ERROR-HANDLING.md          # Error handling patterns
├── 15-ANNOUNCEMENT-DETAIL-PAGE.md # Complex page example
└── 16-API-PATTERNS.md            # API integration patterns
```

### Quick Access by Task

| Task | Consult |
|------|---------|
| **New component** | `04-SHADCN-UI.md`, `02-TYPESCRIPT-REACT.md` |
| **New route/page** | `01-NEXTJS-PATTERNS.md`, `03-CLEAN-ARCHITECTURE.md` |
| **Data fetching** | `05-TANSTACK-QUERY.md`, `16-API-PATTERNS.md` |
| **Form with validation** | `05-REACT-HOOK-FORM.mdc` (cursor rules) |
| **Server action** | `06-SAFE-ACTIONS.md` |
| **State management** | `07-ZUSTAND.md` |
| **Complete feature** | `08-PATTERNS-RECIPES.md` |
| **Type safety** | `09-TYPESCRIPT-STRICT-TYPING.md` |
| **Code standards** | `10-CODING-STANDARDS.md` |
| **Error handling** | `14-ERROR-HANDLING.md` |
| **API integration** | `16-API-PATTERNS.md` |

### Critical Project Rules (from AI-DD)

```typescript
// ⚠️ MUST FOLLOW
type ProjectRules = {
  types: "ALWAYS 'type', NEVER 'interface'"
  architecture: "Feature-first (features/ not components/)"
  serverFirst: "Server Components by default, 'use client' only when needed"
  typeStrict: "NO 'any' types - strict TypeScript enforcement"
  api: "Use serverAPI/clientAPI unified clients (see 16-API-PATTERNS.md)"
}
```

### AI-DD Integration

1. **Start of Session**: Read `AI-DD/00-INDEX.md` or `AI-DD/QUICKSTART.md` for overview
2. **Before Creating Features**: Consult relevant AI-DD files for patterns
3. **Code Quality**: Follow `09-TYPESCRIPT-STRICT-TYPING.md` and `10-CODING-STANDARDS.md`
4. **Architecture**: Always respect `03-CLEAN-ARCHITECTURE.md` feature-first structure
5. **Best Practices 2025**: All AI-DD docs reflect latest official best practices

### Cursor Rules Integration

The `.cursor/rules/` directory contains complementary rules that enforce AI-DD patterns:
- `01-nextjs-core.mdc` - Next.js 15 core patterns
- `02-next-safe-action.mdc` - Server actions
- `03-tanstack-query.mdc` - Data fetching
- `04-shadcn-ui.mdc` - UI components
- `05-react-hook-form.mdc` - Forms
- `06-performance.mdc` - Performance optimization
- `07-authentication.mdc` - Auth patterns

**Note**: Cursor rules are auto-applied; AI-DD docs provide detailed explanations and examples.

# CLAUDE.md - Next.js 15 Frontend Documentation

This file provides comprehensive guidance to Claude Code and AI agents when working with this Next.js 15 frontend project.

---

## Project Overview

This is the **Next.js 15** frontend for the Chat Realtime application, built with modern best practices (2025).

### Core Technology Stack
- **Bun 1.x**: Fast all-in-one JavaScript runtime (package manager, bundler, test runner)
- **Next.js 15.5.6**: React framework with App Router architecture
- **React 19.1.0**: Latest React with Server Components
- **TypeScript 5**: Full type safety with strict mode
- **Tailwind CSS 4**: Utility-first styling with CSS variables
- **shadcn/ui**: Pre-built accessible UI components (New York style)
- **Turbopack**: Next-gen bundler for development and production

### Backend Integration
This frontend connects to a **Symfony 7.3 API** located at `../api`:
- RESTful endpoints via API Platform
- JWT authentication (Lexik JWT Bundle)
- Google OAuth integration
- Real-time capabilities

**Backend principles**:
- Strict TDD (Test-Driven Development)
- SOLID principles enforced
- Interface-based dependency injection
- See `../api/CLAUDE.md` and `../api/AGENTS.md` for backend architecture

---

## Quick Start

### Development Commands
```bash
# Start development server with Turbopack
bun dev

# Build for production with Turbopack
bun run build

# Start production server
bun start

# Lint code
bun run lint

# Type check
bun run type-check

# Install dependencies
bun install

# Add a package
bun add <package-name>

# Add dev dependency
bun add -d <package-name>

# Run tests (when configured)
bun test
```

**Development server**: http://localhost:3000

---

## Architecture Principles (2025 Best Practices)

### 1. Server-First Architecture
- **Default to Server Components**: Use client components only when necessary (interactivity, hooks, browser APIs)
- **Server-side data fetching**: Fetch data on the server to access backend resources securely and reduce round-trips
- **Server actions for mutations**: Use server actions instead of API routes for type safety and progressive enhancement

### 2. Data Fetching Patterns
- **Fetch where needed**: Components can call `fetch` or React's `cache` anywhere; requests are automatically memoized
- **No prop drilling**: Keep data close to consuming components
- **Parallel fetching**: Start multiple data requests outside components, await inside to avoid waterfalls
- **Streaming with Suspense**: Wrap slow sections in `<Suspense>` to stream HTML progressively

### 3. Security Best Practices
- **Input validation**: Use Zod schemas for all user inputs
- **Authentication checks**: Verify auth in every server action
- **Sensitive data protection**: Enable `experimental.taint` in `next.config.js` and use React's taint APIs
- **CSRF protection**: Server actions only accept POST requests; Next.js rejects mismatched Origin headers

### 4. Performance Optimization
- **Minimize client JavaScript**: Keep components on the server when possible
- **Image optimization**: Use `next/image` for automatic optimization
- **Font optimization**: Use `next/font` for automatic font loading
- **Code splitting**: Lazy load heavy components with `React.lazy()` and `Suspense`

---

## Recommended Project Structure (App Router)

```
app/
├── (auth)/                         # Route group - authentication flows (doesn't affect URL)
│   ├── login/
│   │   ├── page.tsx                # Route: /login
│   │   ├── loading.tsx             # Loading UI (automatic Suspense)
│   │   └── error.tsx               # Error boundary
│   ├── register/
│   │   └── page.tsx                # Route: /register
│   ├── forgot-password/
│   │   └── page.tsx                # Route: /forgot-password
│   └── layout.tsx                  # Shared auth layout (centered card)
│
├── (dashboard)/                    # Route group - protected routes
│   ├── _components/                # Private folder - components for dashboard only
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx
│   │   └── user-menu.tsx
│   ├── profile/
│   │   ├── page.tsx                # Route: /profile (Server Component)
│   │   ├── _components/            # Private - profile-specific components
│   │   │   ├── profile-form.tsx    # Client component
│   │   │   └── avatar-upload.tsx
│   │   └── loading.tsx
│   ├── settings/
│   │   ├── page.tsx                # Route: /settings
│   │   ├── _components/
│   │   │   ├── settings-nav.tsx
│   │   │   └── notification-settings.tsx
│   │   └── loading.tsx
│   ├── chat/
│   │   ├── page.tsx                # Route: /chat
│   │   ├── [roomId]/               # Dynamic route: /chat/[roomId]
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── _components/
│   │       ├── chat-list.tsx
│   │       ├── message-input.tsx
│   │       └── message-list.tsx
│   └── layout.tsx                  # Dashboard layout with sidebar
│
├── api/                            # API routes (Route Handlers)
│   ├── auth/
│   │   └── route.ts                # POST /api/auth
│   └── upload/
│       └── route.ts                # POST /api/upload
│
├── _lib/                           # Private folder - shared utilities (not routable)
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-auth.ts
│   │   ├── use-websocket.ts
│   │   └── use-chat.ts
│   ├── utils/                      # Utility functions
│   │   ├── format.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   └── providers/                  # Context providers
│       ├── query-provider.tsx
│       └── theme-provider.tsx
│
├── layout.tsx                      # Root layout (fonts, metadata, providers)
├── page.tsx                        # Home page (/)
├── loading.tsx                     # Global loading UI
├── error.tsx                       # Global error boundary
├── not-found.tsx                   # 404 page
└── globals.css                     # Global Tailwind styles

components/                         # Shared components (shadcn/ui + custom)
├── ui/                             # shadcn/ui components (installed via CLI)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── toast.tsx
│   └── ...                         # 50+ shadcn components
├── layout/                         # Reusable layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── container.tsx
├── forms/                          # Reusable form components
│   ├── login-form.tsx
│   ├── register-form.tsx
│   └── search-form.tsx
└── shared/                         # Other shared components
    ├── logo.tsx
    ├── user-avatar.tsx
    └── loading-spinner.tsx

lib/                                # Core business logic
├── actions/                        # Server actions
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   └── logout.ts
│   ├── user/
│   │   ├── update-profile.ts
│   │   └── delete-account.ts
│   ├── chat/
│   │   ├── send-message.ts
│   │   └── create-room.ts
│   └── safe-action.ts              # next-safe-action clients
│
├── api/                            # API client functions (Symfony backend)
│   ├── client.ts                   # Fetch wrapper with auth
│   ├── auth.ts                     # Auth API calls
│   ├── users.ts                    # Users API calls
│   └── chat.ts                     # Chat API calls
│
├── queries/                        # TanStack Query hooks
│   ├── use-user.ts
│   ├── use-messages.ts
│   └── use-rooms.ts
│
├── validations/                    # Zod schemas
│   ├── auth.ts
│   ├── user.ts
│   └── chat.ts
│
├── utils.ts                        # Utility functions (cn, formatters)
└── auth.ts                         # Auth helpers (getSession, etc.)

hooks/                              # Custom React hooks
├── use-mobile.ts
├── use-auth.ts
└── use-debounce.ts

types/                              # TypeScript types
├── api.ts                          # API response types
├── models.ts                       # Domain models
└── index.ts                        # Re-exports

public/                             # Static assets
├── images/
├── icons/
└── fonts/

.cursor/                            # Cursor AI rules
└── rules/
    ├── README.mdc
    ├── 01-nextjs-core.mdc
    ├── 02-next-safe-action.mdc
    ├── 03-tanstack-query.mdc
    ├── 04-shadcn-ui.mdc
    ├── 05-react-hook-form.mdc
    └── 06-performance.mdc
```

### Folder Organization Rules

**App Router Conventions:**
- **Route groups**: `(name)/` - Organize routes without affecting URLs
- **Private folders**: `_name/` - Not routable, for co-located components/utils
- **Dynamic routes**: `[param]/` - URL parameters
- **Catch-all routes**: `[...slug]/` - Match multiple segments
- **Parallel routes**: `@name/` - Render multiple pages in the same layout
- **Intercepting routes**: `(.)name/` - Intercept and rewrite routes

**Best Practices:**
- Co-locate components close to where they're used (`_components/` in route folders)
- Use route groups to organize related pages without affecting URLs
- Keep shared components in root `components/` directory
- Separate server actions by feature in `lib/actions/`
- Use TypeScript for all files


---

## Current Directory Structure

```
app/
├── layout.tsx          # Root layout with fonts and metadata
├── page.tsx            # Home page
└── globals.css         # Global styles with Tailwind and CSS variables

components/
└── ui/                 # shadcn/ui components (50+ components)
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── form.tsx
    └── ...             # All shadcn components

lib/
└── utils.ts            # Utility functions (cn() for className merging)

hooks/
└── use-mobile.ts       # Custom React hooks

public/                 # Static assets
```

---

## UI Component System (shadcn/ui)

### Configuration
**File**: `components.json`
- **Style**: New York (modern, refined styling)
- **Base color**: Neutral
- **Icon library**: Lucide React
- **CSS Variables**: Enabled for theming
- **Tailwind config**: `tailwind.config.ts`

### Installed Components (50+)
- **Layout**: Card, Separator, Tabs, Accordion, Collapsible, Resizable, Sidebar
- **Forms**: Input, Textarea, Checkbox, Radio, Select, Switch, Slider, Calendar
- **Feedback**: Alert, Dialog, Toast (Sonner), Progress, Spinner, Skeleton
- **Navigation**: Dropdown Menu, Context Menu, Menubar, Navigation Menu, Breadcrumb
- **Data**: Table, Chart (Recharts), Pagination
- **Overlay**: Popover, Tooltip, Hover Card, Drawer, Sheet
- **Typography**: Badge, KBD, Empty state

### Adding Components
```bash
# Using Bun
bunx --bun shadcn@latest add <component-name>

# Examples
bunx --bun shadcn@latest add data-table
bunx --bun shadcn@latest add calendar

# Update components
bunx --bun shadcn@latest update
```

### Path Aliases
Configured in `tsconfig.json`:
```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useMyHook } from "@/hooks/use-mobile"
```

### Best Practices
1. **Keep UI components pure**: No business logic, state management, or data fetching
2. **Use Server Components**: Render shadcn components on server when possible
3. **Create wrappers**: Extend shadcn components with Tailwind classes for reusability
4. **Use variants**: Leverage `class-variance-authority` for component variants
5. **Accessibility first**: Follow WCAG guidelines, provide ARIA labels
6. **Stay updated**: Run `bunx --bun shadcn@latest update` regularly

---

## Styling System

### Tailwind CSS 4
- **CSS variables**: Theme colors defined in `app/globals.css` (`--background`, `--foreground`, etc.)
- **Dark mode**: Supported via `.dark` class (use `next-themes` package)
- **Custom animations**: Available via `tw-animate-css`
- **Fonts**: Geist Sans and Geist Mono (optimized with `next/font`)

### Utility Function
```typescript
import { cn } from "@/lib/utils"

// cn() combines clsx and tailwind-merge for conditional className merging
<div className={cn("base-class", condition && "conditional-class")} />
```

### Theme Customization
Edit CSS variables in `app/globals.css` under `@theme inline` directive:
```css
@theme inline {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  /* ... */
}
```

---

## TypeScript Configuration

### Settings
- **Target**: ES2017
- **Strict mode**: Enabled
- **Path aliases**: `@/*` maps to project root
- **JSX**: Preserve (handled by Next.js)
- **Module resolution**: Bundler

### Type Safety Rules
- ✅ Always use explicit types
- ✅ Avoid `any` (use `unknown` if necessary)
- ✅ Define return types for functions
- ✅ Use Zod for runtime validation and type inference
- ✅ Leverage TypeScript utility types (`Partial`, `Pick`, `Omit`, etc.)

---

## Backend API Integration

### API Base URL
**Symfony backend**: `https://localhost` (via FrankenPHP)

### Authentication Endpoints
From `../api/postman/` collection:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | JWT login |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/status` | Check auth status |
| GET | `/api/users/me` | Get current user profile |

### Google OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |

### API Client Pattern
```typescript
// lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost/api'

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const session = await auth()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(session?.accessToken && {
      Authorization: `Bearer ${session.accessToken}`
    }),
    ...options?.headers
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}
```

### Integration Notes
- **JWT tokens**: Include in `Authorization` header as `Bearer <token>`
- **Refresh token flow**: Implement automatic token refresh on 401 responses
- **CORS**: Configured for localhost in backend (`config/packages/nelmio_cors.yaml`)
- **API contracts**: Reference `../api/postman/` for exact endpoint specifications
- **TDD compliance**: Backend follows strict TDD; respect API contracts

---

## Server Actions with next-safe-action

### Setup
```typescript
// lib/actions/safe-action.ts
import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/lib/auth'

export const actionClient = createSafeActionClient()

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return next({ ctx: { userId: session.user.id } })
})
```

### Creating Actions
```typescript
// lib/actions/user.ts
'use server'

import { authActionClient } from './safe-action'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const updateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export const updateProfileAction = authActionClient
  .schema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db.users.update({
      where: { id: ctx.userId },
      data: parsedInput
    })

    revalidatePath('/profile')

    return { success: true }
  })
```

### Client Usage
```typescript
'use client'

import { useAction } from 'next-safe-action/hooks'
import { updateProfileAction } from '@/lib/actions/user'

export function ProfileForm() {
  const { execute, result, isExecuting } = useAction(updateProfileAction)

  const onSubmit = (data: FormData) => {
    execute({
      name: data.get('name') as string,
      email: data.get('email') as string
    })
  }

  return (
    <form action={onSubmit}>
      {result?.validationErrors && <Errors errors={result.validationErrors} />}
      {result?.serverError && <Error error={result.serverError} />}

      <input name="name" />
      <input name="email" />
      <button disabled={isExecuting}>Save</button>
    </form>
  )
}
```

---

## TanStack Query (React Query)

### Provider Setup
```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        {children}
      </ReactQueryStreamedHydration>
    </QueryClientProvider>
  )
}
```

### Server-Side Prefetching
```typescript
// app/users/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { UsersList } from './users-list'

async function getUsers() {
  const res = await fetch('/api/users')
  return res.json()
}

export default async function UsersPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['users'],
    queryFn: getUsers
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersList />
    </HydrationBoundary>
  )
}
```

---

## Form Management

### React Hook Form + Zod
**Installed packages**:
- `react-hook-form` 7.65
- `zod` 4.1
- `@hookform/resolvers`
- shadcn Form components

### Pattern
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormData = z.infer<typeof formSchema>

export function LoginForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange'
  })

  const onSubmit = async (data: FormData) => {
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... */}
      </form>
    </Form>
  )
}
```

---

## Data Visualization

### Recharts Integration
**Version**: 2.15.4 (integrated via shadcn Chart component)

**Features**:
- Line, Bar, Area, Pie charts
- Tooltips and legends
- Responsive containers

**Usage**:
```bash
npx shadcn@latest add chart
```

---

## Key Dependencies

### UI & Styling
- **Radix UI**: 40+ primitive packages for accessible components
- **Lucide React**: Icon library
- **Tailwind CSS 4**: Utility-first CSS framework
- **tw-animate-css**: Animation utilities
- **next-themes**: Theme switching (dark mode)
- **class-variance-authority**: Component variants

### Forms & Validation
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **@hookform/resolvers**: Zod integration for react-hook-form

### Data Fetching
- **@tanstack/react-query**: Server state management
- **next-safe-action**: Type-safe server actions

### Utilities
- **clsx**: Conditional className utility
- **tailwind-merge**: Merge Tailwind classes intelligently
- **date-fns**: Date manipulation
- **vaul**: Drawer component
- **sonner**: Toast notifications

---

## Code Conventions

### General Rules
- **Server Components by default**: Use `"use client"` only when necessary
- **TypeScript strict mode**: No `any`, explicit types
- **Component naming**: PascalCase (e.g., `UserProfile`)
- **File naming**: kebab-case (e.g., `user-profile.tsx`)
- **Import order**: External dependencies → Internal modules → Relative imports
- **Styling**: Tailwind utilities first, custom CSS only when necessary

### Component Patterns
```typescript
// Server Component (default)
export default async function ProductsPage() {
  const products = await getProducts()
  return <ProductList products={products} />
}

// Client Component (when needed)
'use client'

export function ProductList({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  return <div>{/* interactive UI */}</div>
}
```

---

## Environment Variables

### Configuration
Create `.env.local` for local development:

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

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Next.js App Router Features

### File-Based Routing
- **Pages**: `app/*/page.tsx` creates routes
- **Layouts**: `app/*/layout.tsx` creates shared layouts
- **Loading states**: `app/*/loading.tsx` creates Suspense boundaries
- **Error handling**: `app/*/error.tsx` creates error boundaries
- **Route groups**: `app/(group)/*/page.tsx` organizes without affecting URLs
- **Private folders**: `app/_folder/*` prevents routing

### Metadata API
```typescript
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Chat Realtime',
  description: 'Real-time chat application'
}

// app/profile/page.tsx
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Profile | Chat Realtime'
  }
}
```

---

## Turbopack

This project uses **Turbopack** (Next.js's new bundler):
- ✅ Significantly faster than Webpack
- ✅ Instant Hot Module Replacement (HMR)
- ✅ Reduced build times
- ✅ Better tree-shaking and optimization

**Development**: Turbopack is enabled by default in Next.js 15
**Production**: Build with `npm run build` (uses Turbopack)

---

## Development Workflow

### Standard Workflow
1. **Start backend API**: See `../api/CLAUDE.md` for setup instructions
2. **Start frontend**: `npm run dev`
3. **Develop features**:
   - Use shadcn/ui components
   - Follow React 19 and Next.js 15 patterns
   - Implement server-first architecture
4. **API integration**: Create API client functions and server actions
5. **State management**: Use TanStack Query for server state
6. **Build**: `npm run build` before deployment

### Git Workflow
```bash
# Start every session
git status
git branch

# Create feature branch
git checkout -b feature/chat-ui

# Work on feature...

# Commit frequently
git add .
git commit -m "feat: add chat message component"

# Before risky operations, create restore point
git commit -m "chore: checkpoint before refactor"
```

---

## Testing Strategy

### Recommended Setup
```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitejs/plugin-react jsdom
```

### Testing Patterns
- **Unit tests**: Test utilities, helpers, and pure functions
- **Component tests**: Test UI components with React Testing Library
- **Integration tests**: Test data flows and user interactions
- **E2E tests**: Use Playwright or Cypress for critical flows

### File Organization
```
__tests__/
├── lib/
│   └── utils.test.ts
├── components/
│   └── login-form.test.tsx
└── integration/
    └── auth-flow.test.tsx
```

---

## Performance Best Practices

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-the-fold images
  placeholder="blur"
/>
```

### Font Optimization
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap'
})

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Code Splitting
```typescript
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./heavy-component'))

export function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

---

## Deployment Checklist

- ✅ Run `bun run build` locally to check for build errors
- ✅ Test production build with `bun start`
- ✅ Check environment variables are set in production
- ✅ Verify API endpoints are reachable from production
- ✅ Test authentication flows (login, logout, token refresh)
- ✅ Validate CORS configuration with backend
- ✅ Check performance with Lighthouse
- ✅ Test on multiple devices and browsers

---

## Reference Documentation

### Internal Documentation
- **Backend API**: `../api/CLAUDE.md`
- **Backend Agents**: `../api/AGENTS.md`
- **Postman Collection**: `../api/postman/`
- **AI Agent Guidelines**: `./AGENTS.md`
- **Cursor Rules**: `./.cursor/rules`

### External Documentation
- **Next.js 15**: https://nextjs.org/docs
- **React 19**: https://react.dev
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **TanStack Query**: https://tanstack.com/query
- **React Hook Form**: https://react-hook-form.com
- **Zod**: https://zod.dev
- **next-safe-action**: https://next-safe-action.dev

---

## AI Agent File Creation Rules

### 🚫 STRICTLY FORBIDDEN - Markdown Summary Files

**NEVER create summary, recap, or documentation .md files without EXPLICIT user permission.**

This includes but is not limited to:
- ❌ `summary.md`
- ❌ `recap.md`
- ❌ `changes.md`
- ❌ `migration.md`
- ❌ `notes.md`
- ❌ `todo.md`
- ❌ `update.md`
- ❌ `bun-migration.md`
- ❌ Any other `.md` file not explicitly requested

**Why this rule exists:**
- Summary files clutter the project
- They duplicate information already in commit messages and documentation
- They create maintenance burden
- User can see all changes in chat history
- The project already has comprehensive documentation

**Exceptions (ONLY with explicit permission):**
- User specifically asks: "Create a summary.md file"
- User requests: "Document this in a markdown file"
- Project documentation updates (CLAUDE.md, AGENTS.md, .cursor/rules/, etc.)

**What to do instead:**
- ✅ Provide summaries in chat responses
- ✅ Update existing documentation files (CLAUDE.md, AGENTS.md)
- ✅ Add inline code comments
- ✅ Update .cursor/rules/ documentation
- ✅ Create commit messages with detailed descriptions

**Violation consequences:**
If you create an unauthorized .md file, you MUST:
1. Immediately delete it
2. Apologize to the user
3. Provide the summary in chat instead

---

## Agent Usage

When working with this project, AI agents should:

1. **Read** `./AGENTS.md` for role-specific guidelines
2. **Follow** `./.cursor/rules` for Next.js 15 best practices
3. **Reference** `../api/CLAUDE.md` for backend integration details
4. **Consult** `../api/postman/` for exact API contracts
5. **NEVER create .md summary files without explicit permission**

**Key Principles**:
- Server-first architecture (default to Server Components)
- Type safety with TypeScript and Zod
- Security by default (validate inputs, check auth)
- Performance optimization (streaming, lazy loading)
- Accessibility compliance (WCAG guidelines)
- No unauthorized documentation files

---

## Future Enhancements

### Recommended Additions
- **State management**: Zustand or Jotai for complex client state
- **API client**: Dedicated API client with retry logic and error handling
- **Testing**: Complete Vitest + React Testing Library setup
- **E2E tests**: Playwright for critical user flows
- **Storybook**: Component documentation and visual testing
- **Analytics**: Vercel Analytics or custom solution
- **Error tracking**: Sentry or similar
- **Monitoring**: Performance monitoring and logging

---

## Support and Resources

### Getting Help
- **Next.js GitHub**: https://github.com/vercel/next.js
- **shadcn/ui Discord**: https://discord.gg/shadcn
- **Stack Overflow**: Tag questions with `next.js`, `react`, `tailwindcss`

### Learning Resources
- **Next.js Learn**: https://nextjs.org/learn
- **React Beta Docs**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
