# Coding Standards - iAutos Frontend

## 🎯 Objectif

Standards de code pour cohérence, qualité et maintenabilité du projet iAutos.

## 📝 Conventions de Nommage

### Components

```typescript
// ✅ CORRECT - PascalCase
export function UserProfile() {}
export function CarCard() {}
export function CreateAnnonceWizard() {}

// ❌ INCORRECT
export function userProfile() {}
export function car_card() {}
```

### Functions & Variables

```typescript
// ✅ CORRECT - camelCase
const getUserData = () => {}
const isLoading = true
const fetchCars = async () => {}

// ❌ INCORRECT
const GetUserData = () => {}
const is_loading = true
const FetchCars = () => {}
```

### Constants

```typescript
// ✅ CORRECT - UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const DEFAULT_PAGE_SIZE = 20

// ❌ INCORRECT
const apiBaseUrl = '...'
const maxFileSize = 5
```

### Types

```typescript
// ✅ CORRECT - PascalCase avec 'type'
export type User = { id: string; name: string }
export type UserRole = 'admin' | 'dealer' | 'user'
export type APIResponse<T> = { data: T; status: number }

// ❌ INCORRECT
export type user = { id: string }
export interface User { id: string } // INTERDIT
```

### Files

```typescript
// Components - PascalCase.tsx
CarCard.tsx
UserProfile.tsx
CreateAnnonceWizard.tsx

// Hooks - kebab-case.ts
use-auth.ts
use-cars.ts
use-form-validation.ts

// Utils/Lib - kebab-case.ts
api-client.ts
format-utils.ts
validation-helpers.ts

// Types - kebab-case.ts
car-types.ts
user-types.ts
api-types.ts
```

### ⚠️ RÈGLE CRITIQUE: Automotive Naming

**TOUJOURS utiliser `cars-*`, JAMAIS `vehicles-*`**

```typescript
// ✅ CORRECT
cars-mapping.ts
cars-search.tsx
cars-filters.tsx
useCars()
type Car = {}

// ❌ INTERDIT
vehicles-mapping.ts
vehicles-search.tsx
useVehicles()
type Vehicle = {}
```

## 📂 File Organization

### Component Files

```
ComponentName/
├── index.tsx                # Component
├── ComponentName.test.tsx   # Tests
├── types.ts                 # Component types
└── utils.ts                 # Component utilities (si nécessaire)
```

### Feature Files

```
features/feature-name/
├── components/
│   ├── ComponentA/
│   │   ├── index.tsx
│   │   └── ComponentA.test.tsx
│   └── index.ts
├── hooks/
│   ├── use-feature.ts
│   └── index.ts
├── lib/
│   ├── api.ts
│   ├── utils.ts
│   └── index.ts
├── stores/
│   └── feature-store.ts
├── types/
│   └── index.ts
└── index.ts
```

## 🎨 Code Style

### Import Order

```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. External libraries
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

// 3. Internal features
import { useAuth } from '@/features/auth'
import { CarCard } from '@/features/cars'

// 4. Shared
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

// 5. Types
import type { Car } from '@/features/cars'
import type { User } from '@/features/auth'

// 6. Relative imports
import { LocalComponent } from './LocalComponent'
import type { LocalType } from './types'
```

### Export Style

```typescript
// ✅ CORRECT - Named exports pour utilities
export function formatPrice(price: number) {}
export function formatDate(date: Date) {}

// ✅ CORRECT - Default export pour components
export default function CarCard() {}

// ✅ CORRECT - Barrel exports
// index.ts
export { CarCard } from './CarCard'
export { CarList } from './CarList'
export type { Car, CarFilters } from './types'
```

### Function Style

```typescript
// ✅ CORRECT - Arrow functions pour utilities
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

// ✅ CORRECT - Function declaration pour components
export function CarCard({ car }: CarCardProps) {
  return <div>{car.brand}</div>
}

// ✅ CORRECT - Arrow function pour inline callbacks
const handleClick = () => {
  console.log('Clicked')
}
```

### Object & Array Style

```typescript
// ✅ CORRECT - Trailing commas
const user = {
  id: '1',
  name: 'John',
  email: 'john@example.com', // trailing comma
}

const colors = [
  'red',
  'blue',
  'green', // trailing comma
]

// ✅ CORRECT - Destructuring
const { id, name, email } = user
const [first, second, ...rest] = array

// ✅ CORRECT - Spread operator
const newUser = { ...user, age: 30 }
const newArray = [...array, newItem]
```

## 🔒 Type Safety

### No Any

```typescript
// ❌ INCORRECT
function process(data: any) {
  return data.value
}

// ✅ CORRECT
function process(data: { value: string }) {
  return data.value
}

// ✅ CORRECT - Generic
function process<T extends { value: string }>(data: T) {
  return data.value
}

// ✅ ACCEPTABLE - unknown avec type guard
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return data.value
  }
  throw new Error('Invalid data')
}
```

### Type vs Interface

