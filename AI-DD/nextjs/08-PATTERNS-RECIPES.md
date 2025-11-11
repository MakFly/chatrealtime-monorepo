# Patterns & Recipes - Features complètes iAutos

## 🎯 Patterns combinés avec toutes les technologies

### Pattern: CRUD complet pour Cars

```typescript
// 1. Types (features/cars/types/index.ts)
export type Car = {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  fuelType: 'Essence' | 'Diesel' | 'Électrique' | 'Hybride'
  description?: string
  images: string[]
  userId: string
  createdAt: string
  updatedAt: string
}

export type CreateCarInput = Omit<Car, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
export type UpdateCarInput = Partial<CreateCarInput>

// 2. Validation (features/cars/lib/validations.ts)
import { z } from 'zod'

export const carSchema = z.object({
  brand: z.string().min(2, 'Marque requise'),
  model: z.string().min(1, 'Modèle requis'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().min(0),
  mileage: z.number().min(0),
  fuelType: z.enum(['Essence', 'Diesel', 'Électrique', 'Hybride']),
  description: z.string().optional(),
  images: z.array(z.string()).min(1, 'Au moins une image'),
})

// 3. Server Actions (features/cars/lib/actions.ts)
'use server'
import { authActionClient } from '@/shared/lib/safe-action'
import { revalidatePath } from 'next/cache'

export const createCarAction = authActionClient
  .schema(carSchema)
  .action(async ({ parsedInput, ctx }) => {
    const car = await db.car.create({
      data: { ...parsedInput, userId: ctx.user.id }
    })
    revalidatePath('/acheter')
    return { car }
  })

export const updateCarAction = authActionClient
  .schema(z.object({ id: z.string(), data: carSchema.partial() }))
  .action(async ({ parsedInput, ctx }) => {
    const car = await db.car.update({
      where: { id: parsedInput.id, userId: ctx.user.id },
      data: parsedInput.data,
    })
    revalidatePath(`/vehicle/${car.id}`)
    return { car }
  })

export const deleteCarAction = authActionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    await db.car.delete({
      where: { id: parsedInput.id, userId: ctx.user.id }
    })
    revalidatePath('/acheter')
    return { success: true }
  })

// 4. Hooks (features/cars/hooks/use-cars.ts)
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAction } from 'next-safe-action/hooks'
import { createCarAction, updateCarAction, deleteCarAction } from '../lib/actions'

export function useCars(filters?: CarFilters) {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: () => clientAPI.get<Car[]>('/cars', { query: filters }),
  })
}

export function useCreateCar() {
  const queryClient = useQueryClient()
  const { execute, status } = useAction(createCarAction, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cars'] }),
  })
  return { execute, status }
}

// 5. Components (features/cars/components/CreateCarForm.tsx)
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/shared/components/ui/form'
import { useCreateCar } from '../hooks/use-cars'

export function CreateCarForm() {
  const form = useForm({ resolver: zodResolver(carSchema) })
  const { execute, status } = useCreateCar()

  const onSubmit = form.handleSubmit((data) => {
    execute(data)
  })

  return <Form {...form}><form onSubmit={onSubmit}>{/* Fields */}</form></Form>
}

// 6. Page (app/creer-annonce/page.tsx)
import { CreateCarForm } from '@/features/cars'

export default function CreateAnnoncePage() {
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Créer une annonce</h1>
      <CreateCarForm />
    </div>
  )
}
```

### Pattern: Search + Filters + Infinite Scroll

```typescript
// 1. Filters Store (features/cars/stores/filters-store.ts)
'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    { name: 'car-filters' }
  )
)

// 2. Infinite Query Hook
export function useInfiniteCars() {
  const filters = useFiltersStore((state) => state.filters)

  return useInfiniteQuery({
    queryKey: ['cars', 'infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      clientAPI.get<PaginatedResponse<Car>>('/cars', {
        query: { ...filters, page: pageParam }
      }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  })
}

// 3. Search Component
'use client'
export function CarSearch() {
  const { filters, setFilter } = useFiltersStore()
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCars()

  return (
    <div className="flex gap-4">
      {/* Filters Sidebar */}
      <aside className="w-64">
        <CarFilters />
      </aside>

      {/* Results */}
      <main className="flex-1">
        {data?.pages.map((page) =>
          page.items.map((car) => <CarCard key={car.id} car={car} />)
        )}

        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
          </Button>
        )}
      </main>
    </div>
  )
}
```

### Pattern: Authentication Flow Complete

