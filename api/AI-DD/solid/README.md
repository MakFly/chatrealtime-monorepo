# Principes SOLID en PHP/Symfony

## Vue d'ensemble

Les principes SOLID sont 5 règles fondamentales pour créer du code maintenable, extensible et testable.

| Principe | Nom complet | Résumé |
|----------|-------------|--------|
| **S** | Single Responsibility Principle | Une classe = une responsabilité |
| **O** | Open/Closed Principle | Ouvert extension, fermé modification |
| **L** | Liskov Substitution Principle | Substitution sans casser le comportement |
| **I** | Interface Segregation Principle | Interfaces spécifiques, pas générales |
| **D** | Dependency Inversion Principle | Dépendre d'abstractions, pas de concrets |

---

## S - Single Responsibility Principle (SRP)

### ❌ Violation

```php
class UserManager
{
    public function register(string $email, string $password): User
    {
        // Validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \Exception('Invalid email');
        }

        // Création utilisateur
        $user = new User();
        $user->setEmail($email);
        $user->setPassword(password_hash($password, PASSWORD_BCRYPT));

        // Sauvegarde en base
        $this->em->persist($user);
        $this->em->flush();

        // Envoi email de bienvenue
        mail($email, 'Welcome', 'Welcome to our app!');

        // Log
        file_put_contents('log.txt', "User registered: $email\n", FILE_APPEND);

        return $user;
    }
}
```

**Problème** : Cette classe a 5 responsabilités !

---

### ✅ Solution

```php
// 1 responsabilité : Validation
class EmailValidator
{
    public function validate(string $email): void
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidEmailException();
        }
    }
}

// 1 responsabilité : Création d'utilisateur
class UserFactory
{
    public function create(string $email, string $password): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPassword(password_hash($password, PASSWORD_BCRYPT));
        return $user;
    }
}

// 1 responsabilité : Sauvegarde
interface UserRepositoryInterface
{
    public function save(User $user): void;
}

// 1 responsabilité : Email
interface EmailServiceInterface
{
    public function sendWelcome(User $user): void;
}

// 1 responsabilité : Log
interface LoggerInterface
{
    public function info(string $message): void;
}

// Orchestration
class UserRegistrationService
{
    public function __construct(
        private EmailValidator $validator,
        private UserFactory $factory,
        private UserRepositoryInterface $repository,
        private EmailServiceInterface $emailService,
        private LoggerInterface $logger
    ) {}

    public function register(string $email, string $password): User
    {
        $this->validator->validate($email);
        $user = $this->factory->create($email, $password);
        $this->repository->save($user);
        $this->emailService->sendWelcome($user);
        $this->logger->info("User registered: $email");

        return $user;
    }
}
```

