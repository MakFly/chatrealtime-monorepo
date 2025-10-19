# Quand utiliser des interfaces en PHP/Symfony

## 🎯 Règle d'or

**Utilisez une interface quand vous avez besoin de flexibilité ou de testabilité, PAS par défaut sur toutes les classes.**

## ✅ Quand UTILISER des interfaces

### 1. **Dépendances injectées dans les services** (⭐⭐⭐ Priorité HAUTE)

**Situation** : Un service dépend d'un autre service qu'on veut pouvoir remplacer ou mocker.

```php
// ❌ MAUVAIS : Dépendance concrète
class OrderService
{
    public function __construct(
        private StripePaymentGateway $paymentGateway  // Couplage fort
    ) {}
}

// ✅ BON : Dépendance abstraite
interface PaymentGatewayInterface
{
    public function charge(Money $amount, string $token): PaymentResult;
}

class OrderService
{
    public function __construct(
        private PaymentGatewayInterface $paymentGateway  // Flexible
    ) {}
}

// On peut maintenant avoir plusieurs implémentations
class StripePaymentGateway implements PaymentGatewayInterface { }
class PayPalPaymentGateway implements PaymentGatewayInterface { }
class MockPaymentGateway implements PaymentGatewayInterface { }  // Pour les tests
```

**Pourquoi ?**
- ✅ Testabilité : Facile de mocker dans les tests
- ✅ Flexibilité : Changer d'implémentation sans toucher au code client
- ✅ SOLID : Respect du DIP (Dependency Inversion Principle)

---

### 2. **Stratégies interchangeables** (⭐⭐⭐ Priorité HAUTE)

**Situation** : Plusieurs algorithmes/stratégies pour la même opération.

```php
// Interface commune
interface NotificationChannelInterface
{
    public function send(User $user, string $message): void;
    public function supports(string $channel): bool;
}

// Implémentations
class EmailNotificationChannel implements NotificationChannelInterface { }
class SmsNotificationChannel implements NotificationChannelInterface { }
class PushNotificationChannel implements NotificationChannelInterface { }
class DiscordNotificationChannel implements NotificationChannelInterface { }

// Service qui utilise la stratégie
class NotificationService
{
    /**
     * @param iterable<NotificationChannelInterface> $channels
     */
    public function __construct(
        private iterable $channels
    ) {}

    public function notify(User $user, string $message, string $channel): void
    {
        foreach ($this->channels as $notificationChannel) {
            if ($notificationChannel->supports($channel)) {
                $notificationChannel->send($user, $message);
                return;
            }
        }

        throw new \RuntimeException("Unsupported channel: $channel");
    }
}
```

**Configuration Symfony** :
```yaml
# config/services.yaml
services:
    # Auto-wire tous les channels
    _instanceof:
        App\Service\NotificationChannelInterface:
            tags: ['app.notification_channel']

    App\Service\NotificationService:
        arguments:
            $channels: !tagged_iterator app.notification_channel
```

**Pourquoi ?**
- ✅ Extensibilité : Ajouter un nouveau channel sans modifier le code existant (OCP)
- ✅ Testabilité : Tester chaque stratégie isolément
- ✅ Clarté : Contrat explicite pour toutes les stratégies

---

### 3. **Repositories Doctrine** (⭐⭐ Priorité MOYENNE)

**Situation** : Abstraire l'accès aux données pour faciliter les tests.

```php
// Interface de repository
interface UserRepositoryInterface
{
    public function find(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function save(User $user): void;
    public function remove(User $user): void;
}

// Implémentation Doctrine
class DoctrineUserRepository extends ServiceEntityRepository implements UserRepositoryInterface
{
    public function find(int $id): ?User
    {
        return $this->createQueryBuilder('u')
            ->where('u.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getOneOrNullResult();
    }

    // ... autres méthodes
}

// Service utilisant le repository
class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository  // Interface, pas la classe Doctrine
    ) {}

    public function getUserById(int $id): User
    {
        $user = $this->userRepository->find($id);

        if (!$user) {
            throw new UserNotFoundException("User $id not found");
        }

        return $user;
    }
}
```

**Pour les tests** :
```php
// Test avec mock
class UserServiceTest extends TestCase
{
    public function testGetUserByIdReturnsUser(): void
    {
        $mockUser = $this->createMock(User::class);
        $mockRepo = $this->createMock(UserRepositoryInterface::class);
        $mockRepo->method('find')->willReturn($mockUser);

        $service = new UserService($mockRepo);
        $result = $service->getUserById(1);

        $this->assertSame($mockUser, $result);
    }
}
```

