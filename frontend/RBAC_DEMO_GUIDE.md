# 🎯 Guide de Démo RBAC (Role-Based Access Control)

## 📍 Routes Créées

Voici les routes créées pour tester le composant `role-based-component.tsx` :

### 1. **`/profile`** - Page Profil
- Route protégée (nécessite connexion)
- Affiche le composant `RoleBasedComponent`
- Explique le fonctionnement du RBAC
- Informations techniques sur l'architecture

### 2. **`/demo/roles`** - Démo Complète RBAC
- Route protégée (nécessite connexion)
- Page dédiée à la démonstration du système RBAC
- Exemples de code
- Instructions de test détaillées
- Explication de tous les hooks disponibles

## 🚀 Comment Tester

### Étape 1: Connectez-vous
```bash
# Utilisez /dev-login pour un test rapide
http://localhost:3000/dev-login

# Ou /login pour le flow normal
http://localhost:3000/login
```

### Étape 2: Accédez aux pages de démo
Via la navbar, cliquez sur votre avatar puis :
- **Mon Profil** → `/profile`
- **Démo RBAC** → `/demo/roles`

### Étape 3: Observez le contenu dynamique
Le composant `RoleBasedComponent` affichera différents éléments selon vos rôles :

#### Tous les utilisateurs voient :
- ✅ Informations de base (nom, email, liste des rôles)
- ✅ Carte "User Information"
- ✅ Contenu commun en bas

#### Si vous avez `ROLE_ADMIN` :
- ✅ **Carte rouge "Admin Panel"** avec actions destructives
- ✅ Peut aussi voir les outils de modération

#### Si vous avez `ROLE_ADMIN` OU `ROLE_MODERATOR` :
- ✅ **Carte jaune "Moderation Tools"** avec outils de modération

## 🧪 Tester Différents Rôles

### Option 1: Modifier via la BDD (Recommandé)
```sql
-- Connectez-vous à PostgreSQL
docker exec -it <container_name> psql -U app

-- Voir les utilisateurs
SELECT id, email, name, roles FROM "user";

-- Ajouter ROLE_ADMIN à un utilisateur
UPDATE "user" 
SET roles = '["ROLE_USER", "ROLE_ADMIN"]'::jsonb 
WHERE email = 'user@test.com';

-- Ajouter ROLE_MODERATOR
UPDATE "user" 
SET roles = '["ROLE_USER", "ROLE_MODERATOR"]'::jsonb 
WHERE email = 'user@test.com';

-- Plusieurs rôles
UPDATE "user" 
SET roles = '["ROLE_USER", "ROLE_ADMIN", "ROLE_MODERATOR"]'::jsonb 
WHERE email = 'user@test.com';

-- Retirer tous les rôles sauf USER
UPDATE "user" 
SET roles = '["ROLE_USER"]'::jsonb 
WHERE email = 'user@test.com';
```

### Option 2: Créer plusieurs comptes
Créez différents comptes de test avec différents rôles assignés dans la BDD.

## 📚 Hooks Disponibles

### `useUser()`
Récupère toutes les informations utilisateur.

```tsx
import { useUser } from '@/lib/contexts/user-context'

const user = useUser()
// user: { id, email, name, picture, roles, created_at, has_google_account } | null
```

### `useHasRole(role: string)`
Vérifie si l'utilisateur a un rôle spécifique.

```tsx
import { useHasRole } from '@/lib/contexts/user-context'

const isAdmin = useHasRole('ROLE_ADMIN')
// isAdmin: boolean
```

### `useHasAnyRole(roles: string[])`
Vérifie si l'utilisateur a **au moins un** des rôles spécifiés.

```tsx
import { useHasAnyRole } from '@/lib/contexts/user-context'

const canModerate = useHasAnyRole(['ROLE_ADMIN', 'ROLE_MODERATOR'])
// canModerate: boolean (true si ADMIN OU MODERATOR)
```

### `useHasAllRoles(roles: string[])`
Vérifie si l'utilisateur a **tous** les rôles spécifiés.

```tsx
import { useHasAllRoles } from '@/lib/contexts/user-context'

const isSuperAdmin = useHasAllRoles(['ROLE_ADMIN', 'ROLE_SUPER_USER'])
// isSuperAdmin: boolean (true seulement si ADMIN ET SUPER_USER)
```

## 🎨 Exemple d'Utilisation

```tsx
'use client'

import { useUser, useHasRole } from '@/lib/contexts/user-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function AdminPanel() {
  const user = useUser()
  const isAdmin = useHasRole('ROLE_ADMIN')

  if (!user) {
    return <p>Veuillez vous connecter</p>
  }

  return (
    <Card>
      <h2>Bienvenue, {user.name || user.email}!</h2>
      
      {/* Visible seulement pour les admins */}
      {isAdmin && (
        <div className="admin-section">
          <h3>Panneau Administrateur</h3>
          <Button variant="destructive">
            Supprimer tous les utilisateurs
          </Button>
        </div>
      )}
    </Card>
  )
}
```

## 🔍 Debug

### AuthDebugButton
Un bouton flottant en bas à droite affiche :
- ✅ État d'authentification
- ✅ Informations utilisateur
- ✅ Rôles actuels
- ✅ Expiration des tokens
- ✅ Auto-refresh toutes les 5 secondes

Parfait pour vérifier vos rôles en temps réel !

## 📁 Architecture des Fichiers

```
frontend/
├── app/
│   ├── (protected)/
│   │   ├── profile/
│   │   │   └── page.tsx              # Route /profile
│   │   └── demo/
│   │       ├── page.tsx               # Redirect vers /demo/roles
│   │       └── roles/
│   │           └── page.tsx           # Route /demo/roles
│   └── layout.tsx                     # AuthProvider global
├── components/
│   ├── examples/
│   │   └── role-based-component.tsx   # Composant RBAC de démo
│   └── layout/
│       └── public-navbar.tsx          # Navbar avec liens
└── lib/
    ├── contexts/
    │   └── user-context.tsx           # UserContext + hooks RBAC
    ├── providers/
    │   └── auth-provider.tsx          # Provider unifié
    └── store/
        └── use-auth-store.ts          # Store minimal (isAuthenticated)
```

## ✅ Checklist de Test

- [ ] Se connecter via `/dev-login` ou `/login`
- [ ] Accéder à `/profile` via la navbar
- [ ] Voir ses informations utilisateur affichées
- [ ] Vérifier que seuls les rôles appropriés affichent le contenu admin/modération
- [ ] Accéder à `/demo/roles` via la navbar
- [ ] Lire la documentation complète
- [ ] Modifier ses rôles dans la BDD
- [ ] Rafraîchir la page (hard reload avec `window.location.href`)
- [ ] Vérifier que le contenu change selon les nouveaux rôles
- [ ] Ouvrir `AuthDebugButton` pour voir les rôles en temps réel

## 💡 Astuces

1. **Hard Reload après modification BDD**
   - Après avoir modifié les rôles en BDD, faites un hard reload (`Ctrl+Shift+R` ou `Cmd+Shift+R`)
   - Ou cliquez sur "Déconnexion" puis reconnectez-vous

2. **Vérifier les rôles actuels**
   - Cliquez sur le bouton `AuthDebugButton` (coin inférieur droit)
   - Onglet "User Info" affiche vos rôles

3. **Tester rapidement**
   - Utilisez `/dev-login` avec `user@test.com` / `password123`
   - Token expire en 30 secondes pour tester le refresh
   - Modifiez les rôles dans la BDD entre deux tests

---

**Créé pour démontrer le système RBAC de l'application Chat Realtime**

