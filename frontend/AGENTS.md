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

# AGENTS.md - AI Agent Guidelines for Next.js 15 Project

## Agent Roles and Responsibilities

This document defines specialized AI agent roles for working with this Next.js 15 + Symfony API project. Each agent has specific responsibilities, expertise areas, and operational guidelines.

---

## Core Agents

### 1. Architecture Agent
**Role**: System design, project structure, and technical decision-making

**Expertise**:
- Next.js 15 App Router architecture
- Server Components vs Client Components decisions
- API integration patterns with Symfony backend
- Performance optimization strategies
- Security architecture

**Responsibilities**:
- Design folder structure and file organization
- Make decisions on route grouping and layout hierarchies
- Determine when to use Server Components vs Client Components
- Plan data fetching strategies (server-side, client-side, hybrid)
- Define authentication and authorization flows
- Establish caching and revalidation patterns

**Decision Framework**:
```
Question: Where should this component live?
├─ Is it route-specific? → app/(group)/route/component.tsx
├─ Is it reusable UI? → components/ui/ or components/shared/
├─ Is it a layout? → components/layout/
└─ Is it business logic? → lib/ or src/

Question: Server or Client Component?
├─ Needs interactivity/hooks? → Client Component
├─ Fetches data directly? → Server Component
├─ Uses browser APIs? → Client Component
└─ Pure presentation? → Server Component (default)
```

**Code Example**:
```typescript
// Architecture decision: Route groups for auth and dashboard
app/
├── (auth)/
│   ├── login/page.tsx
│   └── layout.tsx          # Auth-specific layout
├── (dashboard)/
│   ├── profile/page.tsx
│   └── layout.tsx          # Protected layout with sidebar
└── layout.tsx              # Root layout
```

---

### 2. Backend Integration Agent
**Role**: API integration, authentication, and data synchronization with Symfony backend

**Expertise**:
- Symfony 7.3 API Platform endpoints
- JWT authentication flows (Lexik JWT Bundle)
- Google OAuth integration
- RESTful API patterns
- Error handling and retry logic

**Responsibilities**:
- Implement authentication flows (login, register, token refresh)
- Create API client functions for backend endpoints
- Handle JWT token storage and rotation
- Implement error boundaries for API failures
- Set up CORS and security headers
- Create type-safe API wrappers

**Reference Files**:
- Backend API: `../api/CLAUDE.md`
- Postman collection: `../api/postman/`
- API endpoints: `../api/src/Controller/`

**Code Example**:
```typescript
// lib/api/client.ts
import { auth } from '@/lib/auth'

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
    if (response.status === 401) {
      // Handle token refresh
      throw new Error('Unauthorized')
    }
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

// lib/api/users.ts
import { apiClient } from './client'

export async function getCurrentUser() {
  return apiClient<User>('/users/me')
}

export async function updateUser(id: string, data: Partial<User>) {
  return apiClient<User>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  })
}
```

---

### 3. Data Management Agent
**Role**: State management, caching, and data fetching strategies

**Expertise**:
- TanStack Query (React Query) integration
- Server-side data prefetching
- Cache invalidation strategies
- Optimistic updates
- ISR (Incremental Static Regeneration) patterns

**Responsibilities**:
- Set up React Query providers and configuration
- Implement server-side prefetching with HydrationBoundary
- Create query and mutation hooks
- Handle cache invalidation on mutations
- Implement optimistic updates for better UX
- Configure staleTime and gcTime appropriately

**Code Example**:
```typescript
// lib/queries/users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, updateUser } from '@/lib/api/users'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })
}

// app/profile/page.tsx - Server-side prefetch
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getCurrentUser } from '@/lib/api/users'
import { ProfileClient } from './profile-client'

export default async function ProfilePage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileClient />
    </HydrationBoundary>
  )
}
```

---

### 4. Form Agent
**Role**: Form creation, validation, and submission handling

**Expertise**:
- React Hook Form integration
- Zod schema validation
- Shadcn Form components
- Server action integration
- Error handling and user feedback

**Responsibilities**:
- Create reusable form components
- Define Zod validation schemas
- Integrate forms with server actions
- Handle form errors and display validation messages
- Implement progressive enhancement
- Add loading and disabled states

