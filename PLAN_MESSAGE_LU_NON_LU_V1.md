# Plan : Système de messages lus/non lus pour Chat V1 (/chat)

## Architecture choisie : **Approche simple et performante**
- Tracking par participant dans `ChatParticipant`
- Calcul des non lus : messages avec `id > lastReadMessageId`
- Badge de compteur dans la sidebar
- Marquage automatique lors de la visualisation

---

## Phase 1 : Backend - Tracking des lectures (TDD Required)

### 1.1 Écrire les tests FIRST (TDD obligatoire)
**Fichier** : `/api/tests/Entity/ChatParticipantTest.php`

Tests à créer :
```php
✅ test_can_mark_as_read()
✅ test_last_read_message_is_tracked()
✅ test_last_read_at_timestamp_is_set()
✅ test_unread_count_calculation()
```

### 1.2 Modifier l'entity ChatParticipant
**Fichier** : `/api/src/Entity/ChatParticipant.php`

Ajouter les champs :
```php
#[ORM\Column(nullable: true)]
#[Groups(['chatParticipant:read'])]
private ?\DateTimeImmutable $lastReadAt = null;

#[ORM\Column(nullable: true)]
#[Groups(['chatParticipant:read'])]
private ?int $lastReadMessageId = null;
```

Ajouter les méthodes :
- `getLastReadAt(): ?\DateTimeImmutable`
- `setLastReadAt(): static`
- `getLastReadMessageId(): ?int`
- `setLastReadMessageId(): static`
- `markAsRead(Message $message): static` - Helper method

### 1.3 Créer la migration Doctrine
```bash
docker exec chatrealtime php bin/console make:migration
# Puis vérifier et appliquer la migration
docker exec chatrealtime php bin/console doctrine:migrations:migrate --no-interaction
```

### 1.4 Créer MessageRepository avec query d'optimisation
**Fichier** : `/api/src/Repository/MessageRepository.php` (actuellement vide)

Méthodes à ajouter :
```php
public function countUnreadForUserInRoom(User $user, ChatRoom $room): int
{
    // Trouver le participant
    // Compter messages avec id > lastReadMessageId
    // Retourner le count
}

public function getLastMessageInRoom(ChatRoom $room): ?Message
{
    // Retourner le dernier message de la room
}
```

### 1.5 Créer le service de marquage comme lu
**Fichier** : `/api/src/Service/MarkAsReadServiceInterface.php`
```php
interface MarkAsReadServiceInterface
{
    public function markAsRead(ChatRoom $room, User $user, Message $message): void;
    public function markAllAsRead(ChatRoom $room, User $user): void;
}
```

**Fichier** : `/api/src/Service/MarkAsReadService.php`
```php
- Injecter ChatParticipantRepository, EntityManager
- Implémenter markAsRead() et markAllAsRead()
- Gérer les transactions
- Logger les actions
```

### 1.6 Créer le processor pour l'endpoint
**Fichier** : `/api/src/State/MarkAsReadProcessor.php`

Endpoint : `POST /api/v1/chat_rooms/{id}/mark-read`

Body :
```json
{
  "messageId": 123  // Dernier message lu
}
```

Logic :
- Récupérer le user courant
- Valider qu'il est participant
- Appeler le service MarkAsRead
- Retourner la room mise à jour

### 1.7 Ajouter l'opération à ChatRoom
**Fichier** : `/api/src/Entity/ChatRoom.php`

Dans les `operations` :
```php
new Post(
    uriTemplate: '/v1/chat_rooms/{id}/mark-read',
    security: "is_granted('VIEW', object)",
    processor: MarkAsReadProcessor::class,
    name: 'mark_as_read'
)
```

### 1.8 Modifier ChatRoomCollectionProvider pour inclure unreadCount
**Fichier** : `/api/src/State/ChatRoomCollectionProvider.php`

- Calculer dynamiquement `unreadCount` pour chaque room
- Utiliser une query optimisée (LEFT JOIN + COUNT)
- Ajouter au contexte de sérialisation

**OU** ajouter une méthode dans ChatRoom :
```php
#[Groups(['chatRoom:read'])]
public function getUnreadCountForUser(User $user): int
{
    // Calculer le nombre de messages non lus
}
```

### 1.9 Tests fonctionnels
**Fichier** : `/api/tests/Feature/MarkAsReadTest.php`

Tests à créer :
```php
✅ test_can_mark_messages_as_read()
✅ test_unread_count_decreases_after_mark_read()
✅ test_non_participant_cannot_mark_as_read()
✅ test_marking_as_read_updates_timestamp()
✅ test_mark_all_as_read_in_room()
```

---

## Phase 2 : Frontend - UI des messages lus/non lus

### 2.1 Mettre à jour les types TypeScript
**Fichier** : `/frontend/types/chat.ts`

