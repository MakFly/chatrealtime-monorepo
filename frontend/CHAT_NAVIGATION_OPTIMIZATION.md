# 🚀 Optimisation Navigation Chat - Éviter les Reloads

## 🔍 Problème actuel

Lorsqu'on change de room (Room 1 → Room 2), on observe :

1. **Skeleton affiché** pendant 200-500ms
2. **Page reload complète** (Server Component refetch)
3. **Perte de scroll position** et état UI
4. **Expérience utilisateur saccadée**

### Pourquoi ?

```
User clique Room 2
    ↓
router.push('/chat/2')      ← Navigation Next.js
    ↓
Server Component refetch     ← page.tsx est async
    ↓
verifyChatRoomAccess(2)     ← Fetch serveur
Promise.all([...])          ← Fetch mercure, rooms, messages, user
    ↓
Skeleton pendant 200-500ms  ← loading.tsx affiché
    ↓
Page rendue                 ← Nouvelles données
```

## ✅ Solutions possibles

### Option A : Navigation Client-Side Pure (RECOMMANDÉ) ⭐

**Principe**: Une seule page `/chat` qui gère tous les rooms via search params.

**URL**: `/chat?roomId=2` au lieu de `/chat/2`

**Avantages**:
- ✅ Navigation instantanée (0 reload)
- ✅ Pas de Server Component refetch
- ✅ Préservation du scroll et état UI
- ✅ Prefetch automatique des messages

**Inconvénients**:
- ❌ URLs moins "jolies" (search params vs path)
- ❌ Nécessite refactoring léger

**Implémentation**:

```typescript
// app/(protected)/chat/page.tsx (Server Component)
import { searchParams } from 'next/navigation'

export default async function ChatPage({ searchParams }) {
  const roomId = parseInt(searchParams.roomId || '0', 10)

  // Fetch données initiales
  const queryClient = getQueryClient()
  const [token, rooms, messages, user] = await Promise.all([
    getMercureToken(),
    getChatRoomsServer(),
    roomId > 0 ? getMessagesServer(roomId) : null,
    getCurrentUser(),
  ])

  // Hydrate cache
  // ... (comme actuellement)

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RealChatInterface
        initialMercureToken={token}
        initialRoomId={roomId}
        initialUser={user}
      />
    </HydrationBoundary>
  )
}

// app-sidebar.tsx
const handleRoomSelect = (room: ChatRoom) => {
  // Navigation client-side sans reload
  router.push(`/chat?roomId=${room.id}`, { scroll: false })
}

// real-chat-interface.tsx
'use client'

export function RealChatInterface({ initialRoomId, ... }) {
  const searchParams = useSearchParams()
  const currentRoomId = parseInt(searchParams.get('roomId') || '0', 10)

  // Fetch messages dynamiquement quand roomId change
  const { messages } = useChatMessages({
    roomId: currentRoomId,
    enabled: currentRoomId > 0,
  })

  // Pas de reload, juste refetch côté client
}
```

---

### Option B : Prefetch + Instant Navigation

**Principe**: Prefetch les données de la room avant de naviguer.

**Avantages**:
- ✅ Navigation quasi-instantanée
- ✅ Garde les URLs jolies `/chat/2`
- ✅ Moins de refactoring

**Inconvénients**:
- ❌ Toujours un léger flash pendant 50-100ms
- ❌ Plus complexe à implémenter

**Implémentation**:

```typescript
// app-sidebar.tsx
const handleRoomSelect = async (room: ChatRoom) => {
  // 1. Prefetch les messages de la room cible
  await queryClient.prefetchQuery({
    queryKey: ['messages', room.id, undefined],
    queryFn: () => getMessagesClient(room.id),
  })

  // 2. Navigate après prefetch (données déjà en cache)
  router.push(`/chat/${room.id}`)
}
```

---

### Option C : Parallel Routes (Next.js 15 Advanced)

**Principe**: Utiliser `@room` parallel route pour navigation sans unmount.

**Structure**:
```
app/(protected)/chat/
  ├── page.tsx              # Layout stable
  ├── @room/
  │   ├── default.tsx       # Empty state
  │   └── [roomId]/
  │       └── page.tsx      # Room content
  └── layout.tsx
```

**Avantages**:
- ✅ Navigation ultra-fluide
- ✅ Pas d'unmount du layout
- ✅ URLs propres

**Inconvénients**:
- ❌ Complexe à setup
- ❌ Overkill pour ce cas d'usage

---

## 🎯 Recommandation finale

### Pour ton app de chat : **Option A** (Search Params)

**Pourquoi ?**
1. **Simplicité**: Minimal refactoring
2. **Performance**: 0 reload, navigation instantanée
3. **SEO**: Pas critique pour un chat (zone protégée)
4. **UX**: Meilleure expérience utilisateur

**URLs**:
- Avant: `/chat/1`, `/chat/2`
- Après: `/chat?roomId=1`, `/chat?roomId=2`

### Implémentation étape par étape

#### Étape 1 : Modifier la page pour accepter search params

```typescript
// app/(protected)/chat/page.tsx
export default async function ChatPage({
  searchParams,
}: {
  searchParams: { roomId?: string }
}) {
  const roomId = parseInt(searchParams.roomId || '0', 10)

  // ... reste identique
}
```

#### Étape 2 : Supprimer le dossier `[roomId]`

```bash
rm -rf app/(protected)/chat/[roomId]
```

#### Étape 3 : Modifier la navigation

```typescript
// app-sidebar.tsx
const handleRoomSelect = (room: ChatRoom) => {
  router.push(`/chat?roomId=${room.id}`, { scroll: false })
}
```

#### Étape 4 : Lire le roomId côté client

```typescript
// real-chat-interface.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export function RealChatInterface({ ... }) {
  const searchParams = useSearchParams()
  const urlRoomId = parseInt(searchParams.get('roomId') || '0', 10)

  // Utiliser urlRoomId au lieu de initialRoomId
}
```

---

## 📊 Comparaison perf

| Métrique | Avant (Dynamic Route) | Après (Search Params) |
|----------|----------------------|----------------------|
| Navigation time | 200-500ms | 0-50ms |
| Server requests | 5 (refetch) | 1 (messages only) |
| Skeleton flash | Oui | Non |
| Scroll preserved | Non | Oui |
| URL "beauty" | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| UX | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 Bonus : Prefetch au hover

Pour rendre la navigation encore plus rapide :

```typescript
// app-sidebar.tsx
const handleRoomHover = (room: ChatRoom) => {
  // Prefetch messages au survol
  queryClient.prefetchQuery({
    queryKey: ['messages', room.id, undefined],
    queryFn: () => getMessagesClient(room.id),
  })
}

<SidebarMenuButton
  onClick={() => handleRoomSelect(room)}
  onMouseEnter={() => handleRoomHover(room)}
>
```

Avec ça, les messages sont déjà en cache quand l'utilisateur clique ! 🔥