```typescript
// 1. Server Actions (features/auth/lib/actions.ts)
'use server'
import { actionClient } from '@/shared/lib/safe-action'
import { cookies } from 'next/headers'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const user = await authenticate(parsedInput.email, parsedInput.password)
    const token = await createSession(user)

    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
    })

    return { user }
  })

export const logoutAction = actionClient.action(async () => {
  cookies().delete('auth_token')
  return { success: true }
})

// 2. Auth Hook (features/auth/hooks/use-auth.ts)
'use client'
import { useAuthStore, useUserStore } from '../stores'
import { useAction } from 'next-safe-action/hooks'
import { loginAction, logoutAction } from '../lib/actions'

export function useAuth() {
  const { state, setState } = useAuthStore()
  const { user, setUser, clearUser } = useUserStore()

  const { execute: executeLogin } = useAction(loginAction, {
    onSuccess: ({ data }) => {
      setUser(data.user)
      setState('authenticated')
    },
  })

  const { execute: executeLogout } = useAction(logoutAction, {
    onSuccess: () => {
      clearUser()
      setState('unauthenticated')
    },
  })

  return {
    user,
    state,
    isAuthenticated: state === 'authenticated',
    login: executeLogin,
    logout: executeLogout,
  }
}

// 3. Login Form
'use client'
export function LoginForm() {
  const form = useForm({ resolver: zodResolver(loginSchema) })
  const { login } = useAuth()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => login(data))}>
        <FormField name="email" label="Email" />
        <FormField name="password" label="Mot de passe" type="password" />
        <Button type="submit">Se connecter</Button>
      </form>
    </Form>
  )
}

// 4. Auth Provider (features/auth/components/AuthProvider.tsx)
'use client'
import { useEffect } from 'react'
import { useAuth } from '../hooks/use-auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { state, setState, setUser } = useAuth()

  useEffect(() => {
    // Check auth status on mount
    const checkAuth = async () => {
      try {
        const { data } = await clientAPI.get('/auth/status')
        setUser(data.user)
        setState('authenticated')
      } catch {
        setState('unauthenticated')
      }
    }

    if (state === 'loading') checkAuth()
  }, [state])

  return <>{children}</>
}

// 5. Protected Route (middleware.ts)
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')

  if (!token && request.nextUrl.pathname.startsWith('/account/private')) {
    return NextResponse.redirect(new URL('/connexion', request.url))
  }

  return NextResponse.next()
}
```

### Pattern: Form avec Upload Images

```typescript
// 1. Upload Action
'use server'
export const uploadImageAction = authActionClient
  .schema(z.object({ file: z.instanceof(File) }))
  .action(async ({ parsedInput }) => {
    const url = await uploadToMinIO(parsedInput.file)
    return { url }
  })

// 2. Form Component
'use client'
export function CreateCarWithImages() {
  const form = useForm({ resolver: zodResolver(carSchema) })
  const [images, setImages] = useState<string[]>([])
  const { execute: uploadImage } = useAction(uploadImageAction)
  const { execute: createCar } = useCreateCar()

  const handleImageUpload = async (file: File) => {
    const result = await uploadImage({ file })
    if (result.data) {
      setImages((prev) => [...prev, result.data.url])
    }
  }

  const onSubmit = form.handleSubmit((data) => {
    createCar({ ...data, images })
  })

  return (
    <form onSubmit={onSubmit}>
      <ImageUpload onUpload={handleImageUpload} />
      <div className="grid grid-cols-4 gap-2">
        {images.map((url) => (
          <img key={url} src={url} className="w-full h-32 object-cover rounded" />
        ))}
      </div>
      {/* Other fields */}
      <Button type="submit">Créer</Button>
    </form>
  )
}
```

## ⚡ Quick Templates

### New Feature Checklist
```bash
# 1. Create feature structure
mkdir -p features/my-feature/{components,hooks,lib,stores,types}
touch features/my-feature/index.ts

# 2. Define types
# features/my-feature/types/index.ts

# 3. Create validation schemas
# features/my-feature/lib/validations.ts (Zod)

# 4. Create server actions
# features/my-feature/lib/actions.ts

# 5. Create hooks
# features/my-feature/hooks/use-my-feature.ts

# 6. Create components
# features/my-feature/components/MyComponent.tsx

# 7. Export public API
# features/my-feature/index.ts
```

### Performance Optimization Pattern
```typescript
// 1. Code splitting
const HeavyComponent = dynamic(() => import('./Heavy'), { ssr: false })

// 2. Memoization
const MemoCard = memo(ExpensiveCard)

// 3. Optimistic updates
const { execute } = useOptimisticAction(action, {
  currentState: { liked: false },
  updateFn: (state) => ({ liked: !state.liked }),
})

// 4. Prefetching
await queryClient.prefetchQuery({ queryKey: ['data'] })

// 5. Debouncing
const debouncedSearch = useDebounce(searchTerm, 300)
```

## 🔗 Tous les patterns ensemble

Pour une feature complète, combiner:
1. **Types** (TypeScript + Zod)
2. **Actions** (next-safe-action)
3. **Data** (TanStack Query)
4. **State** (Zustand si nécessaire)
5. **UI** (Shadcn/UI + React Hook Form)
6. **Routes** (Next.js App Router)

**= Feature production-ready!** 🚀
