# Page de Détail d'Annonce - Documentation

## 🎯 Vue d'ensemble

Page complète de détail d'une annonce automobile avec SSR, galerie d'images optimisée, et informations détaillées.

**Route:** `/annonce/[id]`
**Pattern:** Server Component + Client Component hydration
**API:** `/api/v1/announcements/{id}`

---

## 📂 Structure des fichiers

```
app/(catalogue)/annonce/[id]/
├── page.tsx           # Server Component principal (SSR + prefetch)
├── loading.tsx        # Skeleton de chargement
└── not-found.tsx      # Page 404 personnalisée

features/catalog/
├── types/
│   └── announcement.ts           # Types complets pour annonces
├── lib/
│   └── announcement-api-server.ts # API server pour annonces
└── components/
    └── AnnouncementDetail/
        └── index.tsx             # Client Component avec galerie
```

---

## 🔧 Technologies utilisées

### Next.js 15 Patterns
- ✅ **Server Components** par défaut (SSR)
- ✅ **TanStack Query** avec prefetch et hydration
- ✅ **Dynamic metadata** pour SEO
- ✅ **Image optimization** avec Next.js Image
- ✅ **notFound()** pour erreurs 404
- ✅ **Loading states** avec Suspense
- ✅ **Revalidation** (5 minutes)

### API Integration
- ✅ **server.ts** comme unique endpoint
- ✅ **Type-safe** avec types TypeScript complets
- ✅ **Error handling** avec try/catch + notFound()

### UI Components
- ✅ **Shadcn/UI** (Card, Button, Badge)
- ✅ **Lucide Icons** pour icônes
- ✅ **Tailwind CSS v4** pour styles
- ✅ **Responsive design** (mobile-first)

---

## 📊 Structure des données API

### Response `/api/v1/announcements/{id}`

```typescript
{
  id: string
  title: string
  description: string
  price: number
  localization: {
    city: string
    postalCode: string
    latitude: string
    longitude: string
  }
  categoryCode: string
  subcategoryCode: string
  brandName: string
  modelName: string
  versionName: string
  mediaObjects: Array<{
    id: string
    publicUrl: string
    position: number
    // ...
  }>
  attributes: Array<{
    id: string
    label: string
    name: string
    value: string
  }>
  owner: {
    username: string
    displayName: string
    phone: string
  }
  status: string
  createdAt: string
  updatedAt: string
}
```

---

## 🎨 Features implémentées

### 1. Galerie d'images optimisée

```typescript
// Images principales avec navigation
<Image
  src={images[currentImageIndex].publicUrl}
  alt="..."
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
  priority={currentImageIndex === 0}
  className="object-cover"
/>

// Vignettes avec sélection
{images.map((image, index) => (
  <Image
    src={image.publicUrl}
    fill
    sizes="(max-width: 768px) 16vw, 10vw"
    className="object-cover"
  />
))}
```

**Optimisations images:**
- ✅ `sizes` prop pour responsive images
- ✅ `priority` uniquement sur première image
- ✅ Cache instantané (CloudFlare compatible)
- ✅ Lazy loading automatique
- ✅ `object-cover` pour ratios constants

### 2. Lightbox plein écran

```typescript
const [isLightboxOpen, setIsLightboxOpen] = useState(false)

// Click sur image principale ouvre lightbox
<Image onClick={() => setIsLightboxOpen(true)} />

// Lightbox avec navigation
{isLightboxOpen && (
  <div className="fixed inset-0 z-50 bg-black/95">
    <Image sizes="100vw" className="object-contain" />
    {/* Navigation prev/next */}
  </div>
)}
```

### 3. Organisation des attributs

```typescript
// Groupes d'attributs par catégorie
const attributeGroups: AttributeGroup[] = [
  {
    title: 'Caractéristiques principales',
    icon: '🚗',
    attributes: [
      { label: 'Année modèle', value: getAttributeValue(announcement, 'car_year') },
      { label: 'Kilométrage', value: `${getAttributeValue(announcement, 'car_mileage')} km` },
      // ...
    ].filter(attr => attr.value !== '-'),
  },
  // ... autres groupes
]
```

**Attributs disponibles:**
- Caractéristiques principales (année, kilométrage, énergie, boîte)
- Détails techniques (portes, places, puissance, finition, couleur)
- État et conformité (état, Crit'Air, émissions, CT)

### 4. Sidebar collante avec infos

```typescript
<Card className="sticky top-4">
  {/* Prix et titre */}
  {/* Informations rapides (icônes) */}
  {/* Informations vendeur */}
  {/* Boutons d'action (appel, message) */}
  {/* Statut et dates */}
</Card>
```

### 5. SEO et Metadata

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const announcement = await announcementAPIServer.getAnnouncement(params.id)

  return {
    title: `${announcement.brandName} ${announcement.modelName} - ${announcement.versionName}`,
    description: announcement.description.slice(0, 160),
    openGraph: {
      title: `${announcement.brandName} ${announcement.modelName} - ${announcement.price}€`,
      images: [firstImage],
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}
```

---

## 🚀 Pattern SSR avec TanStack Query

### Server Component (page.tsx)

```typescript
export default async function AnnouncementPage({ params }: { params: { id: string } }) {
  const queryClient = new QueryClient()

  // 1. Prefetch sur serveur
  await queryClient.prefetchQuery({
    queryKey: ['announcement', params.id],
    queryFn: () => announcementAPIServer.getAnnouncement(params.id),
    staleTime: 60 * 1000,
  })

  // 2. Récupérer données préfetchées
  const announcement = queryClient.getQueryData(['announcement', params.id])

  if (!announcement) {
    notFound()
  }

  // 3. Hydrater client avec données serveur
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnnouncementDetail announcement={announcement} />
    </HydrationBoundary>
  )
}
```

### Client Component (AnnouncementDetail)

```typescript
'use client'

export function AnnouncementDetail({ announcement }: { announcement: Announcement }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  // Component reçoit données SSR via props
  // Peut ajouter interactivité (galerie, lightbox)
  // TanStack Query utilise cache SSR
}
```

**Avantages:**
- ✅ SSR complet pour SEO
- ✅ Pas de flash de chargement
- ✅ Interactivité côté client
- ✅ Cache partagé serveur/client

---

## 🎯 Loading & Error States

### Loading Skeleton (loading.tsx)

```typescript
export default function AnnouncementLoading() {
  return (
    <div className="container">
      <Skeleton className="aspect-[16/9]" />
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map(() => (
          <Skeleton className="aspect-square" />
        ))}
      </div>
      {/* ... autres skeletons */}
    </div>
  )
}
```

### Not Found (not-found.tsx)

```typescript
export default function AnnouncementNotFound() {
  return (
    <Card>
      <h1>Annonce introuvable</h1>
      <p>L'annonce n'existe pas ou n'est plus disponible</p>
      <Button href="/acheter">Voir les annonces</Button>
    </Card>
  )
}
```

---

## 📱 Responsive Design

### Layout Grid

```typescript
// Desktop: 2/3 gauche (images) + 1/3 droite (infos)
<div className="grid lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2">{/* Images + détails */}</div>
  <div>{/* Sidebar infos */}</div>
