# Postman API Collection

Collection Postman complète pour l'API Chat Realtime avec authentification JWT et Google SSO.

## 📦 Fichiers

- `Chat-Realtime-API.postman_collection.json` - Collection principale avec tous les endpoints
- `Chat-Realtime-API.postman_environment.json` - Variables d'environnement pour le développement

## 🚀 Démarrage Rapide

### 1. Importer dans Postman

1. Ouvrir Postman Desktop ou Web
2. Cliquer sur "Import" (bouton en haut à gauche)
3. Sélectionner "File" → Choisir `Chat-Realtime-API.postman_collection.json`
4. Répéter pour `Chat-Realtime-API.postman_environment.json`

### 2. Sélectionner l'Environnement

1. En haut à droite, cliquer sur le menu déroulant des environnements
2. Sélectionner "Chat Realtime - Development"
3. Vérifier que `base_url` = `http://localhost`

### 3. Tester l'API

#### Option A : Exécuter toute la collection

1. Cliquer sur "Collections" dans la barre latérale
2. Trouver "Chat Realtime API"
3. Cliquer sur "Run" (icône play)
4. Cliquer sur "Run Chat Realtime API"

#### Option B : Tester individuellement

1. Développer "Chat Realtime API" → "Authentication"
2. Cliquer sur "Register - Create Account"
3. Cliquer sur "Send"
4. Les tokens seront automatiquement sauvegardés pour les requêtes suivantes

## 📋 Endpoints Disponibles

### Authentication (Email/Password)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/status` | GET | Obtenir les méthodes d'auth disponibles |
| `/api/v1/auth/register` | POST | Créer un nouveau compte |
| `/api/v1/auth/login` | POST | Se connecter avec email/password |
| `/api/v1/auth/refresh` | POST | Rafraîchir le token d'accès |
| `/api/v1/auth/logout` | POST | Se déconnecter et révoquer le refresh token |

### Google SSO

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/google` | GET | Initier l'OAuth Google |
| `/api/v1/auth/google/callback` | GET | Callback après autorisation Google |

### User Profile (Requiert authentification)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/me` | GET | Obtenir le profil de l'utilisateur actuel |
| `/api/v1/me` | PUT | Mettre à jour le profil (name, picture) |
| `/api/v1/me/password` | POST | Changer le mot de passe |

### Error Examples

| Endpoint | Description |
|----------|-------------|
| 401 - Unauthorized | Accès sans token |
| 401 - Invalid Credentials | Login avec mauvais credentials |
| 400 - Validation Error | Mot de passe trop court |
| 409 - Conflict | Email déjà utilisé |

## 🔑 Variables d'Environnement

| Variable | Valeur par défaut | Description |
|----------|------------------|-------------|
| `base_url` | `http://localhost` | URL de base de l'API |
| `api_prefix` | `/api/v1` | Préfixe des routes API |
| `access_token` | *(auto-rempli)* | Token JWT d'accès (1h) |
| `refresh_token` | *(auto-rempli)* | Token de rafraîchissement (30j) |
| `test_email` | `test@example.com` | Email de test |
| `test_password` | `password123` | Mot de passe de test |

**Note**: Les tokens `access_token` et `refresh_token` sont automatiquement remplis après login/register.

## 📝 Flux de Test Typique

### 1. Créer un compte et se connecter

```
1. POST /api/v1/auth/register
   → Retourne access_token + refresh_token (sauvegardés automatiquement)

2. GET /api/v1/me
   → Utilise access_token automatiquement
   → Retourne les infos du profil
```

### 2. Rafraîchir le token

```
1. POST /api/v1/auth/refresh
   → Utilise refresh_token
   → Retourne nouveau access_token (sauvegardé automatiquement)
```

### 3. Se déconnecter

```
1. POST /api/v1/auth/logout
   → Révoque le refresh_token
   → Efface access_token et refresh_token des variables
```

## 🧪 Tests Automatiques

Chaque requête inclut des tests Postman automatiques :

### Exemple : Register

```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has tokens", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.token).to.exist;
    pm.expect(jsonData.refresh_token).to.exist;

    // Save tokens for subsequent requests
    pm.collectionVariables.set("access_token", jsonData.token);
    pm.collectionVariables.set("refresh_token", jsonData.refresh_token);
});
```

### Résultats des Tests

Après "Run Collection", vous verrez :
- ✅ Tests passés (verts)
- ❌ Tests échoués (rouges)
- Temps d'exécution
- Nombre d'assertions

## 🔧 Configuration Avancée

### Utiliser un autre environnement

Créer un nouvel environnement pour staging/production :

1. Cliquer sur "Environments" dans la barre latérale
2. Cliquer sur "+" pour créer un nouvel environnement
3. Nommer "Chat Realtime - Staging"
4. Définir les variables :
   - `base_url` = `https://staging.example.com`
   - `api_prefix` = `/api/v1`
   - etc.

### Utiliser Newman (CLI)

Exécuter la collection en ligne de commande :

```bash
# Installer Newman
npm install -g newman

# Exécuter la collection
newman run Chat-Realtime-API.postman_collection.json \
  -e Chat-Realtime-API.postman_environment.json

# Avec rapport HTML
newman run Chat-Realtime-API.postman_collection.json \
  -e Chat-Realtime-API.postman_environment.json \
  --reporters html \
  --reporter-html-export report.html
```

### Intégration CI/CD

Exemple GitHub Actions :

```yaml
- name: Run API Tests
  run: |
    npm install -g newman
    newman run postman/Chat-Realtime-API.postman_collection.json \
      -e postman/Chat-Realtime-API.postman_environment.json \
      --bail
```

## 📚 Documentation Supplémentaire

- **Guide complet d'authentification** : `claudedocs/authentication.md`
- **Guide de test manuel Google SSO** : `claudedocs/google-sso-manual-test.md`
- **Règle de mise à jour Postman** : `.cursor/rules/postman-api-sync.md`
- **Documentation CLAUDE.md** : Section "Postman API Collection"

## 🐛 Dépannage

### Erreur "Could not get response"

- Vérifier que les services Docker sont démarrés : `make dev`
- Vérifier que l'URL est correcte : `http://localhost` (pas `https`)
- Vérifier les logs : `make logs`

### Token expiré (401 Unauthorized)

1. Exécuter "Refresh Token" pour obtenir un nouveau token
2. Ou exécuter "Login" pour vous reconnecter

### Variables non définies

1. Vérifier que l'environnement "Chat Realtime - Development" est sélectionné
2. Vérifier les variables dans l'onglet "Variables" de la collection
3. Exécuter d'abord "Register" ou "Login" pour obtenir les tokens

## 📊 Statistiques

- **Total d'endpoints** : 13
- **Catégories** : 4 (Auth, Google SSO, Profile, Errors)
- **Tests automatiques** : ~30 assertions
- **Variables** : 6 (4 auto-remplies)

## 🔄 Maintenance

### Quand mettre à jour cette collection ?

**TOUJOURS** après :
- Ajout d'un nouveau endpoint
- Modification d'un endpoint existant (route, params, response)
- Suppression d'un endpoint
- Changement d'authentification

Voir `.cursor/rules/postman-api-sync.md` pour le workflow détaillé.

## 📄 Format de Collection

Collection au format **Postman Collection v2.1.0** compatible avec :
- Postman Desktop (Windows, macOS, Linux)
- Postman Web
- Newman CLI
- Insomnia (via import)

---

**Version** : 1.0
**Dernière mise à jour** : 2025-10-19
**Maintenu par** : Équipe de développement Chat Realtime
