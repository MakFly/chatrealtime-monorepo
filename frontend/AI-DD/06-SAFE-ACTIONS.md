# next-safe-action - Server Actions Type-Safe 2025

## 🎯 Setup

```bash
pnpm add next-safe-action zod zod-form-data
```

```typescript
// shared/lib/safe-action.ts
import { createSafeActionClient } from 'next-safe-action'

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (typeof e === 'string') {
      return {
        serverError: e,
      }
    }

    return {
      serverError: 'Une erreur est survenue',
    }
  },
})

// With auth middleware
export const authActionClient = actionClient.use(authMiddleware)
```

## 📦 Exemples iAutos - Implémentation Actuelle

### Auth Actions (server.ts comme point de terminaison unique)

```typescript
// features/auth/lib/auth-actions.ts
'use server'

import { z } from 'zod'
import { actionClient } from '@/shared/lib/safe-action'
import { serverPost, serverGet, serverPatch } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { loginSchema, registerSchema } from '../schemas/schemas'
import type { AuthResponse, LoginAPIResponse, User } from '../types'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  remember: z.boolean().default(false),
})

export const loginAction = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput }) => {
    const { email, password } = parsedInput

    try {
      // Utiliser serverPost pour appeler le backend
      const response = await serverPost<LoginAPIResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      })

      // Vérifier que la réponse contient les données attendues
      if (!response.data?.data) {
        throw new Error('Réponse de connexion invalide')
      }

      const { access_token, expires_in, roles } = response.data.data

      // Définir le cookie httpOnly avec le token
      const cookieStore = await cookies()

      cookieStore.set('iautos_ssid', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expires_in,
        path: '/',
      })

      // Récupérer les informations utilisateur depuis /me
      try {
        const { data: userData } = await serverGet<User>(API_ENDPOINTS.AUTH.ME)
        
        // Revalider les chemins après connexion réussie
        revalidatePath('/account')
        revalidatePath('/')
        
        return { success: true, user: userData, expiresIn: expires_in }
      } catch (userError) {
        console.error('Erreur lors de la récupération du profil utilisateur:', userError)
        
        // Créer un utilisateur basique avec les informations disponibles
        const userData = {
          id: 'unknown',
          username: email.split('@')[0],
          email,
          firstName: '',
          lastName: '',
          roles,
          isSubscribed: false,
          subscriptionStatus: 'basic',
          phone: null,
          avatarUrl: null,
          remainingAnnouncements: 0,
          grantedAnnouncements: null,
          createdAt: new Date().toISOString(),
          stats: {
            announcements: { total: 0, active: 0, pending: 0, sold: 0, drafted: 0 },
            views: { total: 0, last_30_days: 0, last_7_days: 0 },
            engagement: { favorites_received: 0, messages_received: 0, phone_contacts: 0 },
            performance: { conversion_rate: 0, average_time_to_sell: null, response_rate: 0 }
          }
        }
        
        // Revalider les chemins après connexion réussie
        revalidatePath('/account')
        revalidatePath('/')
        
        return { success: true, user: userData, expiresIn: expires_in }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Email ou mot de passe incorrect')
    }
  })
```

### Create Ad Actions (avec server.ts)

```typescript
// features/create-annonce/lib/actions.ts
'use server'

import { z } from 'zod'
import { authActionClient } from '@/shared/lib/safe-action-clients'
import { serverPost, serverGet, serverPatch } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'
import { revalidatePath } from 'next/cache'

const createDraftSchema = z.object({
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères'),
  description: z.string().min(20, 'La description doit contenir au moins 20 caractères'),
  price: z.number().min(0, 'Le prix doit être positif'),
  category: z.string().min(1, 'La catégorie est requise'),
  brand: z.string().min(1, 'La marque est requise'),
  model: z.string().min(1, 'Le modèle est requis'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1, 'L\'année est invalide'),
  mileage: z.number().min(0, 'Le kilométrage doit être positif'),
  fuelType: z.enum(['Essence', 'Diesel', 'Électrique', 'Hybride', 'GPL', 'Autre']),
  transmission: z.enum(['Manuelle', 'Automatique', 'Séquentielle']),
  location: z.string().min(1, 'La localisation est requise'),
  images: z.array(z.string().url()).optional(),
})

export const createDraftAction = authActionClient
  .schema(createDraftSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx

    try {
      // Utiliser serverPost comme point de terminaison unique
      const { data } = await serverPost(API_ENDPOINTS.CREATE_AD.DRAFT, {
        ...parsedInput,
        userId: user.id,
      })

      // Revalidate catalog page
      revalidatePath('/account/private/annonces')
      revalidatePath('/account/private')

      return { success: true, listing: data }
    } catch (error) {
      console.error('Create draft error:', error)
      throw new Error('Erreur lors de la création du brouillon')
    }
  })
```