**Bénéfices** :
- ✅ Chaque classe est facile à tester
- ✅ Chaque classe est réutilisable
- ✅ Modifications isolées (changer email n'affecte pas validation)

---

## O - Open/Closed Principle (OCP)

### ❌ Violation

```php
class NotificationService
{
    public function send(User $user, string $message, string $channel): void
    {
        if ($channel === 'email') {
            mail($user->getEmail(), 'Notification', $message);
        } elseif ($channel === 'sms') {
            $this->smsSender->send($user->getPhone(), $message);
        } elseif ($channel === 'push') {
            $this->pushSender->send($user->getDeviceToken(), $message);
        }
        // ❌ Ajouter un nouveau channel = MODIFIER ce code
    }
}
```

---

### ✅ Solution

```php
// Interface de stratégie
interface NotificationChannelInterface
{
    public function send(User $user, string $message): void;
    public function supports(string $channel): bool;
}

// Implémentations
class EmailChannel implements NotificationChannelInterface
{
    public function send(User $user, string $message): void
    {
        mail($user->getEmail(), 'Notification', $message);
    }

    public function supports(string $channel): bool
    {
        return $channel === 'email';
    }
}

class SmsChannel implements NotificationChannelInterface { /* ... */ }
class PushChannel implements NotificationChannelInterface { /* ... */ }

// Service extensible
class NotificationService
{
    /**
     * @param iterable<NotificationChannelInterface> $channels
     */
    public function __construct(
        private iterable $channels
    ) {}

    public function send(User $user, string $message, string $channel): void
    {
        foreach ($this->channels as $notificationChannel) {
            if ($notificationChannel->supports($channel)) {
                $notificationChannel->send($user, $message);
                return;
            }
        }

        throw new UnsupportedChannelException($channel);
    }
}

// ✅ Ajouter un nouveau channel = CRÉER une nouvelle classe (pas de modification)
class DiscordChannel implements NotificationChannelInterface { /* ... */ }
```

---

## L - Liskov Substitution Principle (LSP)

### ❌ Violation

```php
interface BirdInterface
{
    public function fly(): void;
}

class Sparrow implements BirdInterface
{
    public function fly(): void
    {
        echo "Flying high!";
    }
}

class Penguin implements BirdInterface
{
    public function fly(): void
    {
        throw new \Exception("Penguins can't fly!");  // ❌ Comportement inattendu
    }
}

// Code qui utilise
function makeBirdFly(BirdInterface $bird): void
{
    $bird->fly();  // ❌ Exception si c'est un Penguin !
}
```

---

### ✅ Solution

```php
// Séparation des contrats
interface BirdInterface
{
    public function move(): void;
}

interface FlyableInterface
{
    public function fly(): void;
}

class Sparrow implements BirdInterface, FlyableInterface
{
    public function move(): void { echo "Flying"; }
    public function fly(): void { echo "Flying high!"; }
}

class Penguin implements BirdInterface
{
    public function move(): void { echo "Swimming"; }
    // Pas de fly() → Pas de promesse non tenue
}

// Utilisation sûre
function makeFlyableFly(FlyableInterface $bird): void
{
    $bird->fly();  // ✅ Garanti de fonctionner
}
```

---

## I - Interface Segregation Principle (ISP)

### ❌ Violation

```php
interface WorkerInterface
{
    public function work(): void;
    public function eat(): void;
    public function sleep(): void;
}

class Human implements WorkerInterface
{
    public function work(): void { echo "Working"; }
    public function eat(): void { echo "Eating"; }
    public function sleep(): void { echo "Sleeping"; }
}

class Robot implements WorkerInterface
{
    public function work(): void { echo "Working"; }
    public function eat(): void { /* ❌ Non applicable */ }
    public function sleep(): void { /* ❌ Non applicable */ }
}
```

---

### ✅ Solution

```php
// Interfaces ségrégées
interface WorkableInterface
{
    public function work(): void;
}

interface EatableInterface
{
    public function eat(): void;
}

interface SleepableInterface
{
    public function sleep(): void;
}

class Human implements WorkableInterface, EatableInterface, SleepableInterface
{
    public function work(): void { echo "Working"; }
    public function eat(): void { echo "Eating"; }
    public function sleep(): void { echo "Sleeping"; }
}

class Robot implements WorkableInterface
{
    public function work(): void { echo "Working"; }
    // Pas de méthodes inutiles
}
```

---

## D - Dependency Inversion Principle (DIP)

### ❌ Violation

```php
// Dépendance sur une classe concrète
class OrderService
{
    private StripePaymentGateway $gateway;

    public function __construct()
    {
        $this->gateway = new StripePaymentGateway();  // ❌ Couplage fort
    }

    public function processPayment(Order $order): void
    {
        $this->gateway->charge($order->getTotal());
    }
}
```

**Problèmes** :
- ❌ Impossible de tester sans vraie requête Stripe
- ❌ Impossible de changer de gateway sans modifier OrderService
- ❌ Dépendance directe sur l'implémentation

---

### ✅ Solution

```php
// Interface (abstraction)
interface PaymentGatewayInterface
{
    public function charge(Money $amount): PaymentResult;
}

// Implémentations
class StripePaymentGateway implements PaymentGatewayInterface { /* ... */ }
class PayPalPaymentGateway implements PaymentGatewayInterface { /* ... */ }
class MockPaymentGateway implements PaymentGatewayInterface { /* ... */ }

// Service dépend de l'abstraction
class OrderService
{
    public function __construct(
        private PaymentGatewayInterface $gateway  // ✅ Interface
    ) {}

    public function processPayment(Order $order): void
    {
        $this->gateway->charge($order->getTotal());
    }
}

// Configuration Symfony (services.yaml)
services:
    App\Service\PaymentGatewayInterface:
        class: App\Service\StripePaymentGateway  # Facile à changer
```

**Bénéfices** :
- ✅ Testable avec mock
- ✅ Changement de gateway sans toucher OrderService
- ✅ Dépendance sur abstraction, pas sur implémentation

---

## 🎯 Résumé visuel

```
SOLID Principles

┌─────────────────────────────────────────┐
│  S  │ Une classe = une responsabilité   │
├─────────────────────────────────────────┤
│  O  │ Extensible sans modification      │
├─────────────────────────────────────────┤
│  L  │ Substitution sûre des sous-types  │
├─────────────────────────────────────────┤
│  I  │ Interfaces spécifiques            │
├─────────────────────────────────────────┤
│  D  │ Dépendre d'abstractions           │
└─────────────────────────────────────────┘
```

---

## 📚 Ressources

- [SOLID Principles in PHP](https://www.digitalocean.com/community/tutorials/solid-principles-php)
- **Clean Architecture** - Robert C. Martin
- **Agile Software Development** - Robert C. Martin

---

**Version** : 1.0
**Auteur** : AI-DD Team
