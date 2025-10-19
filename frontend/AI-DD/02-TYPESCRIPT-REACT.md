# TypeScript & React - Best Practices

## 🎯 Objectif

Guidelines TypeScript et React pour un code type-safe, maintenable et performant.

## 📘 TypeScript Guidelines

### ⚠️ RÈGLE CRITIQUE: type vs interface

**TOUJOURS utiliser `type`, JAMAIS `interface`**

```typescript
// ✅ CORRECT
export type User = {
  id: string
  name: string
  email: string
}

export type Status = 'idle' | 'loading' | 'success' | 'error'

export type CarFilters = {
  brand?: string
  model?: string
  priceRange?: [number, number]
}

// ❌ INTERDIT
interface User {
  id: string
  name: string
}
```

**Pourquoi `type` ?**
- Cohérence avec le projet iAutos
- Plus flexible (unions, intersections, tuples)
- Meilleure inférence TypeScript
- Standard établi dans la codebase

### Type Definitions

```typescript
// Basic types
export type ID = string
export type Timestamp = string // ISO 8601

// Object types
export type Car = {
  id: ID
  brand: string
  model: string
  year: number
  price: number
  createdAt: Timestamp
}

// Union types
export type UserRole = 'admin' | 'dealer' | 'user'
export type PaymentStatus = 'pending' | 'paid' | 'failed'

// Intersection types
export type CarWithOwner = Car & {
  owner: User
}

// Generic types
export type APIResponse<T> = {
  data: T
  status: number
  message?: string
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>
```

### Type Guards

```typescript
// Type predicates
export function isCar(value: unknown): value is Car {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'brand' in value &&
    'model' in value
  )
}

// Discriminated unions
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string }

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data) // TypeScript knows data exists
  } else {
    console.error(result.error) // TypeScript knows error exists
  }
}
```

### Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## ⚛️ React Guidelines

### Component Types

```typescript
// ✅ Functional component avec types explicites
type ButtonProps = {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  children: React.ReactNode
  disabled?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  onClick,
  children,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className={cn('btn', `btn-${variant}`, `btn-${size}`)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ✅ Avec forwardRef
type InputProps = {
  label: string
  error?: string
} & React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} {...props} />
        {error && <span className="error">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'

// ✅ Generic component
type ListProps<T> = {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
}

export function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}
```

### Event Handlers

```typescript
type FormProps = {
  onSubmit: (data: FormData) => void
}

export function Form({ onSubmit }: FormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    onSubmit(formData)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.value)
  }

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log('Clicked', event.currentTarget)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={handleInputChange} />
      <button onClick={handleButtonClick}>Submit</button>
    </form>
  )
}
```

### Hooks Typing

```typescript
// useState
const [count, setCount] = useState(0) // inferred: number
const [user, setUser] = useState<User | null>(null) // explicit

// useRef
const inputRef = useRef<HTMLInputElement>(null)
const timerRef = useRef<NodeJS.Timeout>()

// useReducer
type State = {
  count: number
  status: 'idle' | 'loading' | 'success'
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStatus'; status: State['status'] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 }
    case 'decrement':
      return { ...state, count: state.count - 1 }
    case 'setStatus':
      return { ...state, status: action.status }
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, status: 'idle' })

// Custom hook
type UseFetchResult<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [url])

  return { data, loading, error }
}
```

### Children Props

```typescript
// Simple children
type CardProps = {
  children: React.ReactNode
}

// Render prop pattern
type RenderPropProps<T> = {
  data: T[]
  render: (item: T) => React.ReactNode
}

// Compound components
type TabsProps = {
  children: React.ReactElement<TabProps>[]
  defaultValue?: string
}

type TabProps = {
  value: string
  children: React.ReactNode
}
```

## 🎨 Component Patterns

### Composition

```typescript
// Container + Presentation
type CarCardProps = {
  car: Car
}

// Presentational (dumb)
function CarCardView({ car }: CarCardProps) {
  return (
    <div>
      <h3>{car.brand} {car.model}</h3>
      <p>{car.price} €</p>
    </div>
  )
}

// Container (smart)
function CarCardContainer({ carId }: { carId: string }) {
  const { data: car, isLoading } = useQuery({
    queryKey: ['car', carId],
    queryFn: () => fetchCar(carId),
  })

  if (isLoading) return <Skeleton />
  if (!car) return null

  return <CarCardView car={car} />
}
```

### Compound Components

```typescript
type TabsContextValue = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

export function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

export function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist">{children}</div>
}

export function Tab({ value, children }: TabProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')

  const { activeTab, setActiveTab } = context

  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

// Usage
<Tabs defaultTab="info">
  <TabList>
    <Tab value="info">Info</Tab>
    <Tab value="specs">Specs</Tab>
  </TabList>
</Tabs>
```

### Render Props

```typescript
type DataProviderProps<T> = {
  data: T[]
  children: (data: T[]) => React.ReactNode
}

function DataProvider<T>({ data, children }: DataProviderProps<T>) {
  return <>{children(data)}</>
}

// Usage
<DataProvider data={cars}>
  {cars => (
    <ul>
      {cars.map(car => <li key={car.id}>{car.brand}</li>)}
    </ul>
  )}
</DataProvider>
```

## 🚀 Performance

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react'

// Memo component
export const ExpensiveComponent = memo(function ExpensiveComponent({
  data,
}: {
  data: Car[]
}) {
  // Heavy computation
  return <div>{data.length} cars</div>
})

// useMemo for expensive calculations
function CarList({ cars }: { cars: Car[] }) {
  const sortedCars = useMemo(() => {
    return cars.sort((a, b) => b.price - a.price)
  }, [cars])

  return <div>{sortedCars.map(...)}</div>
}

// useCallback for stable function reference
function SearchInput({ onSearch }: { onSearch: (query: string) => void }) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }, [onSearch])

  return <input onChange={handleChange} />
}
```

## ⚠️ Erreurs communes

### ❌ Utiliser `any`

```typescript
// ❌ BAD
function process(data: any) {
  return data.value
}

// ✅ GOOD
function process(data: { value: string }) {
  return data.value
}

// ✅ GOOD (generic)
function process<T extends { value: string }>(data: T) {
  return data.value
}
```

### ❌ Utiliser `interface`

```typescript
// ❌ BAD (interdit dans le projet)
interface User {
  id: string
  name: string
}

// ✅ GOOD
type User = {
  id: string
  name: string
}
```

### ❌ Props non typées

```typescript
// ❌ BAD
export function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>
}

// ✅ GOOD
type ButtonProps = {
  onClick: () => void
  children: React.ReactNode
}

export function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>
}
```

## 📋 Checklist

- [ ] Tous les types définis avec `type` (jamais `interface`)
- [ ] Aucun `any` (sauf cas exceptionnels documentés)
- [ ] Props components typées
- [ ] Event handlers typés
- [ ] Hooks typés correctement
- [ ] Mode strict TypeScript activé
- [ ] Components mémoïsés si re-render fréquent
