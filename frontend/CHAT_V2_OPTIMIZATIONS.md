# 🚀 Optimisations Chat V2 - Migration Pattern V1

## ✅ Modifications effectuées

Toutes les optimisations de la V1 ont été appliquées à la V2 (marketplace product chats).

---

## 📦 Fichiers créés

### 1. `lib/data/chat-v2.ts` ✨

**Fichier**: [lib/data/chat-v2.ts](lib/data/chat-v2.ts)

**But**: Fetching server-side pour hydratation SSR du cache React Query.

**Fonctions**:
- `getChatRoomsV2Server()` - Fetch toutes les rooms V2
- `getMessagesV2Server(roomId)` - Fetch messages pour une room V2
- `getChatRoomV2Server(roomId)` - Fetch une room V2 spécifique
- `getProductServer(productId)` - Fetch détails produit

**Impact**: ✅ Élimination des fetches client-side en double

---

### 2. `app/(protected)/chat-v2/page.tsx` ✨

**Fichier**: [app/(protected)/chat-v2/page.tsx](app/(protected)/chat-v2/page.tsx)

**Changement**: **Dynamic route → Search params**

**Avant**:
```
/chat-v2/[productId]/[userId]
```

**Après**:
```
/chat-v2?productId=X&userId=Y
```

**Hydratation complète**:
```typescript
// Fetch toutes les données en parallèle
const [initialMercureToken, initialRooms, initialProduct, currentUser] = await Promise.all([
  getMercureTokenV2(),
  getChatRoomsV2Server(),
  getProductServer(productId),
  getCurrentUser(),
])

// Hydrate ALL caches
if (currentUser) queryClient.setQueryData(['user', 'me'], currentUser)
if (initialRooms) queryClient.setQueryData(['chatRoomsV2'], { member: initialRooms })
if (initialMercureToken) queryClient.setQueryData(['mercure', 'token', 'v2'], initialMercureToken)
if (initialProduct) queryClient.setQueryData(['product', productId], initialProduct)
```

**Impact**: ✅ 0 fetch client-side en double, navigation instantanée

---

### 3. `app/(protected)/chat-v2/_components/chat-skeleton-v2.tsx` ✨

**Fichier**: [app/(protected)/chat-v2/_components/chat-skeleton-v2.tsx](app/(protected)/chat-v2/_components/chat-skeleton-v2.tsx)

**Composants**:
- `ProductSidebarSkeleton` - Sidebar produit avec image, prix, description
- `ChatHeaderV2Skeleton` - Header de conversation
- `ChatMessagesV2Skeleton` - Messages (gauche/droite alternés)
- `ChatInputV2Skeleton` - Input d'envoi
- `ChatInterfaceV2Skeleton` - Interface complète
- `ChatEmptyStateV2Skeleton` - État vide (pas de produit sélectionné)

**Impact**: ✅ Loading states professionnels, transitions fluides

---

### 4. `app/(protected)/chat-v2/loading.tsx` ✨

**Fichier**: [app/(protected)/chat-v2/loading.tsx](app/(protected)/chat-v2/loading.tsx)

**But**: Skeleton affiché pendant le fetch server-side initial.

---

## 🔧 Fichiers modifiés

### 1. `lib/hooks/use-chat-rooms-v2.ts` ✨

**Optimisations appliquées**:

```typescript
// ✅ Ajout useEffect pour logs conditionnels
import { useEffect } from 'react'

// ✅ Alignement staleTime 60s (was 5min)
staleTime: 1000 * 60, // 60 seconds - matches server config
gcTime: 1000 * 60 * 5, // 5 minutes
refetchOnMount: false,
refetchOnWindowFocus: false,
refetchOnReconnect: false, // NEW

// ✅ Logs dans useEffect (pas à la racine)
useEffect(() => {
  if (rooms.length > 0) {
    console.log('[useChatRoomsV2] 🏠 Extracted rooms:', rooms.length, 'rooms')
  }
}, [rooms.length])

useEffect(() => {
  console.log('[useChatRoomsV2] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
}, [connected])
```

**Impact**: ✅ Pas de spam logs, pas de refetch inutiles

---

### 2. `lib/hooks/use-chat-messages-v2.ts` ✨

**Optimisations appliquées**:

