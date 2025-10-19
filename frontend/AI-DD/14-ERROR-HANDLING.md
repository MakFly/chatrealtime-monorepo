# Error Handling - Next.js 15 Patterns

## 🎯 Overview

Comprehensive error handling strategy for Next.js 15 App Router applications, covering expected errors, uncaught exceptions, and integration with modern React 19 patterns.

## 📚 Table of Contents

1. [Error Categories](#error-categories)
2. [Expected Errors](#expected-errors)
3. [Uncaught Exceptions](#uncaught-exceptions)
4. [Error Boundaries](#error-boundaries)
5. [Server Actions Error Handling](#server-actions-error-handling)
6. [Integration Patterns](#integration-patterns)
7. [iAutos Specific Patterns](#iautos-specific-patterns)

## 🔄 Error Categories

### Expected Errors
- Form validation failures
- API request failures
- Authentication/authorization issues
- Business logic violations

### Uncaught Exceptions
- Runtime errors
- Network failures
- Unexpected server errors
- Component rendering errors

## ✅ Expected Errors

### Server Functions with useActionState

**React 19 Pattern** - Use `useActionState` hook for form handling:

```typescript
// features/cars/lib/car-actions.ts
'use server'

import { actionClient } from '@/shared/lib/safe-action'
import { z } from 'zod'
import { serverPost } from '@/shared/lib/api/server'

const createCarSchema = z.object({
  title: z.string().min(5, 'Titre trop court'),
  price: z.number().min(100, 'Prix minimum 100€'),
  description: z.string().min(20, 'Description trop courte')
})

export async function createCar(prevState: any, formData: FormData) {
  const title = formData.get('title') as string
  const price = Number(formData.get('price'))
  const description = formData.get('description') as string

  // Validation with Zod
  const validation = createCarSchema.safeParse({ title, price, description })
  if (!validation.success) {
    return { 
      message: validation.error.errors[0].message,
      field: validation.error.errors[0].path[0]
    }
  }

  try {
    const { data } = await serverPost('/api/v1/cars', validation.data)
    return { success: true, data }
  } catch (error) {
    return { message: 'Erreur lors de la création du véhicule' }
  }
}
```

```typescript
// features/cars/components/CreateCarForm.tsx
'use client'

import { useActionState } from 'react'
import { createCar } from '../lib/car-actions'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'

const initialState = {
  message: '',
  field: '',
  success: false
}

export function CreateCarForm() {
  const [state, formAction, pending] = useActionState(createCar, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Titre
        </label>
        <Input 
          type="text" 
          id="title" 
          name="title" 
          required
          className={state.field === 'title' ? 'border-red-500' : ''}
        />
      </div>
      
      <div>
        <label htmlFor="price" className="block text-sm font-medium mb-1">
          Prix
        </label>
        <Input 
          type="number" 
          id="price" 
          name="price" 
          required
          className={state.field === 'price' ? 'border-red-500' : ''}
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <textarea 
          id="description" 
          name="description" 
          required
          className={state.field === 'description' ? 'border-red-500' : ''}
        />
      </div>

      {state?.message && (
        <p 
          className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}
          role="alert"
        >
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Création...' : 'Créer le véhicule'}
      </Button>
    </form>
  )
}
```

### Server Components Error Handling

```typescript
// app/cars/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { serverGet } from '@/shared/lib/api/server'

export default async function CarPage({ params }: { params: { slug: string } }) {
  try {
    const { data: car } = await serverGet(`/api/v1/cars/${params.slug}`)
    
    if (!car) {
      notFound()
    }
    
    return <CarDetail car={car} />
  } catch (error) {
    // Log error for debugging
    console.error('Failed to fetch car:', error)
    
    // Return user-friendly error
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-red-600">
          Erreur lors du chargement du véhicule
        </h1>
        <p className="text-muted-foreground">
          Veuillez réessayer plus tard ou contacter le support.
        </p>
      </div>
    )
  }
}
```

### Not Found Handling

```typescript
// app/cars/[slug]/page.tsx
import { getCarBySlug } from '@/features/cars/lib/cars-api'
import { notFound } from 'next/navigation'

export default async function CarPage({ params }: { params: { slug: string } }) {
  const car = await getCarBySlug(params.slug)

  if (!car) {
    notFound()
  }

  return <CarDetail car={car} />
}
```

```typescript
// app/cars/[slug]/not-found.tsx
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Véhicule non trouvé</h1>
      <p className="text-muted-foreground mb-8">
        Le véhicule que vous recherchez n'existe pas ou a été supprimé.
      </p>
      <Button asChild>
        <Link href="/cars">Retour aux véhicules</Link>
      </Button>
    </div>
  )
}
```

## 🚨 Uncaught Exceptions

### Error Boundaries

Create error boundaries for route segments:

```typescript
// app/cars/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Cars page error:', error)
    
    // Send to error reporting (Sentry, etc.)
    // if (typeof window !== 'undefined') {
    //   window.Sentry?.captureException(error)
    // }
  }, [error])

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">
            Erreur technique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Une erreur inattendue s'est produite lors du chargement des véhicules.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-muted-foreground">
              <summary>Détails techniques</summary>
              <pre className="mt-2 p-2 bg-muted rounded">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <Button onClick={reset} className="w-full">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Global Error Boundary

```typescript
// app/global-error.tsx
'use client'

import { Button } from '@/shared/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    // global-error must include html and body tags
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <h1 className="text-4xl font-bold text-red-600">
              Erreur critique
            </h1>
            <p className="text-muted-foreground">
              Une erreur système s'est produite. L'équipe technique a été notifiée.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left text-xs text-muted-foreground">
                <summary>Détails de l'erreur</summary>
                <pre className="mt-2 p-4 bg-muted rounded overflow-auto">
                  {error.message}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            )}
            
            <Button onClick={reset} size="lg">
              Réinitialiser l'application
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
```

## 🔧 Server Actions Error Handling

### next-safe-action Integration

```typescript
// features/auth/lib/auth-actions.ts
'use server'

import { actionClient } from '@/shared/lib/safe-action'
import { z } from 'zod'
import { serverPost } from '@/shared/lib/api/server'
import { serverGet } from '@/shared/lib/api/server'
import { cookies } from 'next/headers'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court')
})

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput: credentials }) => {
    try {
      const { data } = await serverPost('/api/v1/auth/login', credentials)
      
      // Set httpOnly cookie
      const cookieStore = await cookies()
      cookieStore.set('iautos_ssid', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/',
      })
      
      return { success: true, user: data.user }
    } catch (error) {
      // Let next-safe-action handle the error
      throw new Error('Email ou mot de passe incorrect')
    }
  })
