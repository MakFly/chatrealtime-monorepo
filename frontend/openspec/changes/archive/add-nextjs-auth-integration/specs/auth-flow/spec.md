# Flux d'Authentification JWT - Delta

## ADDED Requirements

### Requirement: Email/Password Login SHALL Be Supported

The system SHALL permettre aux utilisateurs de se connecter avec leurs identifiants email et mot de passe via une Server Action Next.js sécurisée.

#### Scenario: Connexion réussie avec credentials valides

- **WHEN** l'utilisateur soumet le formulaire de connexion avec email et mot de passe valides
- **THEN** le système appelle l'API backend `POST /api/v1/auth/login`
- **AND** stocke l'access token et le refresh token dans des cookies HTTP-only
- **AND** redirige l'utilisateur vers `/dashboard` ou la page initialement demandée
- **AND** affiche les informations utilisateur (email, name, picture)

#### Scenario: Connexion échouée - Credentials invalides

- **WHEN** l'utilisateur soumet des credentials incorrects
- **THEN** le système affiche un message d'erreur "Identifiants invalides"
- **AND** ne crée aucun cookie
- **AND** reste sur la page de login

#### Scenario: Connexion échouée - Compte Google SSO uniquement

- **WHEN** l'utilisateur tente de se connecter avec un email qui utilise uniquement Google SSO
- **THEN** le système affiche "Ce compte utilise uniquement Google Sign-In"
- **AND** propose le bouton "Sign in with Google"

---

### Requirement: User Registration MUST Be Supported

The system SHALL permettre aux nouveaux utilisateurs de créer un compte avec email et mot de passe.

#### Scenario: Inscription réussie

- **WHEN** l'utilisateur soumet le formulaire d'inscription avec email, mot de passe (≥8 caractères) et nom optionnel
- **THEN** le système appelle `POST /api/v1/auth/register`
- **AND** crée un nouveau compte utilisateur dans le backend
- **AND** stocke les tokens dans des cookies HTTP-only
- **AND** redirige vers `/dashboard`

#### Scenario: Inscription échouée - Email déjà utilisé

- **WHEN** l'utilisateur tente de s'inscrire avec un email déjà enregistré
- **THEN** le système affiche "Un compte avec cet email existe déjà"
- **AND** propose le lien "Se connecter"

#### Scenario: Inscription échouée - Mot de passe trop court

- **WHEN** l'utilisateur soumet un mot de passe de moins de 8 caractères
- **THEN** le système affiche une erreur de validation côté client
- **AND** n'appelle pas l'API backend

---

### Requirement: Secure Logout SHALL Be Implemented

The system SHALL permettre aux utilisateurs de se déconnecter et invalider leurs tokens.

#### Scenario: Déconnexion réussie

- **WHEN** l'utilisateur clique sur "Se déconnecter"
- **THEN** le système appelle `POST /api/v1/auth/logout` avec le refresh token
- **AND** supprime tous les cookies d'authentification
- **AND** redirige vers `/login`

---

### Requirement: Automatic Token Refresh MUST Be Implemented

The system SHALL renouveler automatiquement l'access token avant son expiration pour éviter les interruptions.

#### Scenario: Refresh avant expiration

- **WHEN** l'access token est sur le point d'expirer (moins de 5 minutes restantes)
- **THEN** le système appelle automatiquement `POST /api/v1/auth/refresh` avec le refresh token
- **AND** met à jour l'access token dans le cookie
- **AND** conserve le refresh token existant
- **AND** continue l'opération utilisateur sans interruption

#### Scenario: Refresh token expiré

- **WHEN** le refresh token est expiré ou invalide
- **THEN** le système supprime tous les cookies
- **AND** redirige vers `/login`
- **AND** affiche "Votre session a expiré. Veuillez vous reconnecter."

---

### Requirement: Form Validation with Zod SHALL Be Enforced

The system SHALL valider tous les inputs utilisateur côté client et serveur avec des schémas Zod.

#### Scenario: Validation côté client - Email invalide

- **WHEN** l'utilisateur saisit un email mal formaté (ex: "test@")
- **THEN** le formulaire affiche "Adresse email invalide" en temps réel
- **AND** désactive le bouton submit tant que l'erreur persiste

#### Scenario: Validation côté serveur via Server Action

- **WHEN** une Server Action reçoit des données
- **THEN** elle DOIT valider avec le schéma Zod correspondant
- **AND** retourner des erreurs structurées en cas d'échec de validation
- **AND** ne jamais appeler l'API backend avec des données invalides

---

### Requirement: Robust Error Handling MUST Be Implemented

The system SHALL gérer toutes les erreurs d'authentification de manière claire et sécurisée.

#### Scenario: Erreur réseau lors du login

- **WHEN** la requête API échoue pour des raisons réseau
- **THEN** le système affiche "Impossible de se connecter au serveur. Vérifiez votre connexion."
- **AND** permet de réessayer

#### Scenario: Erreur 500 du backend

- **WHEN** le backend retourne une erreur 500
- **THEN** le système affiche "Une erreur est survenue. Veuillez réessayer plus tard."
- **AND** log l'erreur pour debugging (sans exposer les détails à l'utilisateur)

#### Scenario: Token invalide lors d'une requête

- **WHEN** une requête API retourne 401 Unauthorized
- **THEN** le système tente un refresh automatique
- **AND** si le refresh échoue, déconnecte l'utilisateur et redirige vers `/login`