**Pourquoi ?**
- ✅ Tests rapides : Pas besoin de base de données dans les tests unitaires
- ✅ Flexibilité : Possibilité de changer l'ORM (rare mais possible)
- ✅ Clarté : Contrat explicite de ce que le repository doit fournir

---

### 4. **Clients API externes** (⭐⭐⭐ Priorité HAUTE)

**Situation** : Intégration avec des services tiers (Google, Stripe, AWS, etc.).

```php
// Interface pour un client email
interface EmailClientInterface
{
    public function send(EmailMessage $message): SendResult;
    public function sendBatch(array $messages): BatchSendResult;
}

// Implémentations
class SendGridClient implements EmailClientInterface { }
class MailgunClient implements EmailClientInterface { }
class LocalSmtpClient implements EmailClientInterface { }
class FakeEmailClient implements EmailClientInterface { }  // Pour dev/tests

// Service métier
class EmailCampaignService
{
    public function __construct(
        private EmailClientInterface $emailClient
    ) {}

    public function sendCampaign(Campaign $campaign): void
    {
        $messages = $this->buildMessages($campaign);
        $this->emailClient->sendBatch($messages);
    }
}
```

**Configuration par environnement** :
```yaml
# config/services.yaml
services:
    # Production : SendGrid
    App\Service\EmailClientInterface:
        class: App\Service\SendGridClient
        arguments:
            $apiKey: '%env(SENDGRID_API_KEY)%'

# config/services_dev.yaml
services:
    # Développement : Fake client
    App\Service\EmailClientInterface:
        class: App\Service\FakeEmailClient
```

**Pourquoi ?**
- ✅ Tests sans dépendances externes : Pas d'appels API réels
- ✅ Développement local facilité : Utiliser un client fake
- ✅ Changement de provider sans refactoring majeur

---

### 5. **Événements/Observers** (⭐⭐ Priorité MOYENNE)

**Situation** : Plusieurs classes doivent réagir à un événement.

```php
// Interface d'observateur
interface OrderEventListenerInterface
{
    public function onOrderCreated(OrderCreatedEvent $event): void;
    public function supports(string $eventType): bool;
}

// Implémentations
class SendOrderConfirmationEmail implements OrderEventListenerInterface { }
class UpdateInventory implements OrderEventListenerInterface { }
class NotifyWarehouse implements OrderEventListenerInterface { }
class LogOrderMetrics implements OrderEventListenerInterface { }
```

**Pourquoi ?**
- ✅ Extensibilité : Ajouter des listeners sans modifier le code existant
- ✅ Séparation des responsabilités : Chaque listener a une seule tâche
- ✅ Testabilité : Tester chaque listener isolément

---

## ❌ Quand NE PAS utiliser d'interfaces

### 1. **Entités Doctrine** ❌

```php
// ❌ MAUVAIS : Interface pour une entité
interface UserInterface
{
    public function getId(): int;
    public function getEmail(): string;
}

class User implements UserInterface { }
```

**Pourquoi éviter ?**
- ❌ Les entités sont des objets de données, pas des services
- ❌ Doctrine a besoin de classes concrètes
- ❌ Pas de besoin de substitution d'implémentation
- ❌ Complexité inutile

**Exception** : Interface `UserInterface` de Symfony Security est nécessaire pour l'authentification.

---

### 2. **Controllers Symfony** ❌

```php
// ❌ MAUVAIS : Interface pour un controller
interface ProductControllerInterface
{
    public function list(Request $request): Response;
    public function show(int $id): Response;
}

class ProductController implements ProductControllerInterface { }
```