```typescript
// Ajouter aux types existants
type ChatParticipant = {
  id: number
  user: User | string  // IRI or User object
  chatRoom: ChatRoom | string  // IRI or ChatRoom object
  role: 'admin' | 'member'
  joinedAt: string
  lastReadAt?: string  // NOUVEAU
  lastReadMessageId?: number  // NOUVEAU
}

type ChatRoom = {
  id: number
  name: string
  type: 'direct' | 'group' | 'public'
  participants?: ChatParticipant[]
  messages?: Message[]
  createdAt: string
  updatedAt: string
  unreadCount?: number  // NOUVEAU - Calculé pour l'utilisateur courant
}
```

### 2.2 Créer la fonction API client
**Fichier** : `/frontend/lib/api/chat-client.ts`

Ajouter :
```typescript
export async function markAsReadClient(
  roomId: number,
  messageId: number
) {
  return clientPostV2(`${ENDPOINTS.CHAT_ROOMS}/${roomId}/mark-read`, {
    messageId
  })
}
```

### 2.3 Créer le hook de marquage comme lu
**Fichier** : `/frontend/lib/hooks/chat-v1/use-mark-as-read.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markAsReadClient } from '@/lib/api/chat-client'

export function useMarkAsRead(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: number) => markAsReadClient(roomId, messageId),
    onSuccess: () => {
      // Invalider le cache des rooms pour mettre à jour unreadCount
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] })
      queryClient.invalidateQueries({ queryKey: ['messages', roomId] })
    }
  })
}
```

### 2.4 Afficher les badges de messages non lus dans la sidebar
**Fichier** : `/frontend/app/(protected)/chat/_components/app-sidebar.tsx`

Dans la liste des rooms, ajouter le badge :
```tsx
<div className="flex items-center justify-between gap-2">
  <span className="text-sm font-semibold truncate">
    {room.name}
  </span>
  {/* NOUVEAU : Badge de messages non lus */}
  {room.unreadCount && room.unreadCount > 0 && (
    <Badge
      variant="destructive"
      className="h-5 min-w-5 rounded-full px-1.5 flex items-center justify-center text-xs font-bold"
    >
      {room.unreadCount > 99 ? '99+' : room.unreadCount}
    </Badge>
  )}
</div>
```

### 2.5 Marquer automatiquement comme lu lors du scroll
**Fichier** : `/frontend/app/(protected)/chat/_components/real-chat-interface.tsx`

Utiliser Intersection Observer pour détecter la visibilité du dernier message :
```tsx
const messagesEndRef = useRef<HTMLDivElement>(null)
const markAsRead = useMarkAsRead(roomId)

useEffect(() => {
  if (!roomId || messages.length === 0) return

  const lastMessage = messages[messages.length - 1]

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && lastMessage.id) {
        // Attendre 1 seconde avant de marquer comme lu
        setTimeout(() => {
          markAsRead.mutate(lastMessage.id)
        }, 1000)
      }
    },
    { threshold: 0.5 }  // 50% visible
  )

  if (messagesEndRef.current) {
    observer.observe(messagesEndRef.current)
  }

  return () => observer.disconnect()
}, [messages, roomId])
```

### 2.6 Marquer comme lu à l'ouverture du chat
**Fichier** : `/frontend/app/(protected)/chat/_components/real-chat-interface.tsx`

```tsx
// Marquer automatiquement comme lu après 2 secondes d'ouverture
useEffect(() => {
  if (roomId && messages.length > 0 && !isLoadingMessages) {
    const lastMessage = messages[messages.length - 1]

    const timer = setTimeout(() => {
      markAsRead.mutate(lastMessage.id)
    }, 2000)  // 2 secondes après l'ouverture

    return () => clearTimeout(timer)
  }
}, [roomId, messages, isLoadingMessages])
```

### 2.7 Afficher un séparateur "Nouveaux messages" (Optionnel)
**Fichier** : `/frontend/app/(protected)/chat/_components/chat-messages.tsx`

Si `currentUser.lastReadMessageId` existe, afficher un séparateur visuel :
```tsx
{messages.map((message, index) => (
  <div key={message.id}>
    {/* Séparateur "Nouveaux messages" */}
    {lastReadMessageId &&
     index > 0 &&
     messages[index - 1].id === lastReadMessageId && (
      <div className="flex items-center gap-2 my-4">
        <Separator className="flex-1" />
        <Badge variant="secondary" className="text-xs">
          Nouveaux messages
        </Badge>
        <Separator className="flex-1" />
      </div>
    )}

    {/* Message normal */}
    <MessageItem message={message} />
  </div>
))}
```

### 2.8 Ajouter indicateurs de lecture (Style Messenger)
**Fichier** : `/frontend/app/(protected)/chat/_components/chat-messages.tsx`

