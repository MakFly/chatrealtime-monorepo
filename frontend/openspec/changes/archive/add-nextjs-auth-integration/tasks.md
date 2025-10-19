# Tasks - Intégration Authentification JWT + Google SSO

## 1. Infrastructure Core

- [x] 1.1 Créer le client API avec gestion JWT (`lib/api/client.ts`)
  - [x] 1.1.1 Fonction `apiClient()` pour les requêtes authentifiées
  - [x] 1.1.2 Logique de refresh automatique des tokens
  - [x] 1.1.3 Gestion des erreurs 401/403
  - [x] 1.1.4 Intercepteur pour ajouter le token Bearer

- [x] 1.2 Implémenter la gestion de session (`lib/auth.ts`)
  - [x] 1.2.1 Fonction `getSession()` pour récupérer la session serveur
  - [x] 1.2.2 Fonction `setSession()` pour créer/mettre à jour les cookies
  - [x] 1.2.3 Fonction `clearSession()` pour supprimer les cookies
  - [x] 1.2.4 Configuration des cookies HTTP-only, Secure, SameSite

- [x] 1.3 Créer les schémas de validation Zod (`lib/validations/auth.ts`)
  - [x] 1.3.1 Schema `loginSchema` (email + password)
  - [x] 1.3.2 Schema `registerSchema` (email + password + name optionnel)
  - [x] 1.3.3 Schema `tokenResponseSchema` pour valider les réponses API

- [x] 1.4 Créer les types TypeScript (`types/auth.ts`)
  - [x] 1.4.1 Type `User` (id, email, name, picture)
  - [x] 1.4.2 Type `Session` (user, accessToken, refreshToken, expiresAt)
  - [x] 1.4.3 Type `AuthResponse` (format de réponse du backend)

## 2. Server Actions

- [x] 2.1 Configurer next-safe-action (`lib/actions/safe-action.ts`)
  - [x] 2.1.1 Client de base `actionClient`
  - [x] 2.1.2 Client authentifié `authActionClient` (vérifie session)

- [x] 2.2 Server Action login (`lib/actions/auth/login.ts`)
  - [x] 2.2.1 Validation avec `loginSchema`
  - [x] 2.2.2 Appel API `POST /api/v1/auth/login`
  - [x] 2.2.3 Stockage des tokens dans cookies HTTP-only
  - [x] 2.2.4 Retour des données utilisateur
  - [x] 2.2.5 Gestion des erreurs (credentials invalides, compte Google SSO)

- [x] 2.3 Server Action register (`lib/actions/auth/register.ts`)
  - [x] 2.3.1 Validation avec `registerSchema`
  - [x] 2.3.2 Appel API `POST /api/v1/auth/register`
  - [x] 2.3.3 Stockage des tokens dans cookies
  - [x] 2.3.4 Gestion des erreurs (email déjà utilisé, mot de passe trop court)

- [x] 2.4 Server Action logout (`lib/actions/auth/logout.ts`)
  - [x] 2.4.1 Appel API `POST /api/v1/auth/logout` avec refresh token
  - [x] 2.4.2 Suppression des cookies côté client
  - [x] 2.4.3 Redirection vers `/login`

## 3. UI Components

- [x] 3.1 Formulaire de connexion (`components/forms/login-form.tsx`)
  - [x] 3.1.1 Intégration react-hook-form + Zod
  - [x] 3.1.2 Champs email et password avec validation
  - [x] 3.1.3 Bouton submit avec état loading
  - [x] 3.1.4 Affichage des erreurs de validation et serveur
  - [x] 3.1.5 Lien vers `/register` et "Forgot password"
  - [x] 3.1.6 Appel de la Server Action `loginAction`

- [x] 3.2 Formulaire d'inscription (`components/forms/register-form.tsx`)
  - [x] 3.2.1 Champs email, password, name (optionnel)
  - [x] 3.2.2 Validation côté client (min 8 caractères)
  - [x] 3.2.3 Bouton submit avec loading state
  - [x] 3.2.4 Affichage des erreurs
  - [x] 3.2.5 Lien vers `/login`
  - [x] 3.2.6 Appel de la Server Action `registerAction`