```

```typescript
// features/auth/components/LoginForm.tsx
'use client'

import { useAction } from 'next-safe-action/hooks'
import { loginAction } from '../lib/auth-actions'
import { toast } from 'sonner'

export function LoginForm() {
  const { execute, isPending } = useAction(loginAction, {
    onSuccess: ({ data }) => {
      toast.success('Connexion réussie!')
      // Redirect or update UI
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur de connexion')
    }
  })

  const onSubmit = async (formData: FormData) => {
    const credentials = {
      email: formData.get('email') as string,
      password: formData.get('password') as string
    }
    
    execute(credentials)
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {/* Form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}
```

## 🔗 Integration Patterns

### TanStack Query Error Handling

```typescript
// features/cars/hooks/useCars.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCars, toggleFavorite } from '../lib/cars-api'
import { toast } from 'sonner'

export function useCars(filters: CarFilters = {}) {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: () => getCars(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.status >= 400 && error.status < 500) {
        return false
      }
      return failureCount < 3
    },
    onError: (error) => {
      if (error.status === 401) {
        toast.error('Session expirée, veuillez vous reconnecter')
      } else {
        toast.error('Erreur lors du chargement des véhicules')
      }
    }
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (carId) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['cars'] })
      
      // Snapshot previous value
      const previousCars = queryClient.getQueryData(['cars'])
      
      // Optimistically update
      queryClient.setQueryData(['cars'], (old: Car[] = []) =>
        old.map(car =>
          car.id === carId
            ? { ...car, isFavorite: !car.isFavorite }
            : car
        )
      )
      
      return { previousCars }
    },
    onError: (error, carId, context) => {
      // Rollback on error
      queryClient.setQueryData(['cars'], context?.previousCars)
      toast.error('Erreur lors de la mise en favori')
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['cars'] })
    }
  })
}
```

### Custom Error Hook

```typescript
// shared/hooks/useErrorHandler.ts
import { useCallback } from 'react'
import { toast } from 'sonner'

type ErrorHandler = (error: unknown) => void

export function useErrorHandler(): ErrorHandler {
  return useCallback((error: unknown) => {
    if (error instanceof Error) {
      console.error('Application error:', error)
      
      // Handle specific error types
      if (error.message.includes('Network')) {
        toast.error('Erreur réseau', {
          description: 'Vérifiez votre connexion internet'
        })
      } else if (error.message.includes('Unauthorized')) {
        toast.error('Non autorisé', {
          description: 'Veuillez vous reconnecter'
        })
      } else {
        toast.error('Erreur inattendue', {
          description: error.message
        })
      }
    } else {
      console.error('Unknown error:', error)
      toast.error('Erreur inattendue')
    }
  }, [])
}
```

## 🚗 iAutos Specific Patterns

### French Error Messages

```typescript
// shared/lib/error-messages.ts
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  SESSION_EXPIRED: 'Votre session a expiré, veuillez vous reconnecter',
  ACCESS_DENIED: 'Vous n\'avez pas les permissions nécessaires',
  
  // Cars
  CAR_NOT_FOUND: 'Véhicule non trouvé',
  CAR_CREATION_FAILED: 'Erreur lors de la création du véhicule',
  CAR_UPDATE_FAILED: 'Erreur lors de la mise à jour du véhicule',
  CAR_DELETE_FAILED: 'Erreur lors de la suppression du véhicule',
  
  // Forms
  REQUIRED_FIELD: 'Ce champ est obligatoire',
  INVALID_EMAIL: 'Email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  
  // Network
  NETWORK_ERROR: 'Erreur réseau, vérifiez votre connexion',
  SERVER_ERROR: 'Erreur serveur, veuillez réessayer plus tard',
  
  // Generic
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
  TRY_AGAIN: 'Veuillez réessayer'
} as const

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map common error messages to French
    if (error.message.includes('401')) return ERROR_MESSAGES.SESSION_EXPIRED
    if (error.message.includes('403')) return ERROR_MESSAGES.ACCESS_DENIED
    if (error.message.includes('404')) return ERROR_MESSAGES.CAR_NOT_FOUND
    if (error.message.includes('500')) return ERROR_MESSAGES.SERVER_ERROR
    
    return error.message
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR
}
```

### Error Boundary with iAutos Styling

```typescript
// shared/components/error-boundary.tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { getErrorMessage } from '@/shared/lib/error-messages'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    
    // Send to error reporting
    // if (typeof window !== 'undefined') {
    //   window.Sentry?.captureException(error, { contexts: { react: errorInfo } })
    // }
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} reset={this.reset} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const errorMessage = getErrorMessage(error)
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600 flex items-center justify-center gap-2">
            <span className="text-2xl">⚠️</span>
            Erreur technique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {errorMessage}
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Détails techniques</summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <Button onClick={reset} className="w-full">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 📋 Best Practices Checklist

### ✅ Do's
- Use `useActionState` for form handling with Server Actions
- Create `error.tsx` files for route segments
- Use `notFound()` for missing resources
- Return error objects from Server Actions (don't throw)
- Log errors for debugging
- Provide user-friendly error messages in French
- Use error boundaries for component trees
- Handle different error types appropriately

### ❌ Don'ts
- Use `try/catch` in Server Actions for expected errors
- Throw errors for validation failures
- Show technical error messages to users
- Forget to log errors for monitoring
- Ignore error recovery mechanisms
- Use generic error messages for all cases

## 🔄 Error Handling Flow

```
User Action → Server Action/API Call
    ↓
Error Occurs?
    ├─ No → Success Flow
    └─ Yes
        ├─ Expected Error?
        │   ├─ Yes → Return error object
        │   └─ No → Throw error
        ↓
Error Boundary Catches?
    ├─ Yes → Show error UI with reset
    └─ No → Global error boundary
```

## 🎯 Key Takeaways

1. **Differentiate error types** - Handle expected vs unexpected errors differently
2. **Use modern patterns** - `useActionState` for forms, error boundaries for components
3. **Provide good UX** - French error messages, recovery options, loading states
4. **Monitor and log** - Track errors for debugging and improvement
5. **Graceful degradation** - Always provide fallback UI and recovery mechanisms

---

**Reference**: [Next.js Error Handling Documentation](https://nextjs.org/docs/app/getting-started/error-handling)