**Pourquoi éviter ?**
- ❌ Les controllers sont des points d'entrée HTTP, pas de la logique métier
- ❌ Symfony a besoin de classes concrètes avec des attributes (#[Route])
- ❌ Pas de besoin de substitution
- ❌ Overhead inutile

**Solution** : Garder les controllers minimalistes (<50 lignes) et déléguer aux services.

---

### 3. **Value Objects simples** ❌

```php
// ❌ MAUVAIS : Interface pour un VO simple
interface MoneyInterface
{
    public function getAmount(): float;
    public function getCurrency(): string;
}

class Money implements MoneyInterface { }
```

**Pourquoi éviter ?**
- ❌ Les value objects sont immuables et simples
- ❌ Pas de besoin de polymorphisme
- ❌ Complexité inutile

**Bon usage** : Classe finale directement.

```php
// ✅ BON
final readonly class Money
{
    public function __construct(
        public float $amount,
        public string $currency
    ) {}
}
```

---

### 4. **Classes avec une seule implémentation prévue** ❌

```php
// ❌ MAUVAIS : Interface pour une classe qui n'aura qu'une seule implémentation
interface OrderValidatorInterface
{
    public function validate(Order $order): ValidationResult;
}

class OrderValidator implements OrderValidatorInterface { }  // Seule implémentation
```

**Pourquoi éviter ?**
- ❌ YAGNI (You Aren't Gonna Need It)
- ❌ Overhead inutile
- ❌ Complexité sans bénéfice

**Quand ajouter l'interface ?** Seulement lorsqu'une deuxième implémentation devient nécessaire (refactoring).

---

## 🎯 Résumé : Matrice de décision

| Situation | Interface ? | Raison |
|-----------|-------------|--------|
| Service injecté dans un autre service | ✅ OUI | Testabilité + Flexibilité |
| Stratégies multiples (email, payment, etc.) | ✅ OUI | Extensibilité (OCP) |
| Repository Doctrine | ✅ OUI | Tests sans DB |
| Client API externe | ✅ OUI | Tests sans appels réels |
| Event listeners | ✅ OUI | Extensibilité |
| Entité Doctrine | ❌ NON | Pas de polymorphisme nécessaire |
| Controller Symfony | ❌ NON | Points d'entrée HTTP |
| Value Object simple | ❌ NON | Immutabilité suffisante |
| Classe unique sans alternative | ❌ NON | YAGNI |

---

## 📝 Conventions de nommage

### Pour les interfaces de services

```php
// ✅ BON : Suffixe "Interface"
PaymentGatewayInterface
NotificationChannelInterface
UserRepositoryInterface
EmailClientInterface

// ❌ MAUVAIS : Préfixe "I" (style C#)
IPaymentGateway
INotificationChannel
```

### Pour les interfaces de contrats métier

```php
// ✅ BON : Nom descriptif du comportement
Payable
Notifiable
Searchable
Subscribable

// ✅ BON : Nom du rôle
EventListener
MessageHandler
CommandHandler
```

---

## 🧪 Test de décision rapide

**Avant de créer une interface, posez-vous ces questions :**

1. ❓ **Est-ce que cette classe sera injectée dans un service ?**
   - Si OUI → Interface probable

2. ❓ **Est-ce qu'il y aura plusieurs implémentations (maintenant ou bientôt) ?**
   - Si OUI → Interface

3. ❓ **Est-ce que je veux mocker cette classe dans les tests ?**
   - Si OUI → Interface

4. ❓ **Est-ce une entité, un VO, ou un controller ?**
   - Si OUI → Pas d'interface

5. ❓ **Est-ce que cette classe appelle des services externes ?**
   - Si OUI → Interface

**Si vous avez répondu OUI à 1, 2, 3 ou 5 → Créez une interface**
**Si vous avez répondu OUI à 4 → Pas d'interface**

---

## 💡 Exemple complet : Architecture propre

```php
// 1. Interface du repository
interface UserRepositoryInterface
{
    public function findByEmail(string $email): ?User;
    public function save(User $user): void;
}

// 2. Interface du service email
interface EmailServiceInterface
{
    public function sendWelcomeEmail(User $user): void;
}

// 3. Service métier utilisant les interfaces
class UserRegistrationService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private EmailServiceInterface $emailService,
        private PasswordHasherInterface $passwordHasher
    ) {}

    public function register(string $email, string $password): User
    {
        // Vérifier que l'email n'existe pas
        if ($this->userRepository->findByEmail($email)) {
            throw new EmailAlreadyExistsException();
        }

        // Créer l'utilisateur
        $user = new User();
        $user->setEmail($email);
        $user->setPassword($this->passwordHasher->hash($password));

        // Sauvegarder
        $this->userRepository->save($user);

        // Envoyer l'email de bienvenue
        $this->emailService->sendWelcomeEmail($user);

        return $user;
    }
}

// 4. Controller mince qui délègue
#[Route('/api/auth')]
class AuthController extends AbstractController
{
    #[Route('/register', methods: ['POST'])]
    public function register(
        Request $request,
        UserRegistrationService $registrationService
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        try {
            $user = $registrationService->register(
                $data['email'],
                $data['password']
            );

            return $this->json(['id' => $user->getId()], 201);
        } catch (EmailAlreadyExistsException $e) {
            return $this->json(['error' => 'Email exists'], 409);
        }
    }
}
```

**Architecture claire :**
- ✅ Interfaces pour les dépendances (repository, email service)
- ✅ Service métier avec logique claire
- ✅ Controller mince (<20 lignes)
- ✅ Facilement testable avec des mocks

---

**Version** : 1.0
**Auteur** : AI-DD Team
