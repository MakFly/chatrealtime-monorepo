# 🐛 Problème des logs multiples lors de l'envoi de messages

## 🔍 Diagnostic

Lors de l'envoi d'un message, on observe **3 re-renders** :

```
[useChatRooms] 🏠 Extracted rooms: 3 rooms
[useChatRooms] 🔌 Mercure connection status: Connected
[useChatRooms] 🏠 Extracted rooms: 3 rooms
[useChatRooms] 🔌 Mercure connection status: Connected
[useChatRooms] 🏠 Extracted rooms: 3 rooms
[useChatRooms] 🔌 Mercure connection status: Connected
```

### Pourquoi 3 re-renders ?

```
User envoie message "Hello"
    ↓
1. addOptimisticMessage()          ← State change
   → Message affiché immédiatement (ID: -1)
   → RE-RENDER #1

2. API POST /messages              ← HTTP request
   → Mercure broadcast message
   → handleMercureMessage()
   → setQueryData(['messages', roomId])
   → Message optimiste remplacé par message réel (ID: 42)
   → RE-RENDER #2

3. Backend update room.lastMessage ← Room entity updated
   → Mercure broadcast room update
   → handleMercureRoom()
   → setQueryData(['chatRooms'])
   → Room.lastMessage updated
   → RE-RENDER #3
```

### Problème initial

Les **console.log étaient à la racine du hook** :

```typescript
// ❌ MAUVAIS : S'exécute à CHAQUE render
export function useChatRooms() {
  const { rooms } = useQuery(...)

  console.log('Rooms:', rooms.length) // ← 3 fois lors d'un message

  return { rooms }
}
```

## ✅ Solution

### Mettre les logs dans useEffect

```typescript
// ✅ BON : S'exécute UNIQUEMENT quand les données changent
export function useChatRooms() {
  const { rooms } = useQuery(...)

  useEffect(() => {
    if (rooms.length > 0) {
      console.log('[useChatRooms] 🏠 Extracted rooms:', rooms.length, 'rooms')
    }
  }, [rooms.length]) // ← S'exécute quand rooms.length change

  return { rooms }
}
```

### Pourquoi useEffect ?

- ✅ S'exécute **après le render** (pas pendant)
- ✅ Contrôle précis via **dependency array**
- ✅ Log uniquement quand **données changent vraiment**

## 🎯 Optimisations appliquées

### 1. use-chat-rooms.ts

**Avant** :
```typescript
console.log('[useChatRooms] 🏠 Extracted rooms:', rooms.length, 'rooms')
console.log('[useChatRooms] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
```

**Après** :
```typescript
useEffect(() => {
  if (rooms.length > 0) {
    console.log('[useChatRooms] 🏠 Extracted rooms:', rooms.length, 'rooms')
  }
}, [rooms.length])

useEffect(() => {
  console.log('[useChatRooms] 🔌 Mercure connection status:', connected ? 'Connected' : 'Disconnected')
}, [connected])
```

### 2. Autres hooks à optimiser (si besoin)

Pour éviter les logs spammy partout :

```typescript
// use-current-user.ts
useEffect(() => {
  console.log('[useCurrentUser] ✅ User loaded:', user?.email)
}, [user?.email])

// use-mercure-token.ts
useEffect(() => {
  console.log('[useMercureToken] Token status:', token ? 'Present' : 'Missing')
}, [!!token])
```

## 📊 Résultat attendu

### Avant (3 logs par render)
```
User envoie message
  ↓
[useChatRooms] 🏠 Extracted rooms: 3 rooms  ← Render #1
[useChatRooms] 🔌 Mercure status: Connected
[useChatRooms] 🏠 Extracted rooms: 3 rooms  ← Render #2
[useChatRooms] 🔌 Mercure status: Connected
[useChatRooms] 🏠 Extracted rooms: 3 rooms  ← Render #3
[useChatRooms] 🔌 Mercure status: Connected
```

### Après (1 log si données changent)
```
User envoie message
  ↓
[useChatRooms] 🏠 Extracted rooms: 3 rooms  ← 1 seule fois (rooms.length inchangé)
  (aucun autre log car connected reste true)
```

## 🔧 Autres optimisations possibles

### 1. React.memo pour les composants lourds

```typescript
// chat-messages.tsx
export const ChatMessages = React.memo(function ChatMessages({ messages, ... }) {
  // ...
}, (prev, next) => {
  // Custom comparison : re-render UNIQUEMENT si messages changent
  return prev.messages.length === next.messages.length &&
         prev.messages[prev.messages.length - 1]?.id ===
         next.messages[next.messages.length - 1]?.id
})
```

### 2. useMemo pour calculs lourds

```typescript
// Éviter de recalculer à chaque render
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}, [messages])
```

### 3. useCallback pour fonctions passées en props

```typescript
// Éviter de recréer la fonction à chaque render
const handleMessageSent = useCallback(() => {
  console.log('Message sent')
}, [])
```

## 🎓 Best Practices

### ❌ À éviter

```typescript
// Logs à la racine du composant
console.log('Component rendered')

// Logs dans le render
return (
  <div>
    {console.log('Rendering div')}
    Content
  </div>
)
```

### ✅ À faire

```typescript
// Logs dans useEffect avec dépendances
useEffect(() => {
  console.log('Component mounted or data changed')
}, [data])

// Logs conditionnels
if (process.env.NODE_ENV === 'development') {
  console.log('Dev only log')
}
```

## 📝 Checklist de production

Avant de déployer :

- [ ] Tous les `console.log` dans `useEffect` avec dépendances
- [ ] Logs de debug en mode `development` uniquement
- [ ] Pas de logs dans le render path
- [ ] React Query DevTools activé en dev uniquement
- [ ] Performance profiling fait (React DevTools Profiler)

## 🚀 Pour aller plus loin

1. **React Query DevTools** pour visualiser les re-fetches :
   ```typescript
   import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

   <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
   ```

2. **React DevTools Profiler** pour traquer les re-renders :
   - Ouvrir React DevTools
   - Onglet "Profiler"
   - Record → Envoyer message → Stop
   - Analyser les flamegraphs

3. **Why Did You Render** (bibliothèque) :
   ```bash
   bun add -d @welldone-software/why-did-you-render
   ```
