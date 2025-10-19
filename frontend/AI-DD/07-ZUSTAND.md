# Zustand - State Management 2025

## 🎯 Setup

```bash
pnpm add zustand
```

## ⚠️ RÈGLE CRITIQUE Next.js

**PAS de store global partagé entre requêtes!**

```typescript
// ❌ INCORRECT - Global store (dangereux en SSR)
export const useStore = create((set) => ({ count: 0 }))

// ✅ CORRECT - Per-request store OU client-only
'use client' // Toujours 'use client' pour Zustand
export const useStore = create((set) => ({ count: 0 }))
```

## 📦 Exemples iAutos

### Filters Store (Client State)

```typescript
// features/cars/stores/filters-store.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CarFilters = {
  brand?: string
  model?: string
  minPrice: number
  maxPrice: number
  fuelTypes: string[]
  minYear: number
  maxYear: number
}

type FiltersStore = {
  filters: CarFilters
  setFilter: <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => void
  resetFilters: () => void
  applyFilters: () => void
}

const defaultFilters: CarFilters = {
  minPrice: 0,
  maxPrice: 100000,
  fuelTypes: [],
  minYear: 2000,
  maxYear: new Date().getFullYear(),
}

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set, get) => ({
      filters: defaultFilters,

      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      resetFilters: () =>
        set({ filters: defaultFilters }),

      applyFilters: () => {
        const { filters } = get()
        // Trigger refetch with new filters
        console.log('Applying filters:', filters)
      },
    }),
    {
      name: 'car-filters-storage', // LocalStorage key
      partialize: (state) => ({ filters: state.filters }), // Only persist filters
    }
  )
)

// Usage
'use client'
export function CarFilters() {
  const { filters, setFilter, resetFilters } = useFiltersStore()

  return (
    <div>
      <Select
        value={filters.brand}
        onValueChange={(value) => setFilter('brand', value)}
      >
        {/* Options */}
      </Select>

      <Button onClick={resetFilters}>Réinitialiser</Button>
    </div>
  )
}
```

### Auth Store

```typescript
// features/auth/stores/auth-store.ts
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

type AuthStore = {
  state: AuthState
  setState: (state: AuthState) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      state: 'loading',
      setState: (state) => set({ state }),
    }),
    {
      name: 'auth-state',
      storage: createJSONStorage(() => sessionStorage), // Session storage
    }
  )
)

// User Store
type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'dealer' | 'user'
}

type UserStore = {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-data',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Combined hook
export function useAuth() {
  const { state, setState } = useAuthStore()
  const { user, setUser, clearUser } = useUserStore()

  const login = async (credentials: LoginCredentials) => {
    setState('loading')
    try {
      const user = await loginAPI(credentials)
      setUser(user)
      setState('authenticated')
    } catch {
      setState('unauthenticated')
      throw new Error('Login failed')
    }
  }

  const logout = async () => {
    await logoutAPI()
    clearUser()
    setState('unauthenticated')
  }

  return {
    state,
    user,
    isAuthenticated: state === 'authenticated',
    isLoading: state === 'loading',
    login,
    logout,
  }
}
```

### UI State Store

```typescript
// shared/stores/ui-store.ts
'use client'

import { create } from 'zustand'

type Modal = {
  type: 'car-details' | 'create-annonce' | 'login' | null
  props?: any
}

type UIStore = {
  modal: Modal
  openModal: (type: Modal['type'], props?: any) => void
  closeModal: () => void
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  modal: { type: null },
  openModal: (type, props) => set({ modal: { type, props } }),
  closeModal: () => set({ modal: { type: null } }),

  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))

// Usage
function CarCard({ car }: { car: Car }) {
  const { openModal } = useUIStore()

  return (
    <Card onClick={() => openModal('car-details', { carId: car.id })}>
      {/* ... */}
    </Card>
  )
}

function ModalContainer() {
  const { modal, closeModal } = useUIStore()

  return (
    <Dialog open={modal.type !== null} onOpenChange={closeModal}>
      {modal.type === 'car-details' && <CarDetailsModal {...modal.props} />}
      {modal.type === 'login' && <LoginModal />}
    </Dialog>
  )
}
```