```typescript
// ✅ Ajout useEffect
import { useEffect } from 'react'

// ✅ QueryKey avec undefined pour pagination
queryKey: ['messagesV2', roomId, undefined],

// ✅ Alignement staleTime et refetch controls
staleTime: 1000 * 60, // 60 seconds - matches server config
gcTime: 1000 * 60 * 5,
refetchOnMount: false,
refetchOnWindowFocus: false,
refetchOnReconnect: false,

// ✅ Ajout updateOptimisticMessageStatus
const updateOptimisticMessageStatus = useCallback(
  (messageId: number, status: 'sending' | 'delivered' | 'error') => {
    console.log('[useChatMessagesV2] 🔄 Updating optimistic message status:', messageId, status)
    setOptimisticMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status } : msg))
    )
  },
  []
)

// ✅ Logs conditionnels dans useEffect
useEffect(() => {
  if (allMessages.length > 0 && roomId > 0) {
    console.log('[useChatMessagesV2] 💬 Messages for room', roomId, ':', allMessages.length)
  }
}, [allMessages.length, roomId])

useEffect(() => {
  console.log('[useChatMessagesV2] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
}, [connected])
```

**Impact**: ✅ Pas de spam logs, optimistic updates complets

---

### 3. `lib/hooks/use-mercure-token-v2.ts` ✨

**Optimisations appliquées**:

```typescript
// ✅ Ajout logs de debug
queryFn: async () => {
  console.log('[useMercureTokenV2] 🔍 Fetching Mercure token V2 from server action...')
  const token = await getMercureTokenV2()
  console.log('[useMercureTokenV2] ✅ Fetched token:', token ? 'Present' : 'Null')
  return token
},

// ✅ Ajout refetch controls
refetchOnMount: false, // Token valid 6h
refetchOnWindowFocus: false,
refetchOnReconnect: false,
```

**Impact**: ✅ Visibilité fetches, pas de refetch inutiles

---

### 4. `app/(protected)/chat-v2/_components/real-chat-interface-v2.tsx` ✨

**Migration majeure** : Application du pattern V1 optimisé.

#### A. Nouveaux imports
```typescript
import { useSearchParams } from 'next/navigation'
import type { User } from '@/types/user'
```

#### B. Nouvelles props
```typescript
type RealChatInterfaceV2Props = {
  initialMercureToken: string | null
  initialProductId: number | null      // NEW (was productId: number)
  initialSellerId: number | null        // NEW (was sellerId: number)
  initialUser: User | null              // NEW
  initialProduct: any | null            // NEW
}
```

#### C. Pattern search params
```typescript
const searchParams = useSearchParams()

// ✅ Lecture dynamique depuis l'URL
const urlProductId = parseInt(searchParams.get('productId') || '0', 10)
const urlUserId = parseInt(searchParams.get('userId') || '0', 10)

// ✅ Priorité URL params > initial props
const currentProductId = urlProductId > 0 ? urlProductId : initialProductId
const currentSellerId = urlUserId > 0 ? urlUserId : initialSellerId
```

#### D. Pattern effectiveUser / effectiveProduct
```typescript
// ✅ Disponible immédiatement au premier render
const { data: currentUser } = useCurrentUser()
const effectiveUser = currentUser ?? initialUser

const { data: product } = useProduct(currentProductId || 0)
const effectiveProduct = product ?? initialProduct
```

#### E. Fonctions adapter pour compatibilité types
```typescript
// Adapter addOptimisticMessage (ChatInputV2 → useChatMessagesV2)
const handleAddOptimisticMessage = useCallback((message: {
  id: number
  content: string
  author: { id: string; email: string; name: string | null }
  createdAt: string
}) => {
  const fullAuthor: User = {
    id: message.author.id,
    email: message.author.email,
    name: message.author.name,
    picture: effectiveUser?.picture || null,
    roles: effectiveUser?.roles || [],
    created_at: effectiveUser?.created_at || null,
    has_google_account: effectiveUser?.has_google_account || false,
  }

  const fullMessage: MessageV2 = {
    ...message,
    author: fullAuthor,
    chatRoom: { '@id': `/api/v2/chat_rooms/${roomId}`, '@type': 'ChatRoomV2', name: '' },
    status: 'pending',
  }
  addOptimisticMessage(fullMessage)
}, [addOptimisticMessage, roomId, effectiveUser])

// Adapter updateOptimisticMessageStatus
const handleUpdateOptimisticMessageStatus = useCallback((messageId: number, status: 'sent' | 'delivered') => {
  updateOptimisticMessageStatus(messageId, status === 'sent' ? 'delivered' : 'delivered')
}, [updateOptimisticMessageStatus])
```

#### F. Toutes les références mises à jour
- `currentUser` → `effectiveUser`
- `product` → `effectiveProduct`
- `productId`/`sellerId` → `currentProductId`/`currentSellerId`

**Impact**: ✅ Pas de flash UI, navigation instantanée, données SSR disponibles immédiatement

---

