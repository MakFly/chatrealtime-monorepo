# Gestion de Session - Delta

## ADDED Requirements

### Requirement: Secure Token Storage in HTTP-only Cookies MUST Be Implemented

The system SHALL stocker les tokens JWT dans des cookies HTTP-only sécurisés, jamais dans localStorage ou sessionStorage.

#### Scenario: Création de cookies après login

- **WHEN** l'utilisateur se connecte avec succès
- **THEN** le système crée deux cookies :
  - `accessToken` avec l'access token JWT
  - `refreshToken` avec le refresh token
- **AND** configure les cookies avec les attributs suivants :
  - `httpOnly: true` (inaccessible via JavaScript)
  - `secure: true` (uniquement HTTPS en production)
  - `sameSite: 'lax'` (protection CSRF)
  - `path: '/'`
  - `maxAge: 3600` pour accessToken (1 heure)
  - `maxAge: 2592000` pour refreshToken (30 jours)

#### Scenario: Tentative d'accès aux tokens via JavaScript

- **WHEN** un script tente d'accéder à `document.cookie` ou `localStorage`
- **THEN** les tokens NE DOIVENT PAS être accessibles
- **AND** seules les requêtes HTTP peuvent lire les cookies

---

### Requirement: Server-Side Session Verification SHALL Be Enforced

The system SHALL vérifier l'authentification côté serveur dans les Server Components et Server Actions.

#### Scenario: Accès à une route protégée (Server Component)

- **WHEN** un Server Component charge (ex: `app/(dashboard)/layout.tsx`)
- **THEN** il DOIT appeler `getSession()` pour vérifier les cookies
- **AND** si aucun access token valide n'est trouvé, rediriger vers `/login`
- **AND** si l'access token est valide, récupérer les données utilisateur

#### Scenario: Vérification dans une Server Action

- **WHEN** une Server Action protégée est appelée
- **THEN** elle DOIT utiliser `authActionClient` de next-safe-action
- **AND** vérifier la présence d'un access token valide
- **AND** retourner une erreur "Unauthorized" si non authentifié

---

### Requirement: Session Persistence MUST Be Maintained

The system SHALL maintenir la session utilisateur entre les rechargements de page et les fermetures de navigateur.

#### Scenario: Rechargement de la page

- **WHEN** l'utilisateur recharge une page protégée
- **THEN** le système lit les cookies existants
- **AND** vérifie la validité de l'access token
- **AND** si valide, affiche la page sans redemander de login
- **AND** si expiré mais refresh token valide, effectue un refresh automatique

#### Scenario: Fermeture et réouverture du navigateur

- **WHEN** l'utilisateur ferme le navigateur puis le rouvre dans les 30 jours
- **THEN** le refresh token persiste (cookie non expiré)
- **AND** l'utilisateur est automatiquement reconnecté via refresh
- **AND** peut continuer sa session sans se reconnecter

---

### Requirement: Authentication State Hook for Client Components SHALL Be Provided

The system SHALL fournir un hook `useAuth()` pour accéder à l'état d'authentification dans les Client Components.

#### Scenario: Utilisation de useAuth() dans un composant

- **WHEN** un Client Component utilise `const { user, isLoading, isAuthenticated } = useAuth()`
- **THEN** le hook retourne :
  - `user`: objet User ou `null`
  - `isLoading`: `true` pendant la vérification initiale
  - `isAuthenticated`: `true` si l'utilisateur est connecté
- **AND** utilise TanStack Query pour cacher les données et éviter les requêtes répétées

#### Scenario: Loading state initial

- **WHEN** le composant monte pour la première fois
- **THEN** `isLoading` est `true`
- **AND** affiche un skeleton ou spinner
- **AND** une fois la session vérifiée, `isLoading` passe à `false`

---

### Requirement: Complete Session Cleanup on Logout MUST Be Performed

The system SHALL supprimer tous les cookies et données de session lors de la déconnexion.

#### Scenario: Logout complet

- **WHEN** l'utilisateur se déconnecte
- **THEN** le système supprime les cookies `accessToken` et `refreshToken`
- **AND** invalide le refresh token côté backend via `POST /api/v1/auth/logout`
- **AND** efface le cache TanStack Query pour les données utilisateur
- **AND** redirige vers `/login`

---

### Requirement: Session Error Handling SHALL Be Implemented

The system SHALL gérer les cas où la session est corrompue ou invalide.

#### Scenario: Cookie corrompu

- **WHEN** le système détecte un cookie `accessToken` mal formaté ou corrompu
- **THEN** il supprime le cookie
- **AND** tente un refresh avec le `refreshToken` si disponible
- **AND** si le refresh échoue, déconnecte l'utilisateur

#### Scenario: Session expirée pendant navigation

- **WHEN** l'utilisateur navigue et que les deux tokens sont expirés
- **THEN** le système supprime tous les cookies
- **AND** redirige vers `/login?redirect_to=/current-page`
- **AND** après reconnexion, redirige vers la page demandée