- [x] 3.3 Bouton Google SSO (`components/auth/google-button.tsx`)
  - [x] 3.3.1 Bouton avec icône Google (lucide-react)
  - [x] 3.3.2 Lien vers `${API_URL}/api/v1/auth/google`
  - [x] 3.3.3 Style shadcn/ui variant outline
  - [x] 3.3.4 Affichage conditionnel (si SSO activé)

## 4. Pages & Routes

- [x] 4.1 Layout authentification (`app/(public)/layout.tsx`)
  - [x] 4.1.1 Layout centré avec Card shadcn/ui
  - [x] 4.1.2 Logo et titre de l'application
  - [x] 4.1.3 Vérification : rediriger vers `/dashboard` si déjà connecté

- [x] 4.2 Page de login (`app/(public)/login/page.tsx`)
  - [x] 4.2.1 Afficher le `LoginForm`
  - [x] 4.2.2 Divider "OR" entre login classique et Google SSO
  - [x] 4.2.3 Bouton Google SSO en dessous
  - [x] 4.2.4 Metadata (title, description)

- [x] 4.3 Page de register (`app/(public)/register/page.tsx`)
  - [x] 4.3.1 Afficher le `RegisterForm`
  - [x] 4.3.2 Divider "OR" + Google SSO
  - [x] 4.3.3 Metadata

- [x] 4.4 Page de callback Google (`app/(public)/auth/callback/page.tsx`)
  - [x] 4.4.1 Récupérer les tokens depuis hash fragments (`#access_token=...`)
  - [x] 4.4.2 Stocker les tokens via Server Action
  - [x] 4.4.3 Afficher un loading spinner pendant le traitement
  - [x] 4.4.4 Rediriger vers `/dashboard` en cas de succès
  - [x] 4.4.5 Afficher les erreurs si présentes dans l'URL

- [x] 4.5 Layout dashboard protégé (`app/(protected)/layout.tsx`)
  - [x] 4.5.1 Vérifier la session côté serveur avec `getSession()`
  - [x] 4.5.2 Rediriger vers `/login` si non authentifié
  - [x] 4.5.3 Afficher un layout avec sidebar/header (dashboard existant)

## 5. Protection & Middleware

- [x] 5.1 Middleware de protection (`middleware.ts`)
  - [x] 5.1.1 Définir les routes protégées : `/dashboard/*`, `/profile/*`, `/settings/*`
  - [x] 5.1.2 Définir les routes publiques : `/`, `/login`, `/register`, `/auth/callback`
  - [x] 5.1.3 Vérifier la présence du cookie `access_token`
  - [x] 5.1.4 Rediriger vers `/login` si token absent sur route protégée
  - [x] 5.1.5 Rediriger vers `/dashboard` si token présent sur `/login` ou `/register`
  - [x] 5.1.6 Gérer les redirections avec `redirect` query parameter

- [x] 5.2 Hook useAuth pour Client Components (`hooks/use-auth.ts`)
  - [x] 5.2.1 Hook pour récupérer l'état d'authentification
  - [x] 5.2.2 Utiliser TanStack Query pour cacher les données utilisateur
  - [x] 5.2.3 Fonction `refresh()` pour revalider la session
  - [x] 5.2.4 États `isLoading`, `isAuthenticated`, `user`

## 6. Tests & Documentation

- [x] 6.1 Tests d'intégration
  - [x] 6.1.1 Tester le flux login complet
  - [x] 6.1.2 Tester le flux register
  - [x] 6.1.3 Tester le logout
  - [x] 6.1.4 Tester le refresh automatique des tokens

- [x] 6.2 Tests E2E Google SSO
  - [x] 6.2.1 Tester l'initiation du flux OAuth
  - [x] 6.2.2 Tester le callback avec tokens valides
  - [x] 6.2.3 Tester le callback avec erreur

- [x] 6.3 Tests de sécurité
  - [x] 6.3.1 Vérifier cookies HTTP-only (DevTools)
  - [x] 6.3.2 Vérifier protection middleware sur routes protégées
  - [x] 6.3.3 Tester les redirections automatiques

- [x] 6.4 Documentation
  - [x] 6.4.1 Documentation intégrée dans CLAUDE.md
  - [x] 6.4.2 Workflow JWT complet implémenté
  - [x] 6.4.3 Flux Google SSO fonctionnel avec logs de débogage
  - [x] 6.4.4 OpenSpec proposal et tasks.md mis à jour