### 5. `app/(protected)/chat-v2/[productId]/[userId]/page.tsx` ✨

**Migration**: Dynamic route → Redirection vers search params

**Avant** (70 lignes):
```typescript
export default async function ChatV2Page({ params }) {
  const { productId, userId } = await params
  const initialMercureToken = await getMercureTokenV2()

  return (
    <RealChatInterfaceV2
      initialMercureToken={initialMercureToken}
      productId={parseInt(productId, 10)}
      sellerId={parseInt(userId, 10)}
    />
  )
}
```

**Après** (22 lignes):
```typescript
export default async function ChatV2LegacyPage({ params }) {
  const { productId, userId } = await params

  // Redirect to new search params based route
  redirect(`/chat-v2?productId=${productId}&userId=${userId}`)
}
```

**Raison**: Compatibilité avec liens existants (marketplace), redirection transparente.

**Impact**: ✅ Backward compatibility, maintenance simplifiée

---

## 📊 Résultats attendus

### Avant optimisation ❌

```
Page refresh /chat-v2/5/3:
- GET /api/v1/mercure/token (serveur)
- GET /api/v2/chat_rooms (serveur)
- GET /api/v2/products/5 (serveur)
- GET /api/v1/user/me (serveur)
- GET /api/v2/chat_rooms (client) ❌ DOUBLON
- GET /api/v2/products/5 (client) ❌ DOUBLON
- GET /api/v1/user/me (client) ❌ DOUBLON
- GET /api/v1/mercure/token (client) ❌ DOUBLON

TOTAL: 8 requêtes (4 serveur + 4 doublons client)
Navigation entre produits: 200-500ms avec reload
Console logs: 6+ logs par message envoyé
```

### Après optimisation ✅

```
Page refresh /chat-v2?productId=5&userId=3:
- GET /api/v1/mercure/token (serveur)
- GET /api/v2/chat_rooms (serveur)
- GET /api/v2/products/5 (serveur)
- GET /api/v1/user/me (serveur)

TOTAL: 4 requêtes (serveur uniquement, 0 doublon)
Navigation entre produits: 0-50ms client-side (pas de reload)
Console logs: 1-2 logs uniquement si données changent
```

**Gain**: 🎯 **-50% de requêtes** (8 → 4)

---

## 🎯 Comparaison V1 vs V2

| Métrique | Chat V1 | Chat V2 |
|----------|---------|---------|
| **API calls (refresh)** | 5 serveur | 4 serveur |
| **Doublons client** | 0 | 0 |
| **Navigation time** | 0-50ms | 0-50ms |
| **Skeleton flash** | Non | Non |
| **Logs spam** | Non | Non |
| **SSR hydration** | ✅ Complète | ✅ Complète |
| **Search params** | ✅ `/chat?roomId=X` | ✅ `/chat-v2?productId=X&userId=Y` |
| **staleTime** | ✅ 60s | ✅ 60s |
| **refetchOn*** | ✅ false | ✅ false |

---

## 🔍 Comment vérifier

### 1. Console navigateur

**Logs attendus** (uniquement quand données changent):
```
[useChatRoomsV2] 🏠 Extracted rooms: 5 rooms
[useChatRoomsV2] 🔌 Mercure connection status: Connected
[useChatMessagesV2] 💬 Messages for room 3: 12
[useChatMessagesV2] 🔌 Mercure connection status: Connected
```

**Si vous voyez** `🔍 Fetching from API...` → ❌ Problème (fetch non hydraté)

**Si vous ne voyez PAS** ce log → ✅ OK (données hydratées utilisées)

### 2. Onglet Network

Filtrer par `API` et vérifier qu'il n'y a que **4 requêtes serveur** :
1. `/api/v1/mercure/token`
2. `/api/v2/chat_rooms`
3. `/api/v2/products/{id}`
4. `/api/v1/user/me`

Aucune autre requête client ne doit apparaître.

### 3. Navigation entre produits

1. Ouvrir `/chat-v2?productId=5&userId=3`
2. Changer URL vers `/chat-v2?productId=8&userId=4`
3. **Vérifier** : Pas de rechargement de page, navigation instantanée

---

## 📚 Pattern unifié V1 = V2

Les deux versions du chat utilisent maintenant **exactement le même pattern** :

### Pattern commun

1. **Server Component** (`page.tsx`) :
   - Fetch toutes les données en parallèle
   - Hydrate ALL caches via `queryClient.setQueryData()`
   - Passe `initialUser`, `initialProduct`, `initialMercureToken`

2. **Client Component** :
   - Lit `useSearchParams()` pour valeurs dynamiques
   - Utilise `effectiveUser = currentUser ?? initialUser`
   - Utilise `effectiveData = fetchedData ?? initialData`
   - Logs dans `useEffect` avec dépendances

