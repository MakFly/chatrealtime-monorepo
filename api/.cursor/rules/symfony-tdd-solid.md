# Règles de développement Symfony avec TDD et SOLID

## 🎯 Priorités absolues

1. **TDD FIRST** : Toujours écrire le test avant le code
2. **SOLID PRINCIPLES** : Respecter les 5 principes à chaque classe
3. **INTERFACES** : Utiliser des interfaces pour toutes les dépendances injectées
4. **SLIM CONTROLLERS** : Controllers < 50 lignes, logique dans les services
5. **NO DUPLICATION** : DRY (Don't Repeat Yourself) systématiquement

---

## 📋 Workflow obligatoire

### Pour toute nouvelle fonctionnalité :

```
1. RED    : Écrire le test qui échoue
2. GREEN  : Écrire le minimum de code
3. REFACTOR : Améliorer sans casser les tests
4. REPEAT : Continuer jusqu'à fonctionnalité complète
```

### Checklist avant de committer :

- [ ] Tests écrits AVANT le code
- [ ] Tous les tests passent (`make test`)
- [ ] Couverture > 80% pour nouveau code
- [ ] PHPStan niveau max sans erreur
- [ ] Principes SOLID respectés
- [ ] Interfaces pour dépendances
- [ ] Controllers < 50 lignes
- [ ] Pas de duplication de code
- [ ] Nommage explicite

---

## 🏗️ Architecture des services

### ✅ Structure CORRECTE

```php
// 1. Interface (dans src/Service/)
interface PaymentGatewayInterface
{
    public function charge(Money $amount, string $token): PaymentResult;
}

// 2. Implémentation(s)
class StripePaymentGateway implements PaymentGatewayInterface
{
    public function __construct(
        private HttpClientInterface $httpClient,
        private string $apiKey
    ) {}

    public function charge(Money $amount, string $token): PaymentResult
    {
        // Implémentation...
    }
}

// 3. Service utilisant l'interface
class OrderService
{
    public function __construct(
        private PaymentGatewayInterface $paymentGateway,
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function createOrder(Cart $cart, string $paymentToken): Order
    {
        $total = $cart->calculateTotal();
        $paymentResult = $this->paymentGateway->charge($total, $paymentToken);

        if (!$paymentResult->isSuccessful()) {
            throw new PaymentFailedException();
        }

        $order = Order::fromCart($cart, $paymentResult);
        $this->orderRepository->save($order);

        return $order;
    }
}

// 4. Controller SLIM
#[Route('/api/orders')]
class OrderController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        OrderService $orderService,
        CartService $cartService
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $cart = $cartService->getCurrentCart();
        $order = $orderService->createOrder($cart, $data['payment_token']);

        return $this->json(['id' => $order->getId()], 201);
    }
}
```

---

## 🚫 Anti-patterns interdits

### ❌ 1. Controller avec logique métier

```php
// ❌ INTERDIT
#[Route('/api/orders')]
class OrderController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // MAUVAIS : Logique métier dans le controller
        $data = json_decode($request->getContent(), true);

        $cart = $this->em->getRepository(Cart::class)->find($data['cart_id']);
        $total = 0;
        foreach ($cart->getItems() as $item) {
            $total += $item->getPrice() * $item->getQuantity();
        }

        $paymentResult = $this->stripe->charge($total, $data['token']);

        // ... 100 lignes plus tard

        return $this->json(['id' => $order->getId()]);
    }
}

// ✅ BON : Délégation au service
#[Route('/api/orders')]
class OrderController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        OrderService $orderService
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $order = $orderService->createOrder($data);
        return $this->json(['id' => $order->getId()], 201);
    }
}
```

---

### ❌ 2. Dépendances concrètes

```php
// ❌ INTERDIT
class OrderService
{
    public function __construct(
        private StripePaymentGateway $paymentGateway  // Classe concrète
    ) {}
}

// ✅ BON
class OrderService
{
    public function __construct(
        private PaymentGatewayInterface $paymentGateway  // Interface
    ) {}
}
```

---

### ❌ 3. Code sans tests

```php
// ❌ INTERDIT : Écrire du code sans test d'abord

// ✅ BON : Workflow TDD
// 1. Écrire OrderServiceTest::testCreateOrderChargesPayment()
// 2. Le test échoue (classe n'existe pas)
// 3. Écrire OrderService::createOrder()
// 4. Le test passe
// 5. Refactoriser
```

---

### ❌ 4. Classe avec plusieurs responsabilités

```php
// ❌ INTERDIT : Violation SRP
class UserService
{
    public function register(string $email): User { }
    public function sendWelcomeEmail(User $user): void { }
    public function generatePdfReport(User $user): string { }
    public function exportToCsv(array $users): string { }
}

// ✅ BON : Une responsabilité par classe
class UserRegistrationService
{
    public function register(string $email): User { }
}

class UserEmailService
{
    public function sendWelcomeEmail(User $user): void { }
}

class UserReportGenerator
{
    public function generatePdf(User $user): string { }
}

class UserExportService
{
    public function exportToCsv(array $users): string { }
}
```

---

## 🎯 Principes SOLID (rappel)

### S - Single Responsibility Principle

**Une classe = une raison de changer**

```php
// ✅ BON
class EmailSender
{
    public function send(Email $email): void { }
}

class EmailFormatter
{
    public function format(array $data): Email { }
}

// ❌ MAUVAIS
class EmailService
{
    public function send(Email $email): void { }
    public function format(array $data): Email { }
    public function validate(Email $email): bool { }
    public function log(Email $email): void { }
}
```

---

### O - Open/Closed Principle

**Ouvert à l'extension, fermé à la modification**

```php
// ✅ BON : Nouvelle stratégie sans modifier le code existant
interface NotificationChannelInterface
{
    public function send(User $user, string $message): void;
}

class EmailChannel implements NotificationChannelInterface { }
class SmsChannel implements NotificationChannelInterface { }
class DiscordChannel implements NotificationChannelInterface { }  // Ajout facile

// Service qui utilise les stratégies
class NotificationService
{
    public function __construct(
        private iterable $channels
    ) {}
}
```

---

### L - Liskov Substitution Principle

**Les sous-classes doivent être substituables**

```php
// ✅ BON
interface PaymentGatewayInterface
{
    public function charge(Money $amount): PaymentResult;
}

// Toutes les implémentations respectent le contrat
class StripeGateway implements PaymentGatewayInterface
{
    public function charge(Money $amount): PaymentResult
    {
        // Retourne toujours PaymentResult
        return new PaymentResult(/* ... */);
    }
}

// ❌ MAUVAIS : Violation LSP
class FakeGateway implements PaymentGatewayInterface
{
    public function charge(Money $amount): PaymentResult
    {
        throw new \Exception('Not implemented');  // Comportement inattendu
    }
}
```

---

### I - Interface Segregation Principle

**Interfaces spécifiques plutôt que générales**

```php
// ❌ MAUVAIS : Interface trop large
interface WorkerInterface
{
    public function work(): void;
    public function eat(): void;
    public function sleep(): void;
}

class Robot implements WorkerInterface
{
    public function work(): void { }
    public function eat(): void { }  // Pas nécessaire pour un robot
    public function sleep(): void { }  // Pas nécessaire pour un robot
}

// ✅ BON : Interfaces ségrégées
interface WorkableInterface
{
    public function work(): void;
}

interface EatableInterface
{
    public function eat(): void;
}

class Robot implements WorkableInterface
{
    public function work(): void { }
}

class Human implements WorkableInterface, EatableInterface
{
    public function work(): void { }
    public function eat(): void { }
}
```

---

### D - Dependency Inversion Principle

**Dépendre d'abstractions, pas de concrets**

```php
// ❌ MAUVAIS
class OrderService
{
    private StripeClient $stripe;  // Dépendance concrète

    public function __construct()
    {
        $this->stripe = new StripeClient();  // Instanciation directe
    }
}

// ✅ BON
class OrderService
{
    public function __construct(
        private PaymentGatewayInterface $paymentGateway  // Abstraction
    ) {}
}
```

---

## 🧪 Tests obligatoires

### Pour chaque service :

```php
class UserServiceTest extends TestCase
{
    // ✅ Test unitaire avec mocks
    public function testRegisterCreatesUser(): void
    {
        $mockRepo = $this->createMock(UserRepositoryInterface::class);
        $mockHasher = $this->createMock(PasswordHasherInterface::class);

        $service = new UserService($mockRepo, $mockHasher);
        $user = $service->register('test@example.com', 'password');

        $this->assertInstanceOf(User::class, $user);
    }

    // ✅ Test d'erreur
    public function testRegisterThrowsExceptionWhenEmailExists(): void
    {
        $mockRepo = $this->createMock(UserRepositoryInterface::class);
        $mockRepo->method('findByEmail')->willReturn(new User());

        $service = new UserService($mockRepo, $this->createMock(PasswordHasherInterface::class));

        $this->expectException(EmailAlreadyExistsException::class);
        $service->register('existing@example.com', 'password');
    }
}
```

---

## 📐 Standards de code

### Nommage

```php
// ✅ Classes : PascalCase
UserService
PaymentGateway
OrderRepository

// ✅ Méthodes : camelCase
getUserById()
calculateTotal()
sendEmail()

// ✅ Variables : camelCase
$userId
$emailAddress
$paymentResult

// ✅ Constantes : SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 30;

// ❌ INTERDIT
$data
$temp
$x
$result
```

### Type hints obligatoires

```php
// ✅ BON : Types partout
public function calculate(float $price, int $quantity): Money
{
    return new Money($price * $quantity);
}

// ❌ INTERDIT : Pas de types
public function calculate($price, $quantity)
{
    return new Money($price * $quantity);
}
```

---

## 📏 Limites strictes

- Controllers : **< 50 lignes**
- Méthodes : **< 20 lignes**
- Classes : **< 300 lignes**
- Cyclomatic complexity : **< 10**
- Nesting level : **< 4**

---

## 🔄 Refactoring continu

### Signes qu'un refactoring est nécessaire :

1. Méthode > 20 lignes
2. Classe > 300 lignes
3. Duplication de code
4. Conditions imbriquées (> 3 niveaux)
5. Dépendances concrètes
6. Tests difficiles à écrire

### Actions de refactoring :

```php
// Avant : Méthode trop longue
public function processOrder(Order $order): void
{
    // Validation
    if (!$order->hasItems()) throw new Exception();
    if (!$order->hasShippingAddress()) throw new Exception();

    // Calcul
    $total = 0;
    foreach ($order->getItems() as $item) {
        $total += $item->getPrice() * $item->getQuantity();
    }

    // Paiement
    $result = $this->stripe->charge($total, $order->getPaymentToken());
    if (!$result->success) throw new Exception();

    // Email
    $this->mailer->send($order->getCustomer()->getEmail(), 'Confirmation');
}

// Après : Méthodes extraites
public function processOrder(Order $order): void
{
    $this->validateOrder($order);
    $total = $this->calculateTotal($order);
    $this->processPayment($total, $order);
    $this->sendConfirmationEmail($order);
}

private function validateOrder(Order $order): void { }
private function calculateTotal(Order $order): Money { }
private function processPayment(Money $total, Order $order): void { }
private function sendConfirmationEmail(Order $order): void { }
```

---

## 🎓 Formation continue

**Lire en priorité** :
1. AI-DD/interfaces/when-to-use.md
2. AI-DD/tdd/test-first.md
3. AI-DD/solid/*.md

**Pratiquer** :
- Faire du pair programming avec TDD
- Code reviews focalisés sur SOLID
- Kata TDD quotidiens (15 min)

---

**Version** : 1.0
**Application stricte obligatoire**
