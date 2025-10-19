# 🔐 JWT Best Practices - Guide Complet

## 📋 Table des Matières

1. [Pourquoi les rôles sont inclus dans votre JWT ?](#pourquoi-les-rôles)
2. [Que mettre dans un JWT ?](#que-mettre-dans-un-jwt)
3. [Que NE PAS mettre dans un JWT ?](#que-ne-pas-mettre)
4. [Structure optimale du JWT](#structure-optimale)
5. [Configuration recommandée](#configuration-recommandée)
6. [Implémentation sécurisée](#implémentation-sécurisée)

---

## 🤔 Pourquoi les Rôles sont Inclus dans Votre JWT ?

### Comportement Actuel

**Lexik JWT Bundle** inclut automatiquement les rôles de l'utilisateur dans le payload JWT par défaut :

```json
{
  "iat": 1760910146,
  "exp": 1760913746,
  "username": "test@example.com",
  "roles": ["ROLE_USER", "ROLE_ADMIN"]  ← Automatiquement ajouté
}
```

### Pourquoi ?

1. **Performance:** Évite une requête DB pour vérifier les permissions à chaque requête
2. **Stateless:** Le serveur n'a pas besoin de session pour connaître les permissions
3. **Simplicité:** Symfony Security peut directement lire les rôles du token

### Est-ce une Bonne Pratique ?

**✅ OUI pour:**
- Applications simples avec peu de rôles
- Rôles qui changent rarement
- Besoins de performance élevés

**❌ NON pour:**
- Systèmes avec permissions complexes
- Rôles qui changent fréquemment
- Informations sensibles dans les rôles

---

## ✅ Que Mettre dans un JWT ?

### Claims Standards (Recommandés)

```json
{
  // Claims JWT standards (RFC 7519)
  "iss": "https://api.example.com",      // Issuer - Émetteur du token
  "sub": "user123",                       // Subject - ID unique de l'utilisateur
  "aud": "https://app.example.com",      // Audience - Pour qui le token est destiné
  "exp": 1760913746,                     // Expiration - Timestamp Unix
  "iat": 1760910146,                     // Issued At - Date de création
  "nbf": 1760910146,                     // Not Before - Valide à partir de
  "jti": "abc123xyz"                     // JWT ID - Identifiant unique du token
}
```

### Claims Applicatifs (Minimaux)

```json
{
  // Informations utilisateur minimales
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User UUID
  "email": "user@example.com",                     // Email (si non sensible)
  "roles": ["ROLE_USER"],                          // Rôles de base uniquement

  // Métadonnées
  "device_id": "abc123",                           // Fingerprinting
  "ip": "192.168.1.1",                            // IP de création (optionnel)

  // Contexte
  "scope": "read write",                           // Permissions OAuth2
  "tenant_id": "company-123"                       // Multi-tenant
}
```

### Exemple Optimisé

```json
{
  // Standard claims
  "iss": "chat-realtime-api",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "aud": "chat-realtime-app",
  "exp": 1760913746,
  "iat": 1760910146,
  "jti": "unique-token-id-123",

  // Application claims
  "email": "user@example.com",
  "roles": ["ROLE_USER"],
  "scope": "chat:read chat:write"
}
```

**Taille:** ~250-300 bytes ✅ Acceptable

---

## ❌ Que NE PAS Mettre dans un JWT ?

### 🚫 Données Sensibles

```json
{
  "password": "...",           // ❌ JAMAIS de mots de passe
  "ssn": "123-45-6789",       // ❌ JAMAIS de numéros de sécurité sociale
  "credit_card": "...",        // ❌ JAMAIS d'infos bancaires
  "api_keys": "...",          // ❌ JAMAIS de clés API
  "tokens": "...",            // ❌ JAMAIS d'autres tokens
  "private_key": "..."        // ❌ JAMAIS de clés privées
}
```

**Pourquoi ?** Les JWT sont encodés en Base64, **PAS chiffrés**. N'importe qui peut les décoder.

### 🚫 Données Volumineuses

```json
{
  "user_preferences": { /* 50 KB de données */ },  // ❌ Trop gros
  "full_profile": { /* Tous les champs */ },       // ❌ Trop gros
  "permissions": [ /* 100+ permissions */ ],       // ❌ Trop détaillé
  "history": [ /* Historique complet */ ]          // ❌ Non pertinent
}
```

**Pourquoi ?**
- Chaque requête envoie le JWT
- Headers HTTP limités à ~8KB
- Performance dégradée

**Limite recommandée:** < 1KB pour le JWT complet

### 🚫 Données Fréquemment Modifiées

```json
{
  "balance": 1234.56,          // ❌ Change souvent
  "last_login": "...",         // ❌ Change à chaque connexion
  "notification_count": 42,    // ❌ Change en temps réel
  "current_status": "online"   // ❌ État temps réel
}
```

**Pourquoi ?** Le JWT est valide jusqu'à expiration. Les données peuvent devenir obsolètes.

---

## 🎯 Structure Optimale du JWT

### Recommandation par Type d'Application

#### 1. Application Simple (Blog, Site Vitrine)

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["ROLE_USER"],
  "exp": 1760913746,
  "iat": 1760910146
}
```

**Taille:** ~150 bytes ✅

#### 2. Application Moyenne (E-commerce, SaaS)

```json
{
  "iss": "myapp-api",
  "sub": "user-uuid",
  "aud": "myapp-frontend",
  "email": "user@example.com",
  "roles": ["ROLE_USER"],
  "tenant_id": "company-123",
  "exp": 1760913746,
  "iat": 1760910146,
  "jti": "token-id"
}
```

**Taille:** ~250 bytes ✅

#### 3. Application Complexe (Banking, Healthcare)

```json
{
  "iss": "secure-api",
  "sub": "user-uuid",
  "aud": ["app", "admin-panel"],
  "email_hash": "sha256-hash",     // Email hashé, pas en clair
  "roles": ["ROLE_USER"],
  "scope": "read:account write:transfer",
  "device_id": "fingerprint-hash",
  "mfa_verified": true,
  "exp": 1760910746,               // 10 minutes seulement
  "iat": 1760910146,
  "jti": "token-id"
}
```

**Taille:** ~350 bytes ✅

**Note:** Utiliser des **refresh tokens** pour les sessions longues.

---

## ⚙️ Configuration Recommandée

### 1. Durées de Vie (TTL)

```yaml
# Pour les Access Tokens
JWT_TOKEN_TTL:
  - API publique: 300-900 (5-15 minutes)
  - Application web: 900-3600 (15-60 minutes)
  - Application mobile: 1800-3600 (30-60 minutes)
  - Banking/Health: 300-600 (5-10 minutes)

# Pour les Refresh Tokens
JWT_REFRESH_TOKEN_TTL:
  - Faible sécurité: 2592000 (30 jours)
  - Moyenne sécurité: 604800 (7 jours) ✅ RECOMMANDÉ
  - Haute sécurité: 86400 (24 heures)
  - Banking/Health: 3600-7200 (1-2 heures)
```

### 2. Configuration Lexik JWT Optimisée

**Créer:** `config/packages/lexik_jwt_authentication.yaml`

```yaml
lexik_jwt_authentication:
    secret_key: '%env(resolve:JWT_SECRET_KEY)%'
    public_key: '%env(resolve:JWT_PUBLIC_KEY)%'
    pass_phrase: '%env(JWT_PASSPHRASE)%'
    token_ttl: '%env(int:JWT_TOKEN_TTL)%'

    # Claims personnalisés
    set_cookies:
        enabled: false  # Désactiver si API-only

    # Encoder personnalisé
    encoder:
        service: lexik_jwt_authentication.encoder.lcobucci

    # Token extractors
    token_extractors:
        authorization_header:
            enabled: true
            prefix: Bearer
            name: Authorization
        cookie:
            enabled: false
        query_parameter:
            enabled: false  # ❌ Jamais dans query string
```

### 3. Event Listener pour Personnaliser le Payload

**Créer:** `src/EventListener/JWTCreatedListener.php`

```php
<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\HttpFoundation\RequestStack;

class JWTCreatedListener
{
    public function __construct(
        private RequestStack $requestStack
    ) {}

    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $request = $this->requestStack->getCurrentRequest();
        $user = $event->getUser();
        $payload = $event->getData();

        // ✅ Ajouter des claims standards
        $payload['iss'] = 'chat-realtime-api';
        $payload['aud'] = 'chat-realtime-app';
        $payload['jti'] = bin2hex(random_bytes(16));

        // ✅ Ajouter le sub (user ID)
        $payload['sub'] = $user->getId();

        // ✅ Ajouter device fingerprint (sécurité)
        if ($request) {
            $payload['device_id'] = hash('sha256',
                $request->headers->get('User-Agent', 'unknown')
            );
            $payload['ip'] = $request->getClientIp();
        }

        // ⚠️ Filtrer les rôles (garder seulement les principaux)
        $roles = $user->getRoles();
        $payload['roles'] = array_values(array_filter($roles, function($role) {
            return in_array($role, ['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MODERATOR']);
        }));

        // ❌ Retirer le username si email déjà présent
        if (isset($payload['email'])) {
            unset($payload['username']);
        }

        $event->setData($payload);
    }
}
```

**Enregistrer le service:**

```yaml
# config/services.yaml
services:
    App\EventListener\JWTCreatedListener:
        tags:
            - { name: kernel.event_listener, event: lexik_jwt_authentication.on_jwt_created, method: onJWTCreated }
```

### 4. Event Listener pour Valider le Token

**Créer:** `src/EventListener/JWTDecodedListener.php`

```php
<?php

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Symfony\Component\HttpFoundation\RequestStack;

class JWTDecodedListener
{
    public function __construct(
        private RequestStack $requestStack
    ) {}

    public function onJWTDecoded(JWTDecodedEvent $event): void
    {
        $request = $this->requestStack->getCurrentRequest();
        $payload = $event->getPayload();

        // ✅ Vérifier l'audience
        if (!isset($payload['aud']) || $payload['aud'] !== 'chat-realtime-app') {
            $event->markAsInvalid();
            return;
        }

        // ✅ Vérifier l'issuer
        if (!isset($payload['iss']) || $payload['iss'] !== 'chat-realtime-api') {
            $event->markAsInvalid();
            return;
        }

        // ✅ Vérifier le device fingerprint (anti-theft)
        if ($request && isset($payload['device_id'])) {
            $currentDeviceId = hash('sha256',
                $request->headers->get('User-Agent', 'unknown')
            );

            if ($payload['device_id'] !== $currentDeviceId) {
                // Token potentiellement volé
                $event->markAsInvalid();
                return;
            }
        }

        // ✅ Vérifier que le token n'a pas été blacklisté
        // (Déjà géré par TokenBlacklistService via un autre listener)
    }
}
```

**Enregistrer:**

```yaml
# config/services.yaml
services:
    App\EventListener\JWTDecodedListener:
        tags:
            - { name: kernel.event_listener, event: lexik_jwt_authentication.on_jwt_decoded, method: onJWTDecoded }
```

---

## 🔒 Implémentation Sécurisée

### Checklist de Sécurité JWT

#### Génération du Token

- [x] Utiliser RS256 ou ES256 (asymétrique) au lieu de HS256
- [x] Clé privée sécurisée (minimum 2048 bits pour RSA)
- [x] Pass phrase forte pour la clé privée
- [x] TTL court pour access token (15-60 minutes)
- [x] Ajouter `jti` (JWT ID) unique pour tracking
- [x] Ajouter `aud` (audience) pour validation
- [x] Ajouter `iss` (issuer) pour validation

#### Stockage

```typescript
// ✅ RECOMMANDÉ: httpOnly cookie (si même domaine)
// Le cookie ne peut pas être lu par JavaScript (protection XSS)
document.cookie = "access_token=...; Secure; HttpOnly; SameSite=Strict";

// ⚠️ ACCEPTABLE: localStorage (si HTTPS + CSP strict)
// Vulnérable aux XSS mais pratique pour SPA
localStorage.setItem('access_token', token);

// ❌ DÉCONSEILLÉ: sessionStorage
// Perdu à la fermeture de l'onglet

// ❌ JAMAIS: Cookie sans httpOnly
// Lisible par JavaScript = vulnérable XSS

// ❌ JAMAIS: localStorage sans HTTPS
// Token interceptable en clair
```

#### Transport

```javascript
// ✅ TOUJOURS en HTTPS
const response = await fetch('https://api.example.com/protected', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

// ❌ JAMAIS dans l'URL
// Logs serveur, historique navigateur, referrer
const bad = await fetch(`https://api.example.com/data?token=${token}`);

// ❌ JAMAIS dans un formulaire POST visible
<form action="/api" method="POST">
  <input type="hidden" name="token" value="{{token}}"> <!-- ❌ -->
</form>
```

#### Validation

```php
// ✅ Vérifications obligatoires
- Signature valide (automatique avec Lexik)
- Token non expiré (exp)
- Token pas encore valide (nbf)
- Issuer correct (iss)
- Audience correcte (aud)
- Token non blacklisté
- Device fingerprint match
- Rôles/permissions valides

// ⚠️ Vérifications optionnelles
- IP address match (peut casser avec mobile)
- Geolocation match
- User-Agent match (strict avec device_id)
```

---

## 🎯 Recommandation pour Votre Projet

### Configuration Actuelle (À Améliorer)

```yaml
# config/packages/lexik_jwt_authentication.yaml
lexik_jwt_authentication:
    token_ttl: 3600  # ⚠️ 1h OK mais pourrait être plus court
```

**Payload actuel:**
```json
{
  "iat": 1760910146,
  "exp": 1760913746,
  "username": "test@example.com",  // ⚠️ Duplication avec email
  "roles": ["ROLE_USER"]
}
```

### Configuration Recommandée

**1. Créer les Event Listeners (voir code ci-dessus)**

**2. Mettre à jour .env:**

```bash
# Access Token: 15 minutes (recommandé pour webapp)
JWT_TOKEN_TTL=900

# Refresh Token: 7 jours (déjà configuré ✅)
JWT_REFRESH_TOKEN_TTL=604800
```

**3. Payload résultant:**

```json
{
  "iss": "chat-realtime-api",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "aud": "chat-realtime-app",
  "exp": 1760910746,
  "iat": 1760910146,
  "jti": "abc123xyz",
  "email": "user@example.com",
  "roles": ["ROLE_USER"],
  "device_id": "hash-of-user-agent",
  "ip": "192.168.1.1"
}
```

**Taille:** ~280 bytes ✅

---

## 📚 Standards et Références

### RFC et Standards

- **RFC 7519:** JSON Web Token (JWT)
- **RFC 7515:** JSON Web Signature (JWS)
- **RFC 7516:** JSON Web Encryption (JWE)
- **RFC 8725:** JWT Best Current Practices

### Outils de Validation

- **jwt.io** - Décodeur et validateur JWT
- **OWASP JWT Cheat Sheet** - Bonnes pratiques sécurité
- **Auth0 JWT Handbook** - Guide complet

### Comparaison JWT vs Session

| Aspect | JWT | Session |
|--------|-----|---------|
| **Stockage serveur** | ❌ Aucun | ✅ Redis/DB requis |
| **Scalabilité** | ✅ Excellent | ⚠️ Complexe |
| **Taille** | ⚠️ ~300 bytes/req | ✅ ~50 bytes (cookie) |
| **Révocation** | ⚠️ Complexe | ✅ Immédiate |
| **Sécurité** | ⚠️ Attention XSS | ✅ httpOnly cookie |
| **Mobile** | ✅ Parfait | ⚠️ Complexe |

**Recommandation:** JWT pour API + Mobile, Session pour applications web classiques

---

## ✅ Checklist Finale

### Pour Être "ISO" (Conforme aux Standards)

- [ ] **Claims standards** (iss, sub, aud, exp, iat, jti)
- [ ] **TTL court** pour access token (< 1h)
- [ ] **Refresh token rotation** (déjà fait ✅)
- [ ] **Device fingerprinting** pour détecter vol de token
- [ ] **Token blacklisting** pour révocation (déjà fait ✅)
- [ ] **HTTPS uniquement** en production
- [ ] **Validation stricte** du payload
- [ ] **Monitoring** des tokens suspects (déjà fait ✅)
- [ ] **Documentation** de la structure du JWT
- [ ] **Tests** de sécurité JWT

---

**Prochaines étapes recommandées:**
1. Implémenter les Event Listeners JWTCreatedListener et JWTDecodedListener
2. Réduire JWT_TOKEN_TTL à 900 (15 minutes)
3. Ajouter les claims standards (iss, aud, jti, sub)
4. Tester la validation du device_id

Voulez-vous que j'implémente ces améliorations maintenant ?
