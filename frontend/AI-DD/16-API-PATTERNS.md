# API Integration Patterns - server.ts & client.ts

## 🎯 Objectif

Documentation complète des patterns d'intégration API avec le backend Symfony via `server.ts` (côté serveur) et `client.ts` (côté client).

## 📋 Table des Matières

1. [Architecture API](#architecture-api)
2. [server.ts - Server-Side API](#serverTs-server-side-api)
3. [client.ts - Client-Side API](#clientTs-client-side-api)
4. [Fonctionnalités de Résilience](#fonctionnalités-de-résilience)
5. [Authentication & Cookies](#authentication--cookies)
6. [Exemples Complets](#exemples-complets)
7. [Best Practices](#best-practices)

## Architecture API

### Pattern de Base

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Next.js 15                    │
│                                                          │
│  ┌─────────────────────┐      ┌────────────────────┐   │
│  │  Server Components  │      │ Client Components  │   │
│  │  Server Actions     │      │ Event Handlers     │   │
│  │                     │      │                    │   │
│  │  Uses: server.ts ────┤      │ Uses: client.ts ────┤  │
│  └─────────────────────┘      └────────────────────┘   │
└────────────┬─────────────────────────┬──────────────────┘
             │                         │
             │ HTTP + JWT Bearer       │ HTTP + JWT Bearer
             │                         │
             ↓                         ↓
┌─────────────────────────────────────────────────────────┐
│              Backend Symfony API (Port 8080)             │
│                  /api/v1/* endpoints                     │
└─────────────────────────────────────────────────────────┘
```

### Règle d'Or

- **server.ts**: TOUJOURS pour Server Components et Server Actions
- **client.ts**: SEULEMENT pour Client Components avec interactions utilisateur
- **JAMAIS** de `fetch()` direct dans le code métier

## server.ts - Server-Side API

### Import & Usage

```typescript
// Import des fonctions helpers
import { serverGet, serverPost, serverPut, serverPatch, serverDelete } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'

// GET request
const { data, status, headers } = await serverGet<User>('/api/v1/users/me')

// POST request
const { data } = await serverPost<CreateResponse>('/api/v1/cars', {
  brand: 'Peugeot',
  model: '208',
  year: 2023
})

// PUT request (replace entire resource)
const { data } = await serverPut<UpdateResponse>('/api/v1/cars/123', updatedCar)

// PATCH request (partial update)
const { data } = await serverPatch<UpdateResponse>('/api/v1/cars/123', { price: 15000 })

// DELETE request
const { data } = await serverDelete<DeleteResponse>('/api/v1/cars/123')
```

### Server Actions Pattern

```typescript
// features/cars/lib/car-actions.ts
'use server'

import { actionClient } from '@/shared/lib/safe-action'
import { serverPost, serverGet } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createCarSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1900).max(2025),
  price: z.number().min(0),
})

export const createCarAction = actionClient
  .schema(createCarSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Utiliser serverPost pour appeler le backend
      const { data } = await serverPost(API_ENDPOINTS.CARS.CREATE, parsedInput)

      // Revalidate paths après création
      revalidatePath('/cars')
      revalidatePath('/account/private/annonces')

      return { success: true, car: data }
    } catch (error) {
      console.error('Create car error:', error)
      throw new Error('Erreur lors de la création du véhicule')
    }
  })

export const getCarDetailsAction = async (carId: string) => {
  try {
    const { data } = await serverGet(`/api/v1/cars/${carId}`)
    return data
  } catch (error) {
    console.error('Get car details error:', error)
    return null
  }
}
```

### Server Components Pattern

```typescript
// app/cars/[id]/page.tsx
import { serverGet } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'
import { notFound } from 'next/navigation'

type Car = {
  id: string
  brand: string
  model: string
  price: number
}

async function getCarDetails(id: string): Promise<Car | null> {
  try {
    const { data } = await serverGet<Car>(`${API_ENDPOINTS.CARS.DETAIL}/${id}`, {
      // Options de cache Next.js
      next: { revalidate: 3600 }, // Revalidate every hour
    })
    return data
  } catch (error) {
    console.error('Failed to fetch car:', error)
    return null
  }
}

export default async function CarDetailPage({ params }: { params: { id: string } }) {
  const car = await getCarDetails(params.id)

  if (!car) {
    notFound()
  }

  return (
    <div>
      <h1>{car.brand} {car.model}</h1>
      <p>Prix: {car.price}€</p>
    </div>
  )
}
```

## client.ts - Client-Side API

### Import & Usage

```typescript
// Import du client API
import { clientGet, clientPost, clientPut, clientPatch, clientDelete } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'

// Utilisé SEULEMENT dans Client Components
'use client'

export function useCarSearch() {
  const [results, setResults] = useState([])

  const searchCars = async (query: string) => {
    try {
      const { data } = await clientGet(`/api/v1/cars/search?q=${query}`)
      setResults(data)
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  return { results, searchCars }
}
```

### TanStack Query Pattern

```typescript
// features/cars/hooks/use-cars-query.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientGet, clientPost } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'

export function useCarsQuery(filters: CarFilters) {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: async () => {
      const { data } = await clientGet(API_ENDPOINTS.CARS.LIST, {
        params: filters,
      })
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateCarMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (car: CreateCarInput) => {
      const { data } = await clientPost(API_ENDPOINTS.CARS.CREATE, car)
      return data
    },
    onSuccess: () => {
      // Invalider le cache pour rafraîchir la liste
      queryClient.invalidateQueries({ queryKey: ['cars'] })
    },
  })
}
```

## Fonctionnalités de Résilience

### Automatic Retry

`server.ts` inclut un système de retry automatique pour les requêtes qui échouent.

**Configuration:**
- **MAX_RETRIES**: 3 tentatives
- **RETRY_DELAY**: 1000ms (1 seconde)
- **Status Codes avec retry**: `408, 429, 500, 502, 503, 504`
- **Network Errors avec retry**: `TypeError`, `AbortError`

**Comportement:**
```typescript
// Exemple: Requête avec status 503 (Service Unavailable)
const { data } = await serverGet('/api/v1/users')

// Tentative 1: Échec avec 503 → Attente 1s
// Tentative 2: Échec avec 503 → Attente 2s
// Tentative 3: Échec avec 503 → Attente 4s
// Tentative 4: Échec → Erreur finale
```

### Exponential Backoff

Le délai entre les retries augmente exponentiellement pour éviter de surcharger le serveur:

```
Retry 1: 1s  (RETRY_DELAY * 2^0 = 1000ms)
Retry 2: 2s  (RETRY_DELAY * 2^1 = 2000ms)
Retry 3: 4s  (RETRY_DELAY * 2^2 = 4000ms)
```

### Timeout

Toutes les requêtes ont un timeout automatique de **30 secondes**:

```typescript
// Timeout automatique via AbortSignal
fetch(url, {
  signal: AbortSignal.timeout(30000), // 30 secondes
})
```

### Debug Logging

Toutes les requêtes sont automatiquement loggées pour faciliter le debugging:

```typescript
// Format du log:
// 🚀 API Request: GET http://localhost:8080/api/v1/users
console.log(`🚀 API Request: ${method} ${url}`, {
  endpoint,
  API_BASE_URL,
  fullUrl: url,
  hasToken: !!token,
})
```

### Error Handling

Gestion centralisée des erreurs via `throwAPIError`:

```typescript
// Erreurs automatiquement gérées:
- 401 Unauthorized → AuthenticationError
- 402 Payment Required → PaymentRequiredError
- 403 Forbidden → AuthorizationError
- 404 Not Found → NotFoundError
- 422 Unprocessable Entity → ValidationError
- 500+ Server Errors → ServerError
```

## Authentication & Cookies

### Cookie Management

```typescript
import { CookieNames, DEFAULT_COOKIE_OPTIONS, COOKIE_DURATIONS } from '@/shared/enums'
import { cookies } from 'next/headers'

// Setting auth cookie (Server Actions uniquement)
const cookieStore = await cookies()
cookieStore.set(CookieNames.ACCESS_TOKEN, token, {
  ...DEFAULT_COOKIE_OPTIONS,
  maxAge: COOKIE_DURATIONS.ACCESS_TOKEN, // 1h50 (6600s)
})

// Getting auth token (Server Components/Actions)
const token = cookieStore.get(CookieNames.ACCESS_TOKEN)?.value

// Note: CookieNames.ACCESS_TOKEN = 'iautos_ssid'
```

### Authentication Flow

```typescript
// features/auth/lib/auth-actions.ts
'use server'

import { actionClient } from '@/shared/lib/safe-action'
import { serverPost } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'
import { CookieNames, DEFAULT_COOKIE_OPTIONS, COOKIE_DURATIONS } from '@/shared/enums'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    // 1. Appeler le backend via serverPost
    const { data } = await serverPost(API_ENDPOINTS.AUTH.LOGIN, parsedInput)

    // 2. Définir le cookie httpOnly
    const cookieStore = await cookies()
    cookieStore.set(CookieNames.ACCESS_TOKEN, data.access_token, {
      ...DEFAULT_COOKIE_OPTIONS,
      maxAge: data.expires_in,
    })

    // 3. Revalidate paths
    revalidatePath('/account')
    revalidatePath('/')

    return { success: true, user: data.user }
  })

export const logoutAction = actionClient.action(async () => {
  // Supprimer le cookie
  const cookieStore = await cookies()
  cookieStore.delete(CookieNames.ACCESS_TOKEN)

  // Revalidate paths
  revalidatePath('/', 'layout')

  return { success: true }
})
```

## Exemples Complets

### Exemple 1: CRUD Announcements

```typescript
// features/announcements/lib/announcement-api.ts
'use server'

import { serverGet, serverPost, serverPut, serverDelete } from '@/shared/lib/api/server'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'
import { revalidatePath } from 'next/cache'

type Announcement = {
  id: string
  title: string
  description: string
  price: number
  status: 'draft' | 'published' | 'sold'
}

export const announcementAPI = {
  // GET - Lister toutes les annonces
  async list(filters?: Record<string, unknown>) {
    try {
      const { data } = await serverGet<Announcement[]>(API_ENDPOINTS.ANNOUNCEMENTS.LIST, {
        params: filters,
      })
      return data
    } catch (error) {
      console.error('List announcements error:', error)
      return []
    }
  },

  // GET - Détails d'une annonce
  async getById(id: string) {
    try {
      const { data } = await serverGet<Announcement>(`${API_ENDPOINTS.ANNOUNCEMENTS.DETAIL}/${id}`)
      return data
    } catch (error) {
      console.error('Get announcement error:', error)
      return null
    }
  },

  // POST - Créer une annonce
  async create(announcement: Omit<Announcement, 'id'>) {
    try {
      const { data } = await serverPost<Announcement>(API_ENDPOINTS.ANNOUNCEMENTS.CREATE, announcement)
      revalidatePath('/account/private/annonces')
      return { success: true, data }
    } catch (error) {
      console.error('Create announcement error:', error)
      return { success: false, error: 'Erreur lors de la création' }
    }
  },

  // PUT - Mettre à jour une annonce (complète)
  async update(id: string, announcement: Announcement) {
    try {
      const { data } = await serverPut<Announcement>(`/api/v1/announcements/${id}`, announcement)
      revalidatePath(`/annonce/${id}`)
      revalidatePath('/account/private/annonces')
      return { success: true, data }
    } catch (error) {
      console.error('Update announcement error:', error)
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }
  },

  // PATCH - Mise à jour partielle
  async patch(id: string, updates: Partial<Announcement>) {
    try {
      const { data } = await serverPatch<Announcement>(`/api/v1/announcements/${id}`, updates)
      revalidatePath(`/annonce/${id}`)
      return { success: true, data }
    } catch (error) {
      console.error('Patch announcement error:', error)
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }
  },

  // DELETE - Supprimer une annonce
  async delete(id: string) {
    try {
      await serverDelete(`/api/v1/announcements/${id}`)
      revalidatePath('/account/private/annonces')
      return { success: true }
    } catch (error) {
      console.error('Delete announcement error:', error)
      return { success: false, error: 'Erreur lors de la suppression' }
    }
  },
}
```

### Exemple 2: User Profile avec TanStack Query

```typescript
// features/user/hooks/use-user-profile.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientGet, clientPatch } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'

type UserProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const { data } = await clientGet<UserProfile>(API_ENDPOINTS.USER.PROFILE)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const { data } = await clientPatch<UserProfile>(API_ENDPOINTS.USER.PROFILE, updates)
      return data
    },
    onSuccess: (data) => {
      // Update cache optimistically
      queryClient.setQueryData(['user', 'profile'], data)
    },
  })
}

// Usage dans un composant
export function ProfileForm() {
  const { data: profile, isLoading } = useUserProfile()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const handleSubmit = (formData: Partial<UserProfile>) => {
    updateProfile(formData, {
      onSuccess: () => {
        toast.success('Profil mis à jour')
      },
      onError: (error) => {
        toast.error('Erreur lors de la mise à jour')
      },
    })
  }

  if (isLoading) return <Skeleton />

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

## Best Practices

### ✅ DO

1. **Toujours utiliser server.ts dans Server Components/Actions**
   ```typescript
   // ✅ CORRECT
   import { serverGet } from '@/shared/lib/api/server'
   const { data } = await serverGet('/api/v1/users')
   ```

2. **Utiliser les constantes API_ENDPOINTS**
   ```typescript
   // ✅ CORRECT
   import { API_ENDPOINTS } from '@/shared/lib/constants/api-endpoints'
   const { data } = await serverGet(API_ENDPOINTS.USER.PROFILE)
   ```

3. **Typer les réponses API**
   ```typescript
   // ✅ CORRECT
   const { data } = await serverGet<User>(API_ENDPOINTS.USER.PROFILE)
   ```

4. **Gérer les erreurs avec try/catch**
   ```typescript
   // ✅ CORRECT
   try {
     const { data } = await serverPost('/api/v1/cars', car)
     return { success: true, data }
   } catch (error) {
     console.error('API error:', error)
     return { success: false, error: 'Message clair pour l\'utilisateur' }
   }
   ```

5. **Revalidate après mutations**
   ```typescript
   // ✅ CORRECT
   await serverPost('/api/v1/cars', car)
   revalidatePath('/cars')
   revalidatePath('/account/private/annonces')
   ```

### ❌ DON'T

1. **Jamais de fetch() direct**
   ```typescript
   // ❌ INTERDIT
   const response = await fetch('http://localhost:8080/api/v1/users', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   ```

2. **Ne pas mélanger server.ts et client.ts**
   ```typescript
   // ❌ INTERDIT - clientAPI dans Server Action
   'use server'
   import { clientGet } from '@/shared/lib/api/client'
   const { data } = await clientGet('/api/v1/users') // ERREUR
   ```

3. **Ne pas ignorer les erreurs**
   ```typescript
   // ❌ INTERDIT
   const { data } = await serverGet('/api/v1/users') // Sans try/catch
   ```

4. **Ne pas créer d'API Routes pour les opérations métier**
   ```typescript
   // ❌ INTERDIT - API Route inutile
   // app/api/users/route.ts
   export async function GET() {
     // Utiliser Server Actions à la place
   }
   ```

5. **Ne pas oublier de revalider après mutations**
   ```typescript
   // ❌ INTERDIT
   await serverPost('/api/v1/cars', car)
   // Oublier revalidatePath() → cache stale
   ```

### Performance Tips

1. **Cache Strategy pour Server Components**
   ```typescript
   // Static - mise en cache permanente
   const { data } = await serverGet('/api/v1/categories', {
     cache: 'force-cache',
   })

   // ISR - revalidation périodique
   const { data } = await serverGet('/api/v1/cars', {
     next: { revalidate: 3600 }, // 1 heure
   })

   // No cache - toujours frais
   const { data } = await serverGet('/api/v1/users/me', {
     cache: 'no-store',
   })
   ```

2. **Prefetch avec TanStack Query**
   ```typescript
   // Server Component - prefetch
   export default async function Page() {
     const queryClient = new QueryClient()

     await queryClient.prefetchQuery({
       queryKey: ['cars'],
       queryFn: () => serverGet('/api/v1/cars'),
     })

     return (
       <HydrationBoundary state={dehydrate(queryClient)}>
         <CarList />
       </HydrationBoundary>
     )
   }
   ```

3. **Optimistic Updates**
   ```typescript
   const mutation = useMutation({
     mutationFn: updateCar,
     onMutate: async (newCar) => {
       await queryClient.cancelQueries({ queryKey: ['cars'] })
       const previous = queryClient.getQueryData(['cars'])

       // Optimistic update
       queryClient.setQueryData(['cars'], (old) =>
         old.map(car => car.id === newCar.id ? newCar : car)
       )

       return { previous }
     },
     onError: (err, newCar, context) => {
       // Rollback on error
       queryClient.setQueryData(['cars'], context.previous)
     },
   })
   ```

## Troubleshooting

### Erreur: "Token not found"

**Cause**: Cookie d'authentification absent ou expiré

**Solution**:
```typescript
// Vérifier que l'utilisateur est authentifié avant l'appel API
const cookieStore = await cookies()
const token = cookieStore.get(CookieNames.ACCESS_TOKEN)?.value

if (!token) {
  redirect('/connexion')
}
```

### Erreur: "Network Error"

**Cause**: Backend inaccessible ou timeout

**Solution**:
- Vérifier que le backend est démarré (port 8080)
- Vérifier `NEXT_PUBLIC_API_BASE_URL` dans `.env.local`
- Le retry automatique gère déjà les erreurs réseau temporaires

### Erreur: "CORS Error"

**Cause**: Origin non autorisé par le backend

**Solution**:
- Vérifier que `NEXT_PUBLIC_ORIGIN` est configuré
- Vérifier la configuration CORS du backend Symfony

## 🔗 Ressources

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [TanStack Query](https://tanstack.com/query/latest)
- [next-safe-action](https://next-safe-action.dev)
- [Zod](https://zod.dev)
