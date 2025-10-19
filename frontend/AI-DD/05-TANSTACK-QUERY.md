# TanStack Query v5 + Next.js 15 - Guide complet 2025

## 🎯 Setup

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

```typescript
// shared/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 min (important pour SSR!)
        gcTime: 5 * 60 * 1000, // 5 min (anciennement cacheTime)
      },
    },
  })
}

// app/layout.tsx
'use client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { makeQueryClient } from '@/shared/lib/query-client'

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    return makeQueryClient() // Server: always new
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient() // Browser: singleton
    return browserQueryClient
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

## 📦 Exemples iAutos

### Basic Query - useCars

```typescript
// features/cars/hooks/use-cars.ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { clientAPI } from '@/shared/lib/api'
import type { Car, CarFilters } from '../types'

export function useCars(filters?: CarFilters) {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: async () => {
      const { data } = await clientAPI.get<Car[]>('/cars', { query: filters })
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 min
  })
}

// Usage
function CarList() {
  const { data: cars, isLoading, error } = useCars({ brand: 'peugeot' })

  if (isLoading) return <CarListSkeleton />
  if (error) return <ErrorState error={error} />
  return <div>{cars.map(car => <CarCard key={car.id} car={car} />)}</div>
}
```

### Prefetching pour Performance

```typescript
// app/(catalog)/acheter/page.tsx - Server Component
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { serverAPI } from '@/shared/lib/api'
import { CarList } from '@/features/cars'

export default async function AcheterPage() {
  const queryClient = new QueryClient()

  // Prefetch on server
  await queryClient.prefetchQuery({
    queryKey: ['cars'],
    queryFn: async () => {
      const { data } = await serverGet('/cars')
      return data
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CarList /> {/* Déjà hydraté avec data! */}
    </HydrationBoundary>
  )
}
```

### Mutations - Create/Update/Delete

```typescript
// features/cars/hooks/use-car-mutations.ts
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientAPI } from '@/shared/lib/api'
import { toast } from 'sonner'
import type { Car } from '../types'

export function useCreateCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCarInput) => {
      const { data: car } = await clientAPI.post<Car>('/cars', data)
      return car
    },
    onSuccess: (newCar) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Annonce créée!')
    },
    onError: (error) => {
      toast.error('Erreur:', { description: error.message })
    },
  })
}

export function useUpdateCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCarInput }) => {
      const { data: car } = await clientAPI.put<Car>(`/cars/${id}`, data)
      return car
    },
    onSuccess: (updatedCar) => {
      // Update cache directly
      queryClient.setQueryData(['car', updatedCar.id], updatedCar)
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Annonce mise à jour!')
    },
  })
}

export function useDeleteCar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await clientAPI.delete(`/cars/${id}`)
      return id
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.setQueryData(['cars'], (old: Car[] | undefined) =>
        old?.filter(car => car.id !== deletedId)
      )
      toast.success('Annonce supprimée')
    },
  })
}

// Usage
function CarActions({ car }: { car: Car }) {
  const updateCar = useUpdateCar()
  const deleteCar = useDeleteCar()

  return (
    <>
      <Button
        onClick={() => updateCar.mutate({ id: car.id, data: { price: 25000 } })}
        disabled={updateCar.isPending}
      >
        {updateCar.isPending ? 'Mise à jour...' : 'Modifier'}
      </Button>
      <Button
        onClick={() => deleteCar.mutate(car.id)}
        disabled={deleteCar.isPending}
        variant="destructive"
      >
        {deleteCar.isPending ? 'Suppression...' : 'Supprimer'}
      </Button>
    </>
  )
}
```

### Optimistic Updates

```typescript
// features/cars/hooks/use-optimistic-like.ts
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (carId: string) => {
      const { data } = await clientAPI.post(`/cars/${carId}/favorite`)
      return data
    },
    // Optimistic update
    onMutate: async (carId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['car', carId] })

      // Snapshot previous value
      const previous = queryClient.getQueryData(['car', carId])

      // Optimistically update
      queryClient.setQueryData(['car', carId], (old: Car | undefined) =>
        old ? { ...old, isFavorite: !old.isFavorite } : old
      )

      return { previous }
    },
    onError: (err, carId, context) => {
      // Rollback on error
      queryClient.setQueryData(['car', carId], context?.previous)
      toast.error('Erreur lors de la mise en favori')
    },
    onSettled: (data, error, carId) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['car', carId] })
    },
  })
}
```

### Infinite Scroll

```typescript
// features/cars/hooks/use-infinite-cars.ts
export function useInfiniteCars(filters?: CarFilters) {
  return useInfiniteQuery({
    queryKey: ['cars', 'infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { data } = await clientAPI.get<PaginatedResponse<Car>>('/cars', {
        query: { ...filters, page: pageParam, limit: 20 }
      })
      return data
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
  })
}

// Usage
function InfiniteCarList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCars()

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.items.map(car => <CarCard key={car.id} car={car} />)}
        </div>
      ))}

      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Chargement...' : 'Charger plus'}
        </Button>
      )}
    </div>
  )
}
```

### Integration avec Server Actions

```typescript
// features/cars/lib/actions.ts
'use server'
import { createSafeAction } from '@/shared/lib/safe-action'
import { carSchema } from './validations'

export const createCarAction = createSafeAction(carSchema, async (data) => {
  const car = await db.car.create({ data })
  return { car }
})

// Client component
'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCarAction } from '../lib/actions'

export function useCreateCarWithAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CarInput) => {
      const result = await createCarAction(data)
      if (!result.success) throw new Error(result.error)
      return result.data.car
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success('Annonce créée!')
    },
  })
}
```

## 🎯 Best Practices 2025

### Query Keys Strategy
```typescript
// features/cars/lib/query-keys.ts
export const carKeys = {
  all: ['cars'] as const,
  lists: () => [...carKeys.all, 'list'] as const,
  list: (filters: CarFilters) => [...carKeys.lists(), filters] as const,
  details: () => [...carKeys.all, 'detail'] as const,
  detail: (id: string) => [...carKeys.details(), id] as const,
}

// Usage
useQuery({ queryKey: carKeys.detail(id), ... })
queryClient.invalidateQueries({ queryKey: carKeys.lists() })
```

### Error Handling
```typescript
const { data, error, isError } = useCars()

if (isError) {
  if (error instanceof APIError) {
    if (error.status === 404) return <NotFound />
    if (error.status === 401) return <Unauthorized />
  }
  return <ErrorState error={error} />
}
```

### Loading States
```typescript
const { data, isLoading, isFetching, isRefetching } = useCars()

if (isLoading) return <Skeleton />
return (
  <div>
    {isFetching && <LoadingIndicator />}
    <CarList cars={data} />
  </div>
)
```

### Dependent Queries
```typescript
// Fetch car details, then owner info
const { data: car } = useCar(carId)

const { data: owner } = useQuery({
  queryKey: ['user', car?.ownerId],
  queryFn: () => fetchUser(car!.ownerId),
  enabled: !!car?.ownerId, // Only run if car exists
})
```

## 🔗 Resources

- [TanStack Query v5 Docs](https://tanstack.com/query/latest)
- [Next.js Integration](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Migration v4→v5](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)