### Update Profile Actions

```typescript
// features/auth/lib/auth-actions.ts
export const updateProfileAction = actionClient
  .inputSchema(
    z.object({
      firstName: z.string().min(2).optional(),
      lastName: z.string().min(2).optional(),
      phone: z.string().optional(),
      avatar: z.string().url().optional(),
    })
  )
  .action(async ({ parsedInput }) => {
    try {
      // Utiliser serverPatch pour appeler le backend
      const { data } = await serverPatch<User>(API_ENDPOINTS.USER.PROFILE, parsedInput)

      return { success: true, user: data }
    } catch (error) {
      console.error('Update profile error:', error)
      throw new Error('Erreur lors de la mise à jour du profil')
    }
  })
```

## 🔗 Patterns d'Utilisation

### Client Usage avec React Hook Form

```typescript
// features/auth/components/login-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAction } from 'next-safe-action/hooks'
import { loginAction } from '../lib/auth-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  })

  const { execute, status } = useAction(loginAction, {
    onSuccess: ({ data }) => {
      toast.success('Connexion réussie')
      router.refresh()
      router.push('/account')
    },
    onError: ({ error }) => {
      toast.error(error.serverError || 'Erreur de connexion')
    },
  })

  const onSubmit = async (data) => {
    await execute(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit" disabled={status === 'executing'}>
        {status === 'executing' ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  )
}
```

### Server Components avec Actions

```typescript
// app/account/private/page.tsx
import { serverPost, serverGet, serverPatch } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'

async function getUserListings() {
  try {
    const { data } = await serverGet<any>(API_ENDPOINTS.USER.LISTINGS, {
      cache: 'no-store',
    })
    return data
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error)
    return { listings: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
  }
}

export default async function AnnoncesPage() {
  const listingsData = await getUserListings()
  const { listings, pagination } = listingsData

  return <AnnoncesClient listings={listings} pagination={pagination} />
}
```

## 🛡️ Sécurité et Authentification

### Middleware d'Authentification

```typescript
// shared/lib/safe-action-middleware.ts
export const authMiddleware = async ({ next }: any) => {
  const cookieStore = await cookies()
  const token = cookieStore.get('iautos_ssid')?.value

  if (!token) {
    throw new Error('Non authentifié')
  }

  // Vérifier le token et obtenir l'utilisateur
  try {
    const { data } = await serverGet(API_ENDPOINTS.AUTH.ME)
    const user = data

    return next({ ctx: { user } })
  } catch {
    // Si le token est invalide, supprimer le cookie
    cookieStore.delete('iautos_ssid')
    throw new Error('Session expirée')
  }
}

// Client avec middleware d'authentification
export const authActionClient = actionClient.use(authMiddleware)
```

### Validation des Rôles

```typescript
// shared/components/auth/RoleProtectedRoute.tsx
export function RoleProtectedRoute({
  children,
  requiredRoles = [],
  fallback = null,
}: RoleProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return null
  }

  const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role))
  
  if (!hasRequiredRole) {
    return fallback
  }

  return <>{children}</>
}
```

## 🔄 Cache et Revalidation

### Revalidation Stratégique

```typescript
// Après création/modification
revalidatePath('/account/private/annonces')
revalidatePath('/account/private')

// Après connexion/déconnexion
revalidatePath('/', 'layout')
revalidatePath('/account')
revalidatePath('/connexion')
revalidatePath('/inscription')
```

### Cache Control

```typescript
// Pour les données critiques (toujours fraîches)
const { data } = await serverGet('/api/v1/users/me/listings', {
  cache: 'no-store',
})

// Pour les données statiques (peuvent être mises en cache)
const { data } = await serverGet('/api/v1/categories', {
  next: { revalidate: 3600 }, // Revalider toutes les heures
})
```

