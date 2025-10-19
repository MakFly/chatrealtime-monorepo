# Intégration Google SSO - Delta

## ADDED Requirements

### Requirement: Google OAuth Flow Initiation SHALL Be Supported

The system SHALL permettre aux utilisateurs de se connecter via Google OAuth 2.0 en redirigeant vers le backend Symfony.

#### Scenario: Clic sur "Sign in with Google"

- **WHEN** l'utilisateur clique sur le bouton "Sign in with Google"
- **THEN** le système redirige vers `${API_URL}/api/v1/auth/google`
- **AND** le backend Symfony initie le flux OAuth avec Google
- **AND** l'utilisateur est redirigé vers la page de consentement Google

#### Scenario: SSO désactivé côté backend

- **WHEN** le bouton Google SSO est affiché mais le SSO est désactivé (env `SSO_ENABLED=false`)
- **THEN** le bouton NE DOIT PAS être visible
- **AND** le système vérifie l'état SSO via `GET /api/v1/auth/status` au chargement de la page

---

### Requirement: OAuth Callback Handling MUST Be Implemented

The system SHALL gérer le callback Google OAuth et extraire les tokens depuis les hash fragments.

#### Scenario: Callback réussi avec tokens

- **WHEN** Google redirige vers `/auth/callback#access_token=xxx&refresh_token=yyy&token_type=Bearer`
- **THEN** la page de callback extrait les paramètres depuis le hash fragment (`window.location.hash`)
- **AND** affiche un loading spinner pendant le traitement
- **AND** appelle une Server Action pour stocker les tokens dans des cookies HTTP-only
- **AND** redirige vers `/dashboard` après succès

#### Scenario: Callback avec erreur Google

- **WHEN** Google redirige avec une erreur : `/auth/callback#error=authentication_failed&message=...`
- **THEN** la page de callback affiche le message d'erreur
- **AND** propose un lien pour retourner à `/login`
- **AND** ne crée aucun cookie

#### Scenario: Callback - Utilisateur annule l'autorisation

- **WHEN** l'utilisateur annule l'autorisation sur la page Google
- **THEN** Google redirige avec `#error=authentication_cancelled`
- **AND** la page affiche "Authentification annulée"
- **AND** redirige vers `/login` après 3 secondes

---

### Requirement: Automatic Google User Provisioning SHALL Be Performed

The system SHALL créer ou mettre à jour automatiquement le compte utilisateur via le backend lors du callback Google.

#### Scenario: Premier login Google (nouvel utilisateur)

- **WHEN** un utilisateur se connecte pour la première fois via Google
- **THEN** le backend Symfony crée automatiquement un compte avec :
  - `email` depuis Google
  - `name` depuis Google
  - `picture` (URL de l'avatar Google)
  - `googleId` (identifiant Google unique)
  - `password` = `null` (compte Google uniquement)
- **AND** génère des tokens JWT
- **AND** redirige le frontend avec les tokens dans le hash

#### Scenario: Login Google pour utilisateur existant

- **WHEN** un utilisateur avec un `googleId` existant se connecte
- **THEN** le backend met à jour les données Google (name, picture) si modifiées
- **AND** génère de nouveaux tokens JWT
- **AND** redirige avec les tokens

---

### Requirement: Google SSO Flow Security MUST Be Enforced

The system SHALL garantir la sécurité du flux OAuth et la protection des tokens.

#### Scenario: Tokens dans hash fragments (pas query params)

- **WHEN** le backend redirige vers le callback
- **THEN** les tokens DOIVENT être dans le hash fragment (`#access_token=...`)
- **AND** PAS dans les query parameters (`?access_token=...`)
- **AND** les hash fragments ne sont jamais envoyés au serveur (restent côté client)

#### Scenario: Extraction des tokens côté client uniquement

- **WHEN** la page de callback charge
- **THEN** elle extrait les tokens via JavaScript côté client (`window.location.hash`)
- **AND** appelle immédiatement une Server Action pour les stocker dans des cookies
- **AND** efface le hash de l'URL après extraction (`window.history.replaceState()`)

#### Scenario: Protection CSRF

- **WHEN** le flux OAuth est initié
- **THEN** le backend Symfony DOIT inclure un état CSRF (via KnpUOAuth2ClientBundle)
- **AND** vérifier cet état lors du callback
- **AND** rejeter les callbacks avec état CSRF invalide

---

### Requirement: Google SSO Button UI SHALL Be Implemented

The system SHALL afficher un bouton "Sign in with Google" conforme aux guidelines Google et utilisant shadcn/ui.

#### Scenario: Affichage du bouton sur /login et /register

- **WHEN** l'utilisateur visite `/login` ou `/register`
- **THEN** le bouton Google SSO est affiché en dessous du formulaire
- **AND** séparé par un divider "OR"
- **AND** utilise l'icône Google de lucide-react
- **AND** suit le style shadcn/ui variant `outline`

#### Scenario: Désactivation conditionnelle du bouton

- **WHEN** le SSO est désactivé (`SSO_ENABLED=false` dans le backend)
- **THEN** le bouton NE DOIT PAS être affiché
- **AND** seul le formulaire email/password est visible

---

### Requirement: Google SSO Error Handling MUST Be Implemented

The system SHALL gérer toutes les erreurs possibles du flux OAuth de manière claire.

#### Scenario: Erreur backend lors du callback

- **WHEN** le backend Symfony retourne une erreur lors du provisionnement de l'utilisateur
- **THEN** le callback redirige avec `#error=authentication_failed&message=...`
- **AND** la page de callback affiche "Échec de l'authentification avec Google"
- **AND** propose de réessayer

#### Scenario: Tokens manquants dans le callback

- **WHEN** le hash fragment ne contient pas `access_token` ou `refresh_token`
- **THEN** la page affiche "Authentification incomplète. Veuillez réessayer."
- **AND** redirige vers `/login` après 3 secondes

#### Scenario: Erreur réseau lors de l'extraction des tokens

- **WHEN** la Server Action échoue à stocker les tokens
- **THEN** la page affiche "Impossible de finaliser l'authentification"
- **AND** propose de retourner à `/login`
