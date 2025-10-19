# Clean Architecture - Feature-First Organization

## 🎯 Objectif

Architecture feature-first pour un code organisé, maintenable et scalable.

## 🏗️ Principes

### 1. Feature-First Organization

**Code organisé par domaine métier, pas par type technique**

```
✅ CORRECT - Feature-first
features/cars/
  ├── components/
  ├── hooks/
  ├── lib/
  ├── stores/
  └── index.ts

❌ INCORRECT - Type-first
components/cars/
hooks/cars/
lib/cars/
stores/cars/
```

### 2. Vertical Slicing

Chaque feature contient TOUT ce dont elle a besoin:
- Components
- Hooks
- Business logic
- State management
- Types

### 3. Clear Boundaries

```typescript
// Features can import from shared
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

// Features can import from other features (public API only)
import { useAuth } from '@/features/auth'
import type { Car } from '@/features/cars'

// ❌ Features CANNOT import feature internals
import { CarCardInternal } from '@/features/cars/components/CarCard/Internal'
```

## 📁 Structure

### Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   ├── (account)/
│   ├── (catalog)/
│   └── layout.tsx
│
├── features/               # Business features
│   ├── auth/
│   ├── cars/
│   ├── create-annonce/
│   ├── user/
│   ├── dealer/
│   └── payments/
│
├── shared/                 # Shared kernel
│   ├── components/
│   │   ├── ui/            # Shadcn/UI
│   │   ├── layout/        # Navbar, Footer
│   │   └── common/        # Generic components
│   ├── hooks/             # Generic hooks
│   ├── lib/               # Utilities, API, config
│   └── stores/            # Global stores (theme, etc.)
│
├── middleware.ts
└── [config files]
```

### Feature Structure

```
features/[name]/
├── components/             # React components
│   ├── ComponentA/
│   │   ├── index.tsx
│   │   ├── ComponentA.test.tsx
│   │   └── types.ts
│   └── index.ts           # Barrel export
│
├── hooks/                  # Custom hooks
│   ├── use-feature.ts
│   └── index.ts
│
├── lib/                    # Business logic
│   ├── api.ts             # API calls
│   ├── utils.ts           # Feature utilities
│   ├── validations.ts     # Zod schemas
│   └── index.ts
│
├── stores/                 # Zustand stores
│   ├── feature-store.ts
│   └── index.ts
│
├── types/                  # TypeScript types
│   ├── index.ts
│   └── [domain].ts
│
└── index.ts                # Public API (barrel export)
```

## 🎯 Feature Public API

### Barrel Exports (index.ts)

**Chaque feature doit définir son API publique**

```typescript
// features/cars/index.ts

// Components (sélection intentionnelle)
export { CarCard } from './components/CarCard'
export { CarDetails } from './components/CarDetails'
export { CarList } from './components/CarList'
export { CarFilters } from './components/CarFilters'

// Hooks (public hooks uniquement)
export { useCars } from './hooks/use-cars'
export { useCarDetails } from './hooks/use-car-details'
export { useCarFilters } from './hooks/use-car-filters'

// Types (types publics uniquement)
export type {
  Car,
  CarFilters,
  CarListResponse,
  CarBrand,
  CarModel,
} from './types'

// Utils (seulement ce qui doit être public)
export { formatCarPrice, getCarImageUrl } from './lib/utils'
export { CAR_FUEL_TYPES, CAR_TRANSMISSIONS } from './lib/constants'

// ❌ NE PAS EXPORTER les internals
// export { InternalHelper } from './lib/internal'
// export { useCarStoreInternal } from './stores/internal-store'
```

### Import Rules

```typescript
// ✅ CORRECT - Public API
import { CarCard, useCars, type Car } from '@/features/cars'

// ❌ INCORRECT - Internal import
import { CarCard } from '@/features/cars/components/CarCard'
import { useCarsStore } from '@/features/cars/stores/cars-store'
```

## 🔗 Dependencies

### Dependency Rules

```
app/ → features/ → shared/
     ↘ shared/

features/[A]/ → features/[B]/ (via public API)
              → shared/

shared/ → ❌ features/ (INTERDIT)
```

### Exemples

```typescript
// ✅ App → Feature
// app/catalog/page.tsx
import { CarList } from '@/features/cars'

// ✅ Feature → Shared
// features/cars/components/CarCard.tsx
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

// ✅ Feature → Feature (public API)
// features/cars/lib/api.ts
import { useAuth } from '@/features/auth'

// ❌ Shared → Feature (INTERDIT)
// shared/components/layout/Navbar.tsx
import { useCars } from '@/features/cars' // ❌ VIOLATION
```

## 🎨 Feature Examples

### Example: Cars Feature

```typescript
// features/cars/index.ts
export { CarCard } from './components/CarCard'
export { useCars } from './hooks/use-cars'
export type { Car, CarFilters } from './types'

// features/cars/components/CarCard/index.tsx
import type { Car } from '../../types'
import { formatCarPrice } from '../../lib/utils'
import { Button } from '@/shared/components/ui'

type CarCardProps = {
  car: Car
  onSelect?: (car: Car) => void
}