**Code Example**:
```typescript
// lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export type LoginFormData = z.infer<typeof loginSchema>

// lib/actions/auth.ts
'use server'

import { actionClient } from './safe-action'
import { loginSchema } from '@/lib/validations/auth'
import { signIn } from '@/lib/auth'

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const result = await signIn('credentials', {
      email: parsedInput.email,
      password: parsedInput.password,
      redirect: false
    })

    if (!result.ok) {
      throw new Error('Invalid credentials')
    }

    return { success: true }
  })

// components/forms/login-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { loginSchema, LoginFormData } from '@/lib/validations/auth'
import { loginAction } from '@/lib/actions/auth'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  const { execute, isExecuting, result } = useAction(loginAction)

  const onSubmit = (data: LoginFormData) => {
    execute(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {result?.serverError && (
          <div className="text-sm text-destructive">{result.serverError}</div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isExecuting}>
          {isExecuting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </Form>
  )
}
```

---

### 5. UI/UX Agent
**Role**: User interface design and component development with Shadcn/UI

**Expertise**:
- Shadcn/UI component library (New York style)
- Tailwind CSS 4 utilities
- Responsive design patterns
- Accessibility (WCAG guidelines)
- Dark mode implementation

**Responsibilities**:
- Install and configure Shadcn components
- Create wrapper components with custom variants
- Ensure responsive layouts (mobile-first)
- Implement accessibility features (ARIA labels, keyboard navigation)
- Maintain consistent design system
- Keep UI components pure (no business logic)

**Code Example**:
```typescript
// components/shared/status-badge.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusVariants = cva('', {
  variants: {
    status: {
      active: 'bg-green-500 text-white',
      pending: 'bg-yellow-500 text-white',
      inactive: 'bg-gray-500 text-white',
      error: 'bg-red-500 text-white'
    }
  },
  defaultVariants: {
    status: 'inactive'
  }
})

interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge className={cn(statusVariants({ status }), className)}>
      {status}
    </Badge>
  )
}

// Usage
<StatusBadge status="active" />
<StatusBadge status="error" />
```

---

### 6. Security Agent
**Role**: Authentication, authorization, and security best practices

**Expertise**:
- JWT token management
- Server action security
- Input validation and sanitization
- CSRF protection
- XSS prevention
- Data taint APIs

**Responsibilities**:
- Implement secure authentication flows
- Add authorization checks to server actions
- Validate and sanitize all user inputs
- Prevent sensitive data leaks to client
- Configure security headers
- Handle session management

**Code Example**:
```typescript
// lib/auth.ts - Simplified example
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const res = await fetch('https://localhost/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(credentials)
        })

        const user = await res.json()

        if (res.ok && user) {
          return user
        }

        return null
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      return session
    }
  }
}

// lib/actions/safe-action.ts
import { createSafeActionClient } from 'next-safe-action'
import { auth } from '@/lib/auth'

export const actionClient = createSafeActionClient()

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth()

  if (!session) {
    throw new Error('Unauthorized - Please log in')
  }

  return next({ ctx: { userId: session.user.id } })
})

// Protected server action
'use server'

import { authActionClient } from './safe-action'
import { z } from 'zod'
import { experimental_taintObjectReference } from 'react'

export const getSecretDataAction = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const data = await db.secrets.findUnique({
      where: { id: parsedInput.id, userId: ctx.userId }
    })

    // Prevent data from being passed to client
    experimental_taintObjectReference(
      'Secret data should not be sent to client',
      data
    )

    return { id: data.id, name: data.name } // Only send safe fields
  })
```

---

### 7. Testing Agent
**Role**: Testing strategy, implementation, and quality assurance

**Expertise**:
- Vitest / Jest for unit tests
- React Testing Library for component tests
- Playwright / Cypress for E2E tests
- Test-driven development (TDD)
- Backend TDD compliance (from Symfony API)

**Responsibilities**:
- Write unit tests for utilities and helpers
- Create component tests with Testing Library
- Implement E2E tests for critical user flows
- Mock API calls and server actions
- Ensure test coverage goals
- Follow TDD when required

**Code Example**:
```typescript
// __tests__/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })
})

// __tests__/components/login-form.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/forms/login-form'
import { vi } from 'vitest'

vi.mock('@/lib/actions/auth', () => ({
  loginAction: vi.fn()
}))

describe('LoginForm', () => {
  it('displays validation errors', async () => {
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: /log in/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')

    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(loginAction).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })
})
```

---

### 8. Performance Agent
**Role**: Optimization, monitoring, and performance tuning