Pour les messages de l'utilisateur courant :
```tsx
{message.author.id === currentUserId && (
  <div className="flex items-center gap-1 mt-1">
    {isMessageRead(message.id) ? (
      <>
        <CheckCheck className="h-3 w-3 text-blue-500" />
        <span className="text-xs text-blue-500">Lu</span>
      </>
    ) : (
      <>
        <CheckCheck className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Envoyé</span>
      </>
    )}
  </div>
)}
```

---

## Phase 3 : Optimisations & Polish

### 3.1 Index de base de données
**Dans la migration** :
```php
$table->index('last_read_message_id');
$table->index(['user_id', 'chat_room_id']);
```

### 3.2 Eager loading pour performance
**Dans ChatRoomRepository** :
```php
// Charger les participants avec leurs derniers messages lus
->leftJoin('cr.participants', 'p')
->addSelect('p')
```

### 3.3 Gestion de la mémoire
- Limiter le nombre de messages chargés (pagination)
- Ne pas charger tous les messages pour calculer unreadCount
- Utiliser des queries COUNT optimisées

### 3.4 Cas limites à gérer
- Messages supprimés (si soft delete implémenté)
- Utilisateur rejoint après des messages existants
- Synchronisation multi-tabs (Mercure)
- Room sans messages

---

## Résumé des fichiers modifiés/créés

### Backend (API)

**Modifiés** :
- ✏️ `/api/src/Entity/ChatParticipant.php` - Ajouter lastReadAt, lastReadMessageId
- ✏️ `/api/src/Entity/ChatRoom.php` - Ajouter opération mark-read
- ✏️ `/api/src/Repository/MessageRepository.php` - Ajouter queries unread count
- ✏️ `/api/src/State/ChatRoomCollectionProvider.php` - Calculer unreadCount

**Créés** :
- 🆕 Migration pour lastReadAt/lastReadMessageId
- 🆕 `/api/src/Service/MarkAsReadServiceInterface.php`
- 🆕 `/api/src/Service/MarkAsReadService.php`
- 🆕 `/api/src/State/MarkAsReadProcessor.php`
- 🆕 `/api/tests/Entity/ChatParticipantTest.php`
- 🆕 `/api/tests/Feature/MarkAsReadTest.php`
- 🆕 `/api/tests/Service/MarkAsReadServiceTest.php`

### Frontend

**Modifiés** :
- ✏️ `/frontend/types/chat.ts` - Ajouter types pour read status
- ✏️ `/frontend/lib/api/chat-client.ts` - Ajouter markAsReadClient
- ✏️ `/frontend/app/(protected)/chat/_components/app-sidebar.tsx` - Badges non lus
- ✏️ `/frontend/app/(protected)/chat/_components/chat-messages.tsx` - Séparateur + indicateurs
- ✏️ `/frontend/app/(protected)/chat/_components/real-chat-interface.tsx` - Auto-mark as read

**Créés** :
- 🆕 `/frontend/lib/hooks/chat-v1/use-mark-as-read.ts`

---

## Ordre d'implémentation recommandé (TDD)

1. **Tests d'abord** (Phase 1.1) ⚠️ CRITICAL
2. **Backend entity + migration** (Phase 1.2-1.3)
3. **Backend repository queries** (Phase 1.4)
4. **Backend service** (Phase 1.5)
5. **Backend endpoint** (Phase 1.6-1.7)
6. **Backend provider update** (Phase 1.8)
7. **Backend tests fonctionnels** (Phase 1.9)
8. **Frontend types + API client** (Phase 2.1-2.2)
9. **Frontend hook** (Phase 2.3)
10. **Frontend UI badges** (Phase 2.4)
11. **Frontend auto-mark** (Phase 2.5-2.6)
12. **Frontend indicators** (Phase 2.7-2.8)
13. **Optimizations** (Phase 3)

---

## Résultat attendu

✅ Badge rouge avec nombre de messages non lus dans la sidebar
✅ Marquage automatique comme lu lors du scroll (après 1-2s)
✅ Marquage automatique à l'ouverture du chat
✅ Séparateur visuel "Nouveaux messages"
✅ Indicateurs de lecture (Check bleu) sur les messages envoyés
✅ Performant (queries optimisées avec index)
✅ Respect strict TDD (tests écrits AVANT le code)
✅ SOLID compliance (interfaces, services)

---

## Notes importantes

⚠️ **TDD Obligatoire** : Tous les tests doivent être écrits AVANT le code
⚠️ **SOLID Principles** : Utiliser des interfaces, services minces
⚠️ **Controllers < 50 lignes** : Toute la logique dans les services
⚠️ **Pas de `any` en TypeScript** : Types stricts partout
⚠️ **Utilisez `type`, jamais `interface`** : Standard du projet
