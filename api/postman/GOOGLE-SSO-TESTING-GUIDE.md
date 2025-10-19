# Guide de Test Google SSO avec Postman

## ⚠️ Pourquoi Postman Ne Suffit Pas

Le flux Google OAuth **ne peut pas être testé complètement dans Postman** pour ces raisons :

### 1. Redirection Interactive Requise

```
Client (Postman) → Backend → Google OAuth → User Login → Google → Backend Callback → Frontend
```

**Problème** : Postman ne peut pas :
- Afficher la page de connexion Google
- Permettre à l'utilisateur de se connecter
- Gérer les cookies de session Google
- Suivre les redirections JavaScript

### 2. Flux OAuth Interactif

Le flux OAuth Google nécessite :
1. ✅ **Initiation** : `GET /api/v1/auth/google` (testable dans Postman)
2. ❌ **Connexion Google** : Page interactive (impossible dans Postman)
3. ❌ **Callback** : `GET /api/v1/auth/google/callback` (nécessite code d'autorisation valide)

## ✅ Ce Que Tu Peux Tester avec Postman

### Test 1 : Vérifier l'Initiation OAuth

**Endpoint** : `GET http://localhost/api/v1/auth/google`

**Dans Postman** :
1. Créer une nouvelle requête GET
2. URL : `{{base_url}}{{api_prefix}}/auth/google`
3. Onglet "Settings" → Désactiver "Automatically follow redirects"
4. Envoyer

**Résultat Attendu** :
```
Status: 302 Found
Location: https://accounts.google.com/o/oauth2/v2/auth?scope=openid%20email%20profile&state=...&client_id=...
```

**Vérifications** :
- ✅ Status code est 302
- ✅ Header `Location` pointe vers `accounts.google.com`
- ✅ URL contient `client_id=534486283790-65lgvpc0ag94jhbbeqob6tkmavm0d4id`
- ✅ URL contient `scope=openid%20email%20profile`
- ✅ URL contient `state=` (token CSRF)

### Test 2 : Vérifier le Callback sans Code (Erreur)

**Endpoint** : `GET http://localhost/api/v1/auth/google/callback`

**Dans Postman** :
1. Créer une requête GET
2. URL : `{{base_url}}{{api_prefix}}/auth/google/callback`
3. Envoyer

**Résultat Attendu** :
```
Status: 302 Found
Location: http://localhost:3000#error=google_auth_failed&message=...
```

**Vérifications** :
- ✅ Redirige vers le frontend avec erreur
- ✅ Gestion d'erreur fonctionne

### Test 3 : Vérifier SSO_ENABLED

**Modifier `.env`** :
```env
SSO_ENABLED=false
```

**Redémarrer les services** :
```bash
make down && make dev
```

**Tester** :
```
GET /api/v1/auth/google
```

**Résultat Attendu** :
```json
{
    "error": "sso_disabled",
    "message": "L'authentification Google SSO est désactivée"
}
Status: 403 Forbidden
```

## 🌐 Test Complet avec un Navigateur

### Méthode 1 : Test Manuel Complet

#### Étape 1 : Ouvrir dans un Navigateur

```
http://localhost/api/v1/auth/google
```

**Ce qui se passe** :
1. Redirection vers Google
2. Page de connexion Google s'affiche
3. Sélectionner un compte Google
4. Autoriser l'application
5. Redirection vers le callback
6. Redirection vers le frontend avec tokens

#### Étape 2 : Récupérer les Tokens

Après redirection, l'URL sera :
```
http://localhost:3000#access_token=eyJhbG...&refresh_token=abc123...
```

**Copier les tokens** :
1. Ouvrir la console du navigateur (F12)
2. Exécuter dans la console :
```javascript
// Extraire les tokens de l'URL fragment
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
console.log('Access Token:', params.get('access_token'));
console.log('Refresh Token:', params.get('refresh_token'));
```

#### Étape 3 : Tester dans Postman avec le Token

1. Copier `access_token` depuis la console
2. Dans Postman, requête `GET /api/v1/me`
3. Onglet "Authorization" → Type "Bearer Token"
4. Coller le token
5. Envoyer

**Résultat** :
```json
{
    "email": "ton-email@gmail.com",
    "name": "Ton Nom Google",
    "picture": "https://lh3.googleusercontent.com/...",
    "roles": ["ROLE_USER"],
    "googleId": "123456789..."
}
```

### Méthode 2 : Script Postman Pre-request (Semi-automatique)

**Limitation** : Nécessite quand même une interaction manuelle.

#### Configuration

**Pre-request Script** dans Postman :
```javascript
// Instructions pour l'utilisateur
console.log("⚠️ Google SSO nécessite une interaction manuelle:");
console.log("1. Ouvrir dans un navigateur: " + pm.variables.get("base_url") + pm.variables.get("api_prefix") + "/auth/google");
console.log("2. Se connecter avec Google");
console.log("3. Copier access_token depuis l'URL de redirection");
console.log("4. Coller dans la variable d'environnement 'access_token'");
```

## 🔧 Méthode Avancée : Simuler le Callback

### Utiliser un Code d'Autorisation Mock (Développement Seulement)

**⚠️ Ne fonctionne PAS avec le vrai Google OAuth** car :
- Le code d'autorisation est généré par Google
- Il est unique et à usage unique
- Il expire après quelques secondes
- Il est validé par Google lors de l'échange

### Alternative : Mock du Service Google

Pour les tests automatisés, il faut mocker `GoogleUserProvisioner` :

```php
// tests/Feature/Auth/GoogleSsoMockTest.php
test('Google OAuth callback creates user', function () {
    // Mock du client Google
    $mockGoogleClient = Mockery::mock(Google::class);
    $mockGoogleClient->shouldReceive('fetchUserFromToken')
        ->andReturn([
            'sub' => 'google-id-123',
            'email' => 'test@gmail.com',
            'name' => 'Test User',
            'picture' => 'https://example.com/photo.jpg'
        ]);

    // Tester le provisioning
    $user = $this->userProvisioner->provisionUser([...]);

    expect($user->getEmail())->toBe('test@gmail.com');
});
```

## 📋 Checklist de Test Google SSO

### Tests avec Postman (Partiels)

- [x] **Initiation OAuth** : Vérifier redirection vers Google
  ```
  GET /api/v1/auth/google
  Résultat : 302 vers accounts.google.com
  ```

- [x] **Callback sans code** : Vérifier gestion d'erreur
  ```
  GET /api/v1/auth/google/callback
  Résultat : 302 vers frontend avec error
  ```

- [x] **SSO désactivé** : Vérifier protection
  ```
  GET /api/v1/auth/google (avec SSO_ENABLED=false)
  Résultat : 403 Forbidden
  ```

### Tests avec Navigateur (Complets)

- [ ] **Flux complet avec compte Google** :
  1. Ouvrir `http://localhost/api/v1/auth/google`
  2. Se connecter avec Google
  3. Vérifier redirection vers frontend avec tokens
  4. Copier tokens
  5. Tester avec `GET /api/v1/me` dans Postman

- [ ] **Nouvel utilisateur** :
  1. Utiliser un compte Google jamais utilisé
  2. Vérifier création dans la base de données
  3. Vérifier champs `googleId`, `email`, `name`, `picture`

- [ ] **Utilisateur existant** :
  1. Créer un utilisateur avec `test@gmail.com`
  2. Se connecter avec Google (`test@gmail.com`)
  3. Vérifier liaison du `googleId` au compte existant

- [ ] **Conflit googleId** :
  1. Créer un utilisateur avec un `googleId`
  2. Tenter de lier le même `googleId` à un autre email
  3. Vérifier erreur 409

### Tests Automatisés (PEST)

- [x] **Tests PEST** : `tests/Feature/Auth/GoogleSsoTest.php`
  ```bash
  vendor/bin/pest tests/Feature/Auth/GoogleSsoTest.php
  Résultat : 8 tests passent, 4 skipped
  ```

## 🛠️ Configuration Google Cloud Console

Pour que le flux fonctionne, vérifier dans Google Cloud Console :

### 1. Credentials OAuth 2.0

**Client ID** : `534486283790-65lgvpc0ag94jhbbeqob6tkmavm0d4id.apps.googleusercontent.com`

**Authorized redirect URIs** :
```
http://localhost/api/v1/auth/google/callback
```

⚠️ **Si tu obtiens "redirect_uri_mismatch"** :
1. Aller sur https://console.cloud.google.com/apis/credentials
2. Cliquer sur ton Client ID OAuth
3. Ajouter `http://localhost/api/v1/auth/google/callback` dans "Authorized redirect URIs"
4. Sauvegarder

### 2. Scopes Autorisés

Dans l'écran de consentement OAuth :
- `openid`
- `email`
- `profile`

### 3. Test Users (Développement)

Si l'app est en mode "Testing" :
1. Ajouter des test users dans "OAuth consent screen"
2. Seuls ces emails pourront se connecter

## 📝 Workflow Recommandé pour Tester

### Développement Quotidien

```bash
# 1. Tester l'initiation (Postman)
GET /api/v1/auth/google
→ Vérifier redirection 302

# 2. Tester le flux complet (Navigateur)
Ouvrir http://localhost/api/v1/auth/google
→ Se connecter avec Google
→ Copier tokens depuis URL

# 3. Tester les endpoints protégés (Postman)
GET /api/v1/me
Authorization: Bearer {access_token_copié}
→ Vérifier profil utilisateur
```

### Tests Avant Commit

```bash
# Tests automatisés
vendor/bin/pest tests/Feature/Auth/GoogleSsoTest.php

# Test manuel complet
1. Navigateur : Flux complet
2. Vérifier base de données :
   SELECT email, name, google_id FROM user WHERE google_id IS NOT NULL;
```

## 🐛 Dépannage

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URI de callback n'est pas autorisée dans Google Cloud Console.

**Solution** :
1. Vérifier `GOOGLE_REDIRECT_URI` dans `.env` : `http://localhost/api/v1/auth/google/callback`
2. Ajouter cette URI exacte dans Google Cloud Console
3. Attendre 5 minutes (propagation)

### Erreur : "access_denied"

**Cause** : L'utilisateur a refusé l'autorisation sur Google.

**Solution** : Normal, relancer le flux et accepter.

### Erreur : "invalid_client"

**Cause** : Le `GOOGLE_CLIENT_SECRET` est incorrect.

**Solution** : Vérifier dans `.env` et Google Cloud Console que le secret correspond.

### Erreur : "Tokens not found in URL"

**Cause** : Le frontend n'est pas démarré sur `http://localhost:3000`.

**Solution** :
- Démarrer le frontend
- Ou modifier `FRONTEND_URL` dans `.env`

### Callback redirige en boucle

**Cause** : Le frontend ne gère pas les tokens dans l'URL fragment.

**Solution** : Vérifier que le frontend extrait bien les tokens de `window.location.hash`.

## 📊 Résumé Visuel du Flux

```
┌─────────┐
│ Postman │ GET /api/v1/auth/google
└────┬────┘
     │
     ▼
┌──────────┐ 302 Redirect
│ Backend  ├────────────────────────────────┐
└──────────┘                                │
                                            ▼
                              ┌──────────────────────┐
                              │  accounts.google.com │
                              │  (Login Page)        │
                              └──────────┬───────────┘
                                         │ User logs in
                                         ▼
                              ┌──────────────────────┐
                              │  Google OAuth        │
                              │  (Authorization)     │
                              └──────────┬───────────┘
                                         │ code + state
                                         ▼
┌──────────┐ GET /callback?code=...&state=...
│ Backend  │◄───────────────────────────────┘
└────┬─────┘
     │ 1. Exchange code for tokens
     │ 2. Get user info from Google
     │ 3. Provision user in DB
     │ 4. Generate JWT tokens
     │
     ▼
┌──────────┐ 302 Redirect
│ Frontend │◄───────────────────────────────
└──────────┘ http://localhost:3000#access_token=...
```

## 🎯 Conclusion

**Postman seul ne suffit PAS** pour tester Google SSO car :
- ❌ Pas d'interface de connexion interactive
- ❌ Ne peut pas gérer les cookies Google
- ❌ Ne peut pas simuler un vrai code d'autorisation

**Solution recommandée** :
1. ✅ Tester initiation dans Postman (redirection 302)
2. ✅ Tester flux complet dans navigateur
3. ✅ Récupérer tokens manuellement
4. ✅ Tester endpoints protégés dans Postman avec tokens
5. ✅ Tests automatisés avec PEST (mocking)

**Pour tester rapidement** :
```bash
# 1. Ouvrir dans navigateur
http://localhost/api/v1/auth/google

# 2. Se connecter avec Google

# 3. Dans console navigateur (F12)
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
console.log('Token:', params.get('access_token'));

# 4. Copier le token dans Postman
# 5. Tester GET /api/v1/me
```

---

**Documentation Liée** :
- `claudedocs/google-sso-manual-test.md` - Guide de test manuel complet
- `claudedocs/authentication.md` - Documentation API complète
- `tests/Feature/Auth/GoogleSsoTest.php` - Tests automatisés

**Dernière mise à jour** : 2025-10-19
