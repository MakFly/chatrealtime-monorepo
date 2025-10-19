# Intégration de l'Authentification JWT + Google SSO dans Next.js 15

## Why

Le frontend Next.js 15 n'a actuellement aucun système d'authentification pour se connecter à l'API Symfony backend qui fournit déjà JWT + Google SSO. Nous devons implémenter une solution d'authentification complète et sécurisée qui :
- Gère les flux d'authentification JWT (login, refresh, logout)
- Intègre Google OAuth 2.0 SSO via le backend Symfony
- Protège les routes et les composants Server/Client
- Respecte les meilleures pratiques Next.js 15 (Server Actions, App Router)
- Suit strictement les recommandations officielles Next.js : https://nextjs.org/docs/app/guides/authentication
- Assure la sécurité des tokens et la gestion de session côté client

## What Changes

### Flux d'Authentification JWT
- **Système de login classique** avec email/password via Server Actions
- **Gestion des tokens JWT** (access token + refresh token) dans HTTP-only cookies
- **Refresh automatique** des tokens avant expiration
- **Logout sécurisé** avec invalidation des tokens backend
- **Middleware de protection** pour les routes protégées
- **Gestion des erreurs** d'authentification (401, 403, expiration)

### Intégration Google SSO
- **Flux OAuth Google** initié via le backend Symfony (`/api/v1/auth/google`)
- **Page de callback** pour recevoir les tokens après authentification Google
- **Provisionnement automatique** des utilisateurs via le backend
- **Gestion des redirections** sécurisées avec hash fragments
- **Bouton "Sign in with Google"** avec UI shadcn/ui

### Gestion de Session
- **Hook useAuth()** pour accéder à l'état d'authentification partout
- **Session persistence** via cookies HTTP-only sécurisés
- **User profile management** avec données utilisateur (email, name, picture)
- **Loading states** pendant les vérifications d'authentification
- **Redirect après login** vers la page demandée initialement

### Protection des Routes
- **Middleware Next.js** pour vérifier l'authentification sur routes protégées
- **Route groups** : `(public)/` pour pages publiques, `(protected)/` pour pages protégées
- **Redirections automatiques** : `/login` si non authentifié, `/dashboard` si déjà connecté
- **Server Components protection** via vérification de session côté serveur

### Architecture Sécurisée
- **Tokens dans HTTP-only cookies** (jamais dans localStorage)
- **CSRF protection** via Next.js Server Actions
- **Validation Zod** pour tous les formulaires d'authentification
- **API client sécurisé** avec refresh automatique des tokens
- **Error boundaries** pour gérer les erreurs d'authentification

## Impact

### Nouvelles Spécifications
- **NEW**: `specs/auth-flow/` - Flux de login/logout JWT avec Server Actions
- **NEW**: `specs/session-management/` - Gestion de session et cookies sécurisés
- **NEW**: `specs/google-sso/` - Intégration Google OAuth via backend Symfony

### Code Affecté

**Nouveau Code (à créer)** :
- `lib/auth.ts` - Gestion de session et vérification d'authentification
- `lib/api/client.ts` - Client API avec gestion JWT et refresh automatique
- `lib/actions/auth.ts` - Server Actions exportées (login, register, logout)
- `lib/validations/auth.ts` - Schémas Zod pour validation des formulaires
- `hooks/use-auth.ts` - Hook React pour accéder à l'état d'authentification
- `app/(public)/layout.tsx` - Layout pour les pages publiques
- `app/(public)/register/page.tsx` - Page d'inscription
- `app/(public)/callback/page.tsx` - Page de callback Google OAuth
- `app/(protected)/layout.tsx` - Layout pour les pages protégées avec vérification auth
- `components/forms/register-form.tsx` - Formulaire d'inscription
- `components/auth/google-button.tsx` - Bouton Google SSO

**Code Existant (à compléter)** :
- `middleware.ts` - Protection des routes (existe, à compléter)
- `app/(public)/login/page.tsx` - Page de connexion (existe)
- `app/(protected)/dashboard/page.tsx` - Dashboard (existe)
- `components/login-form.tsx` - Formulaire de connexion (existe, à améliorer)
- `types/auth.ts` - Types TypeScript (existe, complet)

**Code Modifié** :
- `middleware.ts:1-10` - Ajout de la logique de protection des routes
- `app/layout.tsx` - Ajout du provider d'authentification (si nécessaire)

