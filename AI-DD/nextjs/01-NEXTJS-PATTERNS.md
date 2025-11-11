# Next.js 15 App Router - Patterns & Best Practices

## 🎯 Objectif

Patterns pour utiliser Next.js 15 App Router avec performance et maintenabilité optimales.

## 📚 Fondamentaux App Router

### Server Components (défaut)

**Par défaut, tous les components dans `app/` sont Server Components**

```typescript
// ✅ Server Component (défaut)
export default async function Page() {
  // Peut fetcher directement
  const data = await fetch('https://api.example.com/data', {
    cache: 'no-store' // ou 'force-cache' ou revalidate
  })
  const json = await data.json()

  return <div>{json.title}</div>
}
```

**Avantages**:
- Zero JavaScript côté client par défaut
- Accès direct aux données serveur
- SEO optimal
- Performance améliorée

### Client Components

**Ajouter `'use client'` seulement si nécessaire**

```typescript
// ✅ Client Component (quand hooks/events/state nécessaires)
'use client'

import { useState, useEffect } from 'react'

export default function InteractiveComponent() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log('Mounted')
  }, [])

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

**Utiliser Client Components pour**:
- `useState`, `useEffect`, hooks React
- Event handlers (`onClick`, `onChange`, etc.)
- Browser APIs (`localStorage`, `window`, etc.)
- Custom hooks utilisant des hooks React

## 🗂️ Organisation des Routes

### Route Groups

**Organiser routes sans affecter l'URL**

```
app/
├── (auth)/              # Group: Authentication
│   ├── layout.tsx      # Auth-specific layout
│   ├── connexion/
│   └── inscription/
├── (account)/           # Group: User account
│   └── account/private/
├── (catalog)/           # Group: Vehicle catalog
│   ├── acheter/
│   └── echanger/
└── (marketing)/         # Group: Marketing
    ├── page.tsx
    └── tarifs/
```

**Route groups permettent**:
- Layouts différents par groupe
- Organisation logique
- Metadata spécifiques par groupe

### Parallel Routes

**Rendre plusieurs slots simultanément**

```
app/(catalog)/
├── layout.tsx
├── @filters/           # Parallel route slot
│   ├── default.tsx
│   └── page.tsx
├── @modal/             # Parallel route slot
│   └── default.tsx
└── acheter/
    ├── page.tsx
    └── @filters/
        └── page.tsx
```

**layout.tsx**:
```typescript
export default function CatalogLayout({
  children,
  filters,
  modal,
}: {
  children: React.ReactNode
  filters: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <div className="flex">
      <aside>{filters}</aside>
      <main>{children}</main>
      {modal}
    </div>
  )
}
```

### Intercepting Routes

**Afficher contenu différent selon contexte de navigation**

```
app/
├── vehicle/
│   └── [id]/
│       └── page.tsx         # Full page
└── (catalog)/
    └── acheter/
        └── (..)vehicle/[id]/
            └── page.tsx     # Modal version
```

**Syntax interception**:
- `(.)` - même niveau
- `(..)` - un niveau au-dessus
- `(..)(..)` - deux niveaux au-dessus
- `(...)` - depuis racine `app/`

## 📊 Data Fetching

### Server-Side Fetching

```typescript
// Fetch dans Server Component
export default async function Page() {
  // Option 1: No cache (équivalent getServerSideProps)
  const data1 = await fetch('...', { cache: 'no-store' })

  // Option 2: Force cache (Static)
  const data2 = await fetch('...', { cache: 'force-cache' })

  // Option 3: Revalidate (ISR)
  const data3 = await fetch('...', { next: { revalidate: 3600 } })

  return <div>...</div>
}
```

### Revalidation

```typescript
// Route segment config
export const revalidate = 3600 // Revalidate every hour

// On-demand revalidation
import { revalidatePath, revalidateTag } from 'next/cache'

// In Server Action or Route Handler
revalidatePath('/catalog')
revalidateTag('cars')
```

### Client-Side Fetching

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { clientAPI } from '@/shared/lib/api'

export default function ClientComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['cars'],
    queryFn: () => clientAPI.get('/cars'),
  })

  if (isLoading) return <Skeleton />
  return <div>{data.map(...)}</div>
}
```

## 🎨 Layouts & Templates

### Root Layout