export function CarCard({ car, onSelect }: CarCardProps) {
  return (
    <article>
      <h3>{car.brand} {car.model}</h3>
      <p>{formatCarPrice(car.price)}</p>
      {onSelect && (
        <Button onClick={() => onSelect(car)}>
          Voir détails
        </Button>
      )}
    </article>
  )
}

// features/cars/hooks/use-cars.ts
import { useQuery } from '@tanstack/react-query'
import { carsAPI } from '../lib/api'
import type { CarFilters } from '../types'

export function useCars(filters?: CarFilters) {
  return useQuery({
    queryKey: ['cars', filters],
    queryFn: () => carsAPI.client.list(filters),
  })
}

// features/cars/lib/api.ts
import { serverGet } from '@/shared/lib/api/server'
import { clientAPI } from '@/shared/lib/api'
import type { Car, CarFilters, CarListResponse } from '../types'

export const carsAPI = {
  server: {
    list: (filters?: CarFilters) =>
      serverGet<CarListResponse>('/cars', { query: filters }),
    get: (id: string) =>
      serverGet<Car>(`/cars/${id}`),
  },
  client: {
    list: (filters?: CarFilters) =>
      clientAPI.get<CarListResponse>('/cars', { query: filters }),
    get: (id: string) =>
      clientAPI.get<Car>(`/cars/${id}`),
  },
}

// Usage dans app/
// app/catalog/page.tsx
import { CarList, useCars } from '@/features/cars'

export default function CatalogPage() {
  return <CarList />
}
```

### Example: Auth Feature

```typescript
// features/auth/index.ts
export { LoginForm } from './components/LoginForm'
export { AuthProvider } from './components/AuthProvider'
export { useAuth } from './hooks/use-auth'
export type { User, AuthState } from './types'

// features/auth/hooks/use-auth.ts
import { useAuthStore } from './use-auth-store'
import { useUserStore } from './use-user-store'
import { clientAPI } from '@/shared/lib/api'
import { APP_ROUTES } from '@/shared/lib/constants'

export function useAuth() {
  const { state, setState } = useAuthStore()
  const { user, setUser, clearUser } = useUserStore()

  const login = async (credentials) => {
    setState('loading')
    const { data } = await clientAPI.post('/auth/login', credentials)
    setUser(data.user)
    setState('authenticated')
  }

  const logout = async () => {
    await clientAPI.post('/auth/logout', {})
    clearUser()
    setState('unauthenticated')
  }

  return {
    user,
    state,
    isAuthenticated: state === 'authenticated',
    login,
    logout,
  }
}
```

## 🛡️ Architecture Validation

### ESLint Rules

```javascript
// eslint.config.mjs
export default [
  {
    name: 'architecture-no-shared-to-features',
    files: ['shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*'],
              message: 'shared/ cannot import from features/',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'architecture-no-feature-internals',
    files: ['features/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/*/components/**',
                '@/features/*/hooks/**',
                '@/features/*/lib/**',
                '@/features/*/stores/**',
              ],
              message: 'Import from feature public API only (index.ts)',
            },
          ],
        },
      ],
    },
  },
]
```

### Testing Structure

```
features/cars/
├── components/
│   ├── CarCard/
│   │   ├── index.tsx
│   │   └── CarCard.test.tsx      # Co-located tests
│   └── CarList/
│       ├── index.tsx
│       └── CarList.test.tsx
├── __tests__/
│   ├── integration/
│   │   └── cars-flow.test.tsx    # Integration tests
│   └── e2e/
│       └── cars-catalog.spec.ts  # E2E tests
└── index.ts
```

## 📋 Checklist - Créer une Feature

### 1. Structure
- [ ] Créer dossier `features/[name]/`
- [ ] Créer sous-dossiers (components, hooks, lib, stores, types)
- [ ] Créer `index.ts` pour public API

### 2. Implementation
- [ ] Définir types dans `types/`
- [ ] Implémenter components dans `components/`
- [ ] Créer hooks custom dans `hooks/`
- [ ] Business logic dans `lib/`
- [ ] Stores Zustand dans `stores/` si nécessaire

### 3. Public API
- [ ] Exports intentionnels dans `index.ts`
- [ ] Documentation des exports publics
- [ ] Pas d'export d'internals

### 4. Tests
- [ ] Tests unitaires co-localisés
- [ ] Tests d'intégration si nécessaire
- [ ] Vérifier imports (pas d'internals)

### 5. Validation
- [ ] ESLint passe (architecture rules)
- [ ] TypeScript compile
- [ ] Tests passent
- [ ] Documentation à jour

## 🎓 Best Practices

### Do's ✅

- Organiser par feature métier
- Public API intentionnelle (index.ts)
- Tests co-localisés
- Types bien définis
- Clear separation of concerns

### Don'ts ❌

- Organiser par type technique
- Exporter tout dans index.ts
- Importer feature internals
- Shared → features dependencies
- Global state quand local suffit

## 🔗 Ressources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Vertical Slice Architecture](https://jimmybogard.com/vertical-slice-architecture/)