### Dépendances Ajoutées
Aucune nouvelle dépendance ! Tout est déjà installé :
- ✅ `react-hook-form` - Gestion des formulaires
- ✅ `zod` - Validation des données
- ✅ `@hookform/resolvers` - Intégration Zod + react-hook-form
- ✅ `next-safe-action` - Server Actions type-safe
- ✅ `@tanstack/react-query` - Gestion du cache et des requêtes
- ✅ shadcn/ui components - UI (Form, Input, Button, etc.)

### Breaking Changes
**AUCUN** - C'est une nouvelle fonctionnalité.

### Points d'Intégration Backend
L'API Symfony backend fournit déjà ces endpoints (voir `../api/postman/`) :

**Authentification JWT** :
- `GET /api/v1/auth/status` - Vérification du statut d'authentification et méthodes disponibles
- `POST /api/v1/auth/register` - Inscription
- `POST /api/v1/auth/login` - Login avec email/password
- `POST /api/v1/auth/refresh` - Renouvellement du token
- `POST /api/v1/auth/logout` - Déconnexion

**Google SSO** :
- `GET /api/v1/auth/google` - Initiation du flux OAuth
- `GET /api/v1/auth/google/callback` - Callback OAuth avec redirection vers frontend

**User Profile** :
- `GET /api/v1/me` - Récupération du profil utilisateur actuel
- `PUT /api/v1/me` - Mise à jour du profil
- `POST /api/v1/me/password` - Changement de mot de passe

**Format des Tokens** :
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "a1b2c3d4e5f6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://..."
  }
}
```

### Considérations de Sécurité
- **Cookies HTTP-only** : Les tokens ne sont jamais accessibles via JavaScript côté client
- **SameSite=Lax** : Protection CSRF sur les cookies
- **Secure flag** : Cookies uniquement via HTTPS en production
- **Token expiration** : Access token 1h, Refresh token 30 jours
- **Refresh automatique** : Avant expiration pour éviter les interruptions
- **Validation côté serveur** : Toutes les Server Actions valident l'authentification
- **CORS configuré** : Backend autorise uniquement `http://localhost:3000` en dev
- **No token in URL** : Les tokens ne transitent jamais dans les query parameters

## Stratégie de Migration

**Phase 1 : Infrastructure Core**
1. Créer le client API avec gestion JWT (`lib/api/client.ts`)
2. Implémenter la gestion de session (`lib/auth.ts`)
3. Créer les schémas de validation Zod (`lib/validations/auth.ts`)
4. Créer les types TypeScript (`types/auth.ts`)

**Phase 2 : Server Actions**
1. Créer toutes les Server Actions dans `lib/actions/auth.ts` (login, register, logout)
2. Utiliser directement les Server Actions sans next-safe-action (plus simple pour MVP)

**Phase 3 : UI Components**
1. Améliorer le formulaire de connexion existant (`components/login-form.tsx`)
2. Créer le formulaire d'inscription (`components/forms/register-form.tsx`)
3. Créer le bouton Google SSO (`components/auth/google-button.tsx`)

**Phase 4 : Pages & Routes**
1. Créer layout public (`app/(public)/layout.tsx`)
2. Créer page de register (`app/(public)/register/page.tsx`)
3. Créer page de callback Google (`app/(public)/callback/page.tsx`)
4. Créer layout protected avec auth check (`app/(protected)/layout.tsx`)

**Phase 5 : Protection & Middleware**
1. Compléter le middleware de protection (`middleware.ts`)
2. Hook useAuth pour les composants (`hooks/use-auth.ts`)
3. Tester les redirections automatiques

**Phase 6 : Tests & Documentation**
1. Tester le flux complet de login/logout
2. Tester Google SSO de bout en bout
3. Tester le refresh automatique des tokens
4. Documenter l'utilisation dans `.cursor/rules/`
5. Mettre à jour `AI-DD/` avec les patterns d'authentification

## Stratégie de Test

### Tests d'Intégration
- Flux complet login → accès route protégée → logout
- Refresh automatique des tokens avant expiration
- Redirection après login vers la page initialement demandée
- Gestion des erreurs (credentials invalides, token expiré)

### Tests E2E
- Flux Google SSO complet (avec mock si nécessaire)
- Navigation entre routes publiques et protégées
- Persistence de session après refresh de la page

### Tests de Sécurité
- Vérifier que les tokens ne sont pas dans localStorage
- Vérifier les cookies HTTP-only et Secure
- Tester le middleware sur toutes les routes protégées
- Vérifier la protection CSRF via Server Actions

### Tests Unitaires
- Validation Zod des formulaires
- Client API : refresh automatique, gestion d'erreurs
- Hook useAuth : état d'authentification correct