```typescript
// app/layout.tsx - REQUIS
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'iAutos',
  description: 'Marketplace automobile',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### Nested Layouts

```typescript
// app/(catalog)/layout.tsx
export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <CatalogNav />
      <main>{children}</main>
    </div>
  )
}
```

### Templates

**Re-render à chaque navigation (contrairement à layouts)**

```typescript
// app/(auth)/template.tsx
export default function AuthTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  // Reset state on navigation
  return <div className="auth-container">{children}</div>
}
```

## 🔄 Loading & Error States

### Loading UI

```typescript
// app/catalog/loading.tsx
export default function Loading() {
  return <Skeleton />
}

// Avec Suspense
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CarList />
    </Suspense>
  )
}
```

### Error Handling

```typescript
// app/catalog/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Erreur: {error.message}</h2>
      <button onClick={() => reset()}>Réessayer</button>
    </div>
  )
}
```

### Not Found

```typescript
// app/catalog/not-found.tsx
export default function NotFound() {
  return <div>Catalogue introuvable</div>
}

// Trigger manually
import { notFound } from 'next/navigation'

export default async function Page({ params }) {
  const car = await getCar(params.id)
  if (!car) notFound()
  return <div>{car.title}</div>
}
```

## 🛣️ Navigation

### Link Component

```typescript
import Link from 'next/link'

// Prefetch automatique (par défaut)
<Link href="/catalog">Catalogue</Link>

// Disable prefetch
<Link href="/catalog" prefetch={false}>Catalogue</Link>

// Replace instead of push
<Link href="/catalog" replace>Catalogue</Link>
```

### useRouter Hook

```typescript
'use client'

import { useRouter } from 'next/navigation'

export default function Component() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/catalog')
    // router.replace('/catalog')
    // router.refresh()
    // router.back()
    // router.forward()
  }

  return <button onClick={handleClick}>Navigate</button>
}
```

### usePathname & useSearchParams

```typescript
'use client'

import { usePathname, useSearchParams } from 'next/navigation'

export default function Component() {
  const pathname = usePathname() // "/catalog/acheter"
  const searchParams = useSearchParams() // URLSearchParams

  const brand = searchParams.get('brand')

  return <div>Current: {pathname}</div>
}
```

## 📝 Metadata

### Static Metadata

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acheter une voiture',
  description: 'Trouvez la voiture de vos rêves',
  openGraph: {
    title: 'Acheter une voiture - iAutos',
    description: 'Trouvez la voiture de vos rêves',
    images: ['/og-image.jpg'],
  },
}

export default function Page() {
  return <div>...</div>
}
```

### Dynamic Metadata

```typescript
import type { Metadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await getCar(params.id)

  return {
    title: `${car.brand} ${car.model}`,
    description: car.description,
    openGraph: {
      images: [car.image],
    },
  }
}

export default function Page({ params }: Props) {
  return <div>...</div>
}
```

## 🚀 Performance Patterns

### Code Splitting

```typescript
import dynamic from 'next/dynamic'

// Lazy load component
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-only
})

export default function Page() {
  return (
    <div>
      <HeavyComponent />
    </div>
  )
}
```

### Streaming

```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <>
      {/* Load instantly */}
      <Header />

      {/* Stream when ready */}
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>

      {/* Load instantly */}
      <Footer />
    </>
  )
}
```

## ⚠️ Erreurs communes

### ❌ 'use client' partout

```typescript
// ❌ BAD - Inutile
'use client'

export default function StaticPage() {
  return <div>Hello</div>
}

// ✅ GOOD - Server Component par défaut
export default function StaticPage() {
  return <div>Hello</div>
}
```

### ❌ Fetch dans Client Component

```typescript
// ❌ BAD
'use client'

export default function Page() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData)
  }, [])
}

// ✅ GOOD - Server Component
export default async function Page() {
  const data = await fetch('/api/data')
  return <div>{data}</div>
}

// ✅ GOOD - Ou React Query
'use client'

export default function Page() {
  const { data } = useQuery({
    queryKey: ['data'],
    queryFn: () => fetch('/api/data').then(r => r.json())
  })
}
```

## 📋 Checklist

### Avant de créer une page

- [ ] Server Component par défaut ?
- [ ] 'use client' nécessaire ?
- [ ] Metadata définie ?
- [ ] Loading state prévu ?
- [ ] Error boundary prévu ?
- [ ] Data fetching optimisé ?

### Avant de déployer

- [ ] Pas de 'use client' inutile
- [ ] Loading states partout
- [ ] Error handling complet
- [ ] Metadata SEO OK
- [ ] Images optimisées
- [ ] Performance testée

## 🔗 Ressources

- [Next.js 15 Docs](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)
- [Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Routing](https://nextjs.org/docs/app/building-your-application/routing)