</div>

// Mobile: Stack vertical
```

### Images Sizes

```typescript
// Image principale
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"

// Vignettes
sizes="(max-width: 768px) 16vw, 10vw"

// Lightbox
sizes="100vw"
```

---

## ⚡ Performance Optimizations

### 1. Image Optimization
- ✅ Next.js Image avec cache automatique
- ✅ Lazy loading (sauf première image)
- ✅ Sizes prop pour responsive
- ✅ CloudFlare compatible

### 2. SSR + Revalidation
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes
```

### 3. TanStack Query Cache
```typescript
staleTime: 60 * 1000 // 1 minute
```

### 4. Code Splitting
- ✅ Client Components séparés
- ✅ Icons importés individuellement
- ✅ Composants UI lazy loadés

---

## 🔗 API Integration

### Fetch Announcement

```typescript
// features/catalog/lib/announcement-api-server.ts
import { serverGet } from '@/shared/lib/api/server'
export const announcementAPIServer = {
  async getAnnouncement(id: string): Promise<Announcement> {
    const { data } = await serverGet<Announcement>(`/api/v1/announcements/${id}`)
    return data
  },
}
```

**Features:**
- ✅ Utilise `server.ts` comme unique endpoint
- ✅ Type-safe avec types complets
- ✅ Error handling automatique
- ✅ Retry logic avec backoff
- ✅ Cookie auth automatique

---

## 🎓 Usage Examples

### Lier depuis VehicleCard

```typescript
<Link href={`/annonce/${vehicle.id}`}>
  <VehicleCard vehicle={vehicle} />
</Link>
```

### Précharger depuis page liste

```typescript
// Prefetch au survol
<Link
  href={`/annonce/${vehicle.id}`}
  prefetch={true}
>
```

### Utiliser dans d'autres pages

```typescript
import { announcementAPIServer } from '@/features/catalog'

const announcement = await announcementAPIServer.getAnnouncement(id)
```

---

## ✅ Checklist de features

### Core Features
- ✅ SSR avec prefetch TanStack Query
- ✅ Galerie d'images avec navigation
- ✅ Lightbox plein écran
- ✅ Vignettes sélectionnables
- ✅ Attributs groupés par catégorie
- ✅ Sidebar collante avec infos
- ✅ Informations vendeur + contact
- ✅ Boutons d'action (appel, message)

### Technical Features
- ✅ Next.js Image optimization
- ✅ Responsive design (mobile-first)
- ✅ Loading skeleton
- ✅ Not found page
- ✅ SEO metadata dynamique
- ✅ Cache CloudFlare compatible
- ✅ Type-safety complète
- ✅ Error handling robuste

### Performance
- ✅ SSR pour SEO
- ✅ Revalidation 5 minutes
- ✅ Image lazy loading
- ✅ Client-side interactivité
- ✅ Code splitting automatique

---

## 🚨 Points d'attention

### Images
- ⚠️ **TOUJOURS** utiliser `sizes` prop
- ⚠️ `priority` uniquement sur première image
- ⚠️ Cache CloudFlare: images doivent être publiques
- ⚠️ Fallback si pas d'images

### API
- ⚠️ Utiliser `serverGet()` dans Server Components
- ⚠️ Error handling avec `notFound()` pour 404
- ⚠️ Types doivent matcher exactement API backend

### Performance
- ⚠️ Éviter trop de `priority={true}`
- ⚠️ Lazy load vignettes (pas de priority)
- ⚠️ Revalidation raisonnable (pas trop courte)

---

## 🔄 Améliorations futures

### Features suggérées
- [ ] Partage social (Twitter, Facebook, WhatsApp)
- [ ] Favoris/Sauvegarde
- [ ] Comparaison avec autres annonces
- [ ] Historique de prix
- [ ] Véhicules similaires
- [ ] Carte interactive (localisation)
- [ ] Formulaire de contact dans modal
- [ ] Galerie avec zoom avancé
- [ ] Vidéos (si disponibles)
- [ ] Rapport d'inspection (si dispo)

### Performance
- [ ] ISR avec generateStaticParams
- [ ] Prefetch annonces similaires
- [ ] Image blur placeholder
- [ ] WebP/AVIF format auto

---

## 📚 Références

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [TanStack Query SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)

---

**✨ Page complète et production-ready !**