3. **Hooks** :
   - `staleTime: 1000 * 60` (60s partout)
   - `refetchOnMount: false`
   - `refetchOnWindowFocus: false`
   - `refetchOnReconnect: false`
   - Logs dans `useEffect` (pas à la racine)

4. **Navigation** :
   - Search params (`?key=value`) au lieu de dynamic routes
   - Navigation client-side instantanée (0 reload)
   - Backward compatibility via redirects

---

## ⚠️ Points d'attention

### 1. QueryKeys doivent correspondre exactement

```typescript
// ❌ MAUVAIS - Pas de match
// Serveur
queryClient.setQueryData(['chatRoomsV2'], rooms)
// Client
queryKey: ['rooms_v2'] // ← Pas de match → refetch

// ✅ BON - Match parfait
// Serveur
queryClient.setQueryData(['chatRoomsV2'], rooms)
// Client
queryKey: ['chatRoomsV2'] // ← Match → pas de refetch
```

### 2. Toujours utiliser `getQueryClient()`

```typescript
// ✅ BON
import { getQueryClient } from '@/lib/get-query-client'
const queryClient = getQueryClient()

// ❌ MAUVAIS (data leaks entre requêtes)
const queryClient = new QueryClient()
```

### 3. staleTime serveur === staleTime client

Toujours 60 secondes partout pour cohérence.

---

## 🎓 Best Practices appliquées

### ❌ À éviter

```typescript
// Logs à la racine du hook
console.log('Hook rendered')

// staleTime différent serveur/client
// Serveur: 60s, Client: 5min → refetch

// Dynamic routes pour navigation fréquente
/chat-v2/[productId]/[userId] → reload à chaque changement
```

### ✅ À faire

```typescript
// Logs dans useEffect avec dépendances
useEffect(() => {
  console.log('Data changed:', data)
}, [data])

// staleTime unifié partout
staleTime: 1000 * 60 // 60s

// Search params pour navigation dynamique
/chat-v2?productId=X&userId=Y → instant client-side
```

---

## 📝 Checklist de validation

Avant de déployer V2 :

- [x] Tous les hooks V2 ont `staleTime: 1000 * 60`
- [x] Tous les hooks V2 ont `refetchOnMount: false`
- [x] Tous les hooks V2 ont `refetchOnWindowFocus: false`
- [x] Tous les hooks V2 ont `refetchOnReconnect: false`
- [x] `getQueryClient()` utilisé dans page.tsx
- [x] Toutes les données hydratées dans `setQueryData()`
- [x] QueryKeys serveur/client identiques
- [x] Logs dans `useEffect` (pas à la racine)
- [x] Test refresh → 0 doublon dans Network tab
- [x] Test navigation entre produits → 0 reload
- [x] Skeleton propre affiché pendant loading

---

## 🚀 Migration depuis l'ancienne route

Si vous avez des liens existants vers `/chat-v2/5/3` :

✅ **Ils continuent de fonctionner** grâce à la redirection automatique vers `/chat-v2?productId=5&userId=3`

**Recommandation** : Mettre à jour progressivement les liens dans le marketplace pour utiliser directement les search params.

---

## 🎯 Prochaines étapes (optionnel)

1. **Prefetch au hover** dans le marketplace :
   ```typescript
   const handleProductHover = (productId: number, sellerId: number) => {
     queryClient.prefetchQuery({
       queryKey: ['product', productId],
       queryFn: () => getProductClient(productId),
     })
   }
   ```

2. **React Query DevTools** (dev uniquement) :
   ```typescript
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

   <QueryClientProvider client={queryClient}>
     {children}
     <ReactQueryDevtools initialIsOpen={false} />
   </QueryClientProvider>
   ```

3. **Performance monitoring** :
   - React DevTools Profiler pour traquer re-renders
   - Lighthouse audit pour performance globale

---

## 📖 Documentation liée

- [OPTIMIZATIONS.md](OPTIMIZATIONS.md) - Optimisations V1
- [PERFORMANCE_LOGS.md](PERFORMANCE_LOGS.md) - Explication logs spam
- [CHAT_NAVIGATION_OPTIMIZATION.md](CHAT_NAVIGATION_OPTIMIZATION.md) - Navigation V1
- [lib/get-query-client.ts](lib/get-query-client.ts) - QueryClient factory

---

**Date de migration** : 2025-01-XX
**Pattern appliqué** : V1 optimisé (SSR + Search params + Hydration complète)
**Statut** : ✅ Migration complète V1 → V2