```typescript
// ✅ CORRECT - TOUJOURS type
export type User = {
  id: string
  name: string
}

// ❌ INTERDIT - interface
export interface User {
  id: string
  name: string
}
```

### Explicit Return Types

```typescript
// ✅ CORRECT - Return type explicite
export function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(r => r.json())
}

export function formatPrice(price: number): string {
  return `${price} €`
}

// ✅ ACCEPTABLE - Inféré simple
const total = (a: number, b: number) => a + b // inferred: number
```

## 📋 Documentation

### JSDoc

```typescript
/**
 * Fetches a car by ID from the API
 *
 * @param id - The car ID
 * @returns Promise resolving to Car object
 * @throws {APIError} If car not found or API error
 *
 * @example
 * ```ts
 * const car = await getCar('123')
 * console.log(car.brand)
 * ```
 */
export async function getCar(id: string): Promise<Car> {
  const { data } = await serverAPI.get<Car>(`/cars/${id}`)
  return data
}
```

### Inline Comments

```typescript
// ✅ GOOD - Explain WHY, not WHAT
// Reset filters to page 1 to avoid empty results
setPage(1)

// ✅ GOOD - Complex logic explanation
// Calculate depreciation using declining balance method
// Formula: value * (1 - rate)^years
const depreciated = value * Math.pow(1 - rate, years)

// ❌ BAD - Stating the obvious
// Set count to 0
setCount(0)

// ❌ BAD - Commented code
// const oldFunction = () => {}
```

## ⚡ Performance

### Memoization

```typescript
// ✅ CORRECT - Memo expensive component
export const ExpensiveComponent = memo(function ExpensiveComponent({
  data,
}: Props) {
  // Heavy render
  return <div>{data}</div>
})

// ✅ CORRECT - useMemo for expensive calculation
const sortedCars = useMemo(() => {
  return cars.sort((a, b) => b.price - a.price)
}, [cars])

// ✅ CORRECT - useCallback for stable reference
const handleClick = useCallback(() => {
  doSomething(value)
}, [value])

// ❌ INCORRECT - Unnecessary memo
const SimpleComponent = memo(({ text }: { text: string }) => {
  return <div>{text}</div> // Too simple to memo
})
```

### Code Splitting

```typescript
// ✅ CORRECT - Dynamic import for heavy component
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,
})

// ✅ CORRECT - Lazy load modal
const [showModal, setShowModal] = useState(false)

{showModal && (
  <Suspense fallback={<div>Loading...</div>}>
    <HeavyModal />
  </Suspense>
)}
```

## 🛡️ Error Handling

### Try-Catch

```typescript
// ✅ CORRECT - Specific error handling
async function fetchCar(id: string): Promise<Car> {
  try {
    const { data } = await serverAPI.get<Car>(`/cars/${id}`)
    return data
  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 404) {
        throw new Error(`Car ${id} not found`)
      }
    }
    throw new Error('Failed to fetch car')
  }
}

// ✅ CORRECT - Error boundary
'use client'

export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

## 🧪 Testing

### Test File Location

```typescript
// ✅ CORRECT - Co-located tests
components/
  CarCard/
    index.tsx
    CarCard.test.tsx

// ✅ CORRECT - Integration tests
features/cars/
  __tests__/
    integration/
      cars-flow.test.tsx
```

### Test Naming

```typescript
// ✅ CORRECT
describe('CarCard', () => {
  it('renders car information correctly', () => {})
  it('handles click events', () => {})
  it('shows skeleton when loading', () => {})
})

// ❌ INCORRECT
describe('Test CarCard', () => {
  it('test rendering', () => {})
  it('test clicks', () => {})
})
```

## 📏 Linting & Formatting

### ESLint

```javascript
// eslint.config.mjs
export default [
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
]
```

### Prettier

```json
// .prettierrc.json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

## ✅ Pre-Commit Checklist

- [ ] No TypeScript errors (`pnpm tsc --noEmit`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Code formatted (`pnpm format`)
- [ ] No console.log (except console.error/warn)
- [ ] No commented code
- [ ] Imports organized
- [ ] Types defined (no `any`)

## 🚫 Anti-Patterns

### ❌ Éviter

```typescript
// Deep nesting
if (condition1) {
  if (condition2) {
    if (condition3) {
      // Code here
    }
  }
}

// Magic numbers
setTimeout(callback, 3000)

// Mutating props
function Component({ data }) {
  data.value = 'new' // ❌ Never mutate props
}

// Non-descriptive names
const d = new Date()
const arr = [1, 2, 3]
const fn = () => {}
```

### ✅ Préférer

```typescript
// Early returns
if (!condition1) return
if (!condition2) return
if (!condition3) return
// Code here

// Named constants
const DEBOUNCE_DELAY = 3000
setTimeout(callback, DEBOUNCE_DELAY)

// Immutability
function Component({ data }) {
  const newData = { ...data, value: 'new' }
}

// Descriptive names
const currentDate = new Date()
const userIds = [1, 2, 3]
const fetchUserData = () => {}
```

## 🎓 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