### Slice Pattern (Large Stores)

```typescript
// features/cars/stores/cars-store.ts
'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Slices
type FiltersSlice = {
  filters: CarFilters
  setFilter: (key: string, value: any) => void
  resetFilters: () => void
}

type SortSlice = {
  sortBy: 'price' | 'year' | 'mileage'
  sortOrder: 'asc' | 'desc'
  setSortBy: (sortBy: SortSlice['sortBy']) => void
  toggleSortOrder: () => void
}

type ViewSlice = {
  view: 'grid' | 'list'
  setView: (view: ViewSlice['view']) => void
}

// Creators
const createFiltersSlice: StateCreator<FiltersSlice> = (set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
})

const createSortSlice: StateCreator<SortSlice> = (set) => ({
  sortBy: 'price',
  sortOrder: 'asc',
  setSortBy: (sortBy) => set({ sortBy }),
  toggleSortOrder: () =>
    set((state) => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),
})

const createViewSlice: StateCreator<ViewSlice> = (set) => ({
  view: 'grid',
  setView: (view) => set({ view }),
})

// Combined store
export const useCarsStore = create<FiltersSlice & SortSlice & ViewSlice>()(
  devtools((...args) => ({
    ...createFiltersSlice(...args),
    ...createSortSlice(...args),
    ...createViewSlice(...args),
  }))
)
```

### Immer Middleware (Immutability)

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

type CarStore = {
  cars: Car[]
  addCar: (car: Car) => void
  updateCar: (id: string, updates: Partial<Car>) => void
  removeCar: (id: string) => void
}

export const useCarStore = create<CarStore>()(
  immer((set) => ({
    cars: [],

    addCar: (car) =>
      set((state) => {
        state.cars.push(car) // Direct mutation with Immer!
      }),

    updateCar: (id, updates) =>
      set((state) => {
        const car = state.cars.find((c) => c.id === id)
        if (car) {
          Object.assign(car, updates) // Direct mutation
        }
      }),

    removeCar: (id) =>
      set((state) => {
        const index = state.cars.findIndex((c) => c.id === id)
        if (index !== -1) {
          state.cars.splice(index, 1) // Direct mutation
        }
      }),
  }))
)
```

## 🎯 Best Practices 2025

### Selector Pattern (Performance)
```typescript
// ❌ Re-render on ANY state change
const { filters, sortBy, view } = useCarsStore()

// ✅ Re-render only when specific value changes
const filters = useCarsStore((state) => state.filters)
const sortBy = useCarsStore((state) => state.sortBy)
const view = useCarsStore((state) => state.view)

// ✅ Shallow equality for objects
const filtersAndSort = useCarsStore(
  (state) => ({ filters: state.filters, sortBy: state.sortBy }),
  shallow
)
```

### Actions Outside Components
```typescript
// stores/filters-store.ts
export const resetAllFilters = () => {
  useFiltersStore.getState().resetFilters()
}

// Anywhere
import { resetAllFilters } from '@/stores/filters-store'
resetAllFilters()
```

### TypeScript Best Practices
```typescript
// ✅ Type-safe store
type Store = {
  count: number
  increase: (by: number) => void
}

const useStore = create<Store>()((set) => ({
  count: 0,
  increase: (by) => set((state) => ({ count: state.count + by })),
}))

// ✅ Inferred types
const count = useStore((state) => state.count) // number
const increase = useStore((state) => state.increase) // (by: number) => void
```

### DevTools Integration
```typescript
import { devtools } from 'zustand/middleware'

export const useStore = create<Store>()(
  devtools(
    (set) => ({
      // ... store
    }),
    { name: 'CarsStore' } // Name in Redux DevTools
  )
)
```

## 🔗 Resources

- [Zustand Docs](https://zustand.docs.pmnd.rs)
- [Next.js Integration](https://zustand.docs.pmnd.rs/guides/nextjs)
- [TypeScript Guide](https://zustand.docs.pmnd.rs/guides/typescript)
