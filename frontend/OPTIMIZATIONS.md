# 🚀 Optimisations Next.js 15 + React Query v5 pour /chat

## ✅ Modifications effectuées

### 1. QueryClient Factory avec React cache() ✨

**Fichier**: [lib/get-query-client.ts](lib/get-query-client.ts)

**Problème**: Créer un nouveau `QueryClient` sans `cache()` peut causer des fuites de données entre requêtes.

**Solution**: Utiliser `cache()` de React pour garantir une instance unique par requête.

```typescript
import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

export const getQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 60s - données fraîches après hydratation
        gcTime: 5 * 60 * 1000, // 5min - conservation des données
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  })
})
```

**Impact**: ✅ Prévention des fuites de données + meilleure gestion mémoire

---

### 2. Hydratation complète du cache SSR ✨

**Fichiers**:
- [app/(protected)/chat/[roomId]/page.tsx](app/(protected)/chat/[roomId]/page.tsx)
- [app/(protected)/chat/page.tsx](app/(protected)/chat/page.tsx)

**Problème**: Seules `chatRooms` et `messages` étaient hydratées, pas `user` ni `mercureToken`.

**Solution**: Hydrater TOUTES les données utilisées par les hooks client.

```typescript
const queryClient = getQueryClient()

const [mercureToken, rooms, messages, user] = await Promise.all([...])

// Hydrate user cache (used by useCurrentUser hook)
if (user) {
  queryClient.setQueryData(['user', 'me'], user)
}

// Hydrate rooms cache (used by useChatRooms hook)
if (rooms && rooms.length > 0) {
  queryClient.setQueryData(['chatRooms', undefined, undefined], {
    member: rooms,
  })
}

// Hydrate messages cache (used by useChatMessages hook)
if (messages) {
  queryClient.setQueryData(['messages', roomIdNumber, undefined], messages)
}

// Hydrate Mercure token cache (used by useMercureToken hook)
if (mercureToken) {
  queryClient.setQueryData(['mercure', 'token'], mercureToken)
}
```

**Impact**: ✅ Élimination des fetches client pour `user` et `mercureToken`

---

### 3. Alignement `staleTime` serveur/client ✨

**Fichiers modifiés**:
- [components/providers.tsx](components/providers.tsx)
- [lib/hooks/use-current-user.ts](lib/hooks/use-current-user.ts)
- [lib/hooks/use-chat-rooms.ts](lib/hooks/use-chat-rooms.ts)
- [lib/hooks/use-chat-messages.ts](lib/hooks/use-chat-messages.ts)
- [lib/hooks/use-mercure-token.ts](lib/hooks/use-mercure-token.ts)

**Problème**: `staleTime` différent entre serveur (60s) et client (5min) → React Query considère les données SSR comme "stale" → refetch immédiat.

**Solution**: Aligner TOUS les `staleTime` sur 60 secondes.

**Avant**:
```typescript
// providers.tsx
staleTime: 60 * 1000, // 1 minute

// use-current-user.ts
staleTime: 1000 * 60 * 5, // 5 minutes ❌ MISMATCH
```

**Après**:
```typescript
// Partout
staleTime: 1000 * 60, // 60 seconds - matches server config ✅
```

**Impact**: ✅ Pas de refetch après hydratation SSR

---

### 4. Configuration complète des hooks ✨

**Tous les hooks** ont maintenant:

```typescript
refetchOnMount: false,        // Pas de refetch au mount (données SSR fraîches)
refetchOnWindowFocus: false,  // Pas de refetch au focus (Mercure gère le temps réel)
refetchOnReconnect: false,    // Pas de refetch à la reconnexion (Mercure gère)
```

**Impact**: ✅ Élimination de tous les refetches automatiques inutiles

---

### 5. Logs de débogage ✨

Ajout de logs explicites dans tous les hooks pour tracker les fetches:

```typescript
console.log('[useCurrentUser] 🔍 Fetching user from API...')
console.log('[useCurrentUser] ✅ Fetched from API:', user.email)
```

**Impact**: ✅ Visibilité complète sur les appels API en dev

---

## 📊 Résultats attendus

### Avant optimisation ❌
```
Page refresh /chat/3:
- GET /api/v1/mercure/token (serveur)
- GET /api/v1/chat_rooms (serveur)
- GET /api/v1/messages (serveur)
- GET /api/v1/user/me (serveur)
- GET /api/chat_rooms/3 (serveur - vérification)
- GET /api/users/me (client) ❌ DOUBLON
- GET /api/chat/rooms (client) ❌ DOUBLON
- GET /api/chat/messages (client) ❌ DOUBLON
- GET /api/v1/mercure/token (client) ❌ DOUBLON

TOTAL: 9 requêtes (5 serveur + 4 doublons client)
```

### Après optimisation ✅
```
Page refresh /chat/3:
- GET /api/v1/mercure/token (serveur)
- GET /api/v1/chat_rooms (serveur)
- GET /api/v1/messages (serveur)
- GET /api/v1/user/me (serveur)
- GET /api/chat_rooms/3 (serveur - vérification)

TOTAL: 5 requêtes (serveur uniquement, 0 doublon)
```

**Gain**: 🎯 **-44% de requêtes** (9 → 5)

---

## 🔍 Comment vérifier

### 1. Ouvrir la console navigateur
```bash
# Les logs montreront:
[useChatRooms] 🏠 Extracted rooms: 5 rooms
```

**Si vous voyez** `🔍 Fetching from API...` → ❌ Problème (fetch non hydraté)
**Si vous ne voyez PAS** ce log → ✅ OK (données hydratées utilisées)

### 2. Onglet Network
Filtrer par `API` et vérifier qu'il n'y a que les 5 requêtes serveur.

### 3. React Query Devtools (optionnel)
```bash
bun add -d @tanstack/react-query-devtools
```

Puis dans `providers.tsx`:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  {children}
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

Vérifier que toutes les queries ont `status: success` et `isFetching: false`.

---

## 📚 Références

- [TanStack Query v5 SSR Guide](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr)
- [Next.js 15 Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [React cache()](https://react.dev/reference/react/cache)
- [Next.js 15 Caching](https://nextjs.org/docs/app/building-your-application/caching)

---

## ⚠️ Points d'attention

### 1. Toujours utiliser `getQueryClient()`
```typescript
// ✅ BON
import { getQueryClient } from '@/lib/get-query-client'
const queryClient = getQueryClient()

// ❌ MAUVAIS
const queryClient = new QueryClient()
```

### 2. Hydrater TOUTES les queries utilisées
Si un composant utilise `useXyz()`, le serveur doit hydrater `['xyz', ...]`.

### 3. QueryKeys doivent correspondre exactement
```typescript
// Serveur
queryClient.setQueryData(['user', 'me'], user)

// Client hook
queryKey: ['user', 'me'] // ✅ MATCH
queryKey: ['currentUser'] // ❌ NO MATCH → refetch
```

### 4. staleTime serveur === staleTime client
Toujours 60 secondes partout pour cohérence.

---

## 🎯 Checklist avant commit

- [ ] Tous les hooks ont `staleTime: 1000 * 60`
- [ ] Tous les hooks ont `refetchOnMount: false`
- [ ] `getQueryClient()` utilisé dans les Server Components
- [ ] Toutes les données hydratées dans `setQueryData()`
- [ ] QueryKeys serveur/client identiques
- [ ] Logs de débogage présents
- [ ] Test refresh → 0 doublon dans Network tab