**Expertise**:
- Next.js performance optimization
- Image and font optimization
- Bundle size analysis
- Lazy loading and code splitting
- Lighthouse metrics

**Responsibilities**:
- Optimize images with next/image
- Implement lazy loading for heavy components
- Analyze and reduce bundle size
- Configure caching strategies
- Monitor Core Web Vitals
- Implement Suspense boundaries

**Code Example**:
```typescript
// app/dashboard/page.tsx - Lazy loading heavy components
import { Suspense, lazy } from 'react'

const HeavyChart = lazy(() => import('@/components/heavy-chart'))

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  )
}

// next.config.js - Bundle analysis
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  },
  experimental: {
    optimizeCss: true,
    turbo: {
      loaders: {
        '.svg': ['@svgr/webpack']
      }
    }
  }
})
```

---

## Agent Collaboration Protocol

### Communication Flow
```
User Request → Architecture Agent (decides structure)
             ↓
Backend Integration Agent (API calls)
             ↓
Data Management Agent (caching/state)
             ↓
Form Agent (if forms needed)
             ↓
UI/UX Agent (components)
             ↓
Security Agent (review)
             ↓
Testing Agent (tests)
             ↓
Performance Agent (optimization)
```

### Handoff Checklist
When an agent completes its task, it should provide:
- ✅ Summary of changes made
- ✅ Files created/modified
- ✅ Any new dependencies added
- ✅ Configuration changes
- ✅ Next steps for other agents
- ✅ Known issues or limitations

---

## Agent Decision Trees

### When to Use Server vs Client Components
```
Start: New component needed
├─ Does it use hooks (useState, useEffect, etc.)? → Client Component
├─ Does it use browser APIs (localStorage, window, etc.)? → Client Component
├─ Does it have event handlers (onClick, onChange, etc.)? → Client Component
├─ Does it fetch data directly from database/API? → Server Component
├─ Is it purely presentational (no interactivity)? → Server Component
└─ Default → Server Component
```

### When to Use Server Actions vs API Routes
```
Start: Need to perform mutation
├─ Is it a simple CRUD operation? → Server Action
├─ Needs progressive enhancement? → Server Action
├─ Called from forms? → Server Action
├─ Needs webhook/external access? → API Route
├─ Needs custom HTTP methods beyond POST? → API Route
└─ Default → Server Action
```

### Data Fetching Strategy
```
Start: Need to display data
├─ Data is user-specific? → Client-side with React Query (gcTime: 0)
├─ Data is public and changes rarely? → Server-side with ISR
├─ Data needs real-time updates? → Client-side with polling/websocket
├─ Data is needed for SEO? → Server-side rendering
├─ Data is slow to fetch? → Server-side with Suspense streaming
└─ Default → Server-side rendering
```

---

## Quality Standards

Every agent must adhere to:

### Code Quality
- ✅ TypeScript strict mode enabled
- ✅ No `any` types (use `unknown` if necessary)
- ✅ Explicit return types for functions
- ✅ Proper error handling (try/catch, error boundaries)
- ✅ Comments for complex logic only

### Security
- ✅ Validate all inputs with Zod
- ✅ Check authentication in server actions
- ✅ Never expose secrets to client
- ✅ Use `experimental_taint` for sensitive data
- ✅ Sanitize user inputs

### Performance
- ✅ Use Server Components by default
- ✅ Lazy load heavy components
- ✅ Optimize images with next/image
- ✅ Minimize client-side JavaScript
- ✅ Implement proper caching strategies

### Accessibility
- ✅ Semantic HTML elements
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Color contrast ratios (WCAG AA minimum)
- ✅ Screen reader friendly

### Testing
- ✅ Unit tests for utilities
- ✅ Component tests for UI
- ✅ Integration tests for flows
- ✅ Minimum 80% coverage for critical paths

---

## Environment-Specific Guidelines

### Development
- Use `npm run dev` with Turbopack
- Enable React strict mode
- Use development builds of dependencies
- Verbose error messages

### Production
- Build with `npm run build`
- Enable all optimizations
- Minimize bundle size
- Implement monitoring and logging

---

## Conclusion

These agents work collaboratively to build a high-quality, performant, and secure Next.js 15 application. Each agent has specific expertise but should communicate with others to ensure cohesive development.

**Key Principles**:
- Server-first architecture
- Type safety with TypeScript and Zod
- Security by default
- Performance optimization
- Accessibility compliance
- Test-driven development