## 📋 Bonnes Practices

### 1. Validation Toujours Stricte

```typescript
// ✅ Toujours valider avec Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// ❌ Ne jamais faire confiance aux données client
export const unsafeAction = actionClient.action(async ({ parsedInput }) => {
  // parsedInput peut être n'importe quoi sans validation
})
```

### 2. Gestion d'Erreurs Centralisée

```typescript
// ✅ Gérer les erreurs de manière cohérente
try {
  const result = await serverPost('/endpoint', data)
  return { success: true, data: result.data }
} catch (error) {
  console.error('Action error:', error)
  throw new Error('Message d\'erreur clair pour l\'utilisateur')
}
```

### 3. Revalidation Précise

```typescript
// ✅ Revalider uniquement les chemins nécessaires
revalidatePath('/account/private/annonces')

// ❌ Éviter la revalidation globale
revalidatePath('/') // Trop coûteux
```

## 🚫 Anti-Pattern: API Routes vs Server Actions

### ❌ NE JAMAIS FAIRE

```typescript
// ❌ ANTI-PATTERN - Créer des API Routes pour auth/user operations
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  // Appeler le backend
  const response = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await response.json()

  // Définir le cookie
  cookies().set('iautos_ssid', data.access_token, { httpOnly: true })

  return NextResponse.json({ success: true })
}

// Client appelle l'API Route
await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
})
```

**Pourquoi c'est mauvais:**
- ❌ Layer inutile (Client → API Route → Backend au lieu de Client → Server Action → Backend)
- ❌ Pas de type-safety automatique
- ❌ Pas de validation Zod intégrée
- ❌ Plus de code à maintenir
- ❌ Performance dégradée (un hop HTTP supplémentaire)

### ✅ FAIRE À LA PLACE

```typescript
// ✅ CORRECT - Server Action avec next-safe-action
// features/auth/lib/auth-actions.ts
'use server'

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    // Server Action a accès direct aux cookies
    const { data } = await serverPost('/api/v1/auth/login', parsedInput)

    // Définir cookie httpOnly directement
    const cookieStore = await cookies()
    cookieStore.set('iautos_ssid', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return { success: true }
  })

// Client appelle Server Action directement avec useAction
'use client'
export function LoginForm() {
  const { execute, isPending } = useAction(loginAction)

  const onSubmit = async (data: LoginFormData) => {
    const result = await execute(data)
    if (result?.data?.success) {
      router.push('/account/private')
    }
  }
}
```

**Pourquoi c'est mieux:**
- ✅ Type-safety end-to-end automatique
- ✅ Validation Zod intégrée
- ✅ Accès direct aux cookies via `await cookies()`
- ✅ Moins de code, plus maintenable
- ✅ Performance optimale (pas de hop HTTP inutile)
- ✅ Pattern Next.js 15 officiel

### 📌 Règle d'Or

**API Routes sont SEULEMENT pour:**
- ✅ Webhooks externes (Stripe, GitHub, etc.)
- ✅ Endpoints publics exposés à des services tiers
- ✅ OAuth callbacks qui nécessitent une URL publique

**Server Actions sont pour:**
- ✅ Authentification (login, logout, register)
- ✅ User CRUD (create, update, delete user data)
- ✅ Form submissions
- ✅ Toute opération nécessitant accès aux cookies
- ✅ Mutations de données avec revalidation

### 🎯 Pattern Correct Complet

```typescript
// 1. Schema Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// 2. Server Action
export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const { data } = await serverPost('/api/v1/auth/login', parsedInput)
    const cookieStore = await cookies()
    cookieStore.set('iautos_ssid', data.access_token, { httpOnly: true })
    revalidatePath('/account')
    return { success: true }
  })

// 3. Client Component
'use client'
export function LoginForm() {
  const form = useForm({ resolver: zodResolver(loginSchema) })
  const { execute, isPending } = useAction(loginAction)

  const onSubmit = async (data) => {
    const result = await execute(data)
    if (result?.data?.success) router.push('/account/private')
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      <input {...form.register('password')} type="password" />
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  )
}
```

## 🔗 Ressources

- [next-safe-action Docs](https://next-safe-action.dev)
- [Zod](https://zod.dev)
- [zod-form-data](https://www.npmjs.com/package/zod-form-data)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
