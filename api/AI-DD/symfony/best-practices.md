# Bonnes pratiques Symfony avec TDD et SOLID

## 🏗️ Structure de projet recommandée

```
src/
├── Controller/          # HTTP layer (SLIM < 50 lines)
│   ├── Api/
│   │   ├── AuthController.php
│   │   ├── OrderController.php
│   │   └── UserController.php
│   └── Admin/
├── Service/             # Business logic + Interfaces
│   ├── Order/
│   │   ├── OrderServiceInterface.php
│   │   ├── OrderService.php
│   │   ├── OrderCalculatorInterface.php
│   │   └── OrderCalculator.php
│   ├── Payment/
│   │   ├── PaymentGatewayInterface.php
│   │   ├── StripePaymentGateway.php
│   │   └── PayPalPaymentGateway.php
│   └── Notification/
│       ├── NotificationChannelInterface.php
│       ├── EmailChannel.php
│       └── SmsChannel.php
├── Repository/          # Data access + Interfaces
│   ├── UserRepositoryInterface.php
│   ├── DoctrineUserRepository.php
│   ├── OrderRepositoryInterface.php
│   └── DoctrineOrderRepository.php
├── Entity/              # Domain models (pas d'interfaces)
│   ├── User.php
│   ├── Order.php
│   └── OrderItem.php
├── ValueObject/         # Immutable values
│   ├── Money.php
│   ├── Email.php
│   └── PhoneNumber.php
├── Exception/           # Domain exceptions
│   ├── OrderNotFoundException.php
│   ├── PaymentFailedException.php
│   └── InvalidEmailException.php
├── EventListener/       # Event handling
│   └── AuthenticationEventListener.php
└── Command/             # Console commands
    └── CleanupExpiredTokensCommand.php

tests/
├── Unit/                # Tests unitaires (mocks)
│   ├── Service/
│   │   ├── OrderServiceTest.php
│   │   └── OrderCalculatorTest.php
│   └── ValueObject/
│       └── MoneyTest.php
├── Feature/             # Tests d'intégration (DB)
│   ├── Auth/
│   │   ├── LoginTest.php
│   │   └── RegisterTest.php
│   └── Order/
│       └── CreateOrderTest.php
└── Architecture/        # Tests d'architecture
    └── SolidPrinciplesTest.php
```

---

## 📋 Règles par type de fichier

### 1. Controllers (< 50 lignes)

**Responsabilités** :
- ✅ Récupérer les données de la requête
- ✅ Appeler le service approprié
- ✅ Retourner la réponse HTTP

**Interdictions** :
- ❌ Logique métier
- ❌ Accès direct à Doctrine/EntityManager
- ❌ Calculs complexes
- ❌ Conditions métier

```php
// ✅ BON : Controller slim
#[Route('/api/orders')]
class OrderController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        OrderServiceInterface $orderService
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        try {
            $order = $orderService->createOrder($data);
            return $this->json(['id' => $order->getId()], 201);
        } catch (ValidationException $e) {
            return $this->json(['error' => $e->getMessage()], 400);
        }
    }
}

// ❌ MAUVAIS : Fat controller
#[Route('/api/orders')]
class OrderController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // ❌ Validation dans le controller
        if (!isset($data['items']) || empty($data['items'])) {
            return $this->json(['error' => 'Items required'], 400);
        }

        // ❌ Logique métier dans le controller
        $total = 0;
        foreach ($data['items'] as $item) {
            $product = $em->getRepository(Product::class)->find($item['product_id']);
            $total += $product->getPrice() * $item['quantity'];
        }

        // ❌ 50 lignes plus tard...
        return $this->json(['id' => $order->getId()]);
    }
}
```

---

### 2. Services (Business Logic)

**Règles** :
- ✅ Toujours créer une interface
- ✅ Injection de dépendances via constructeur
- ✅ Une responsabilité par service (SRP)
- ✅ Méthodes < 20 lignes

```php
// Interface
interface OrderServiceInterface
{
    public function createOrder(array $data): Order;
    public function cancelOrder(int $orderId): void;
}

// Implémentation
class OrderService implements OrderServiceInterface
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private PaymentGatewayInterface $paymentGateway,
        private OrderCalculatorInterface $calculator,
        private EventDispatcherInterface $eventDispatcher
    ) {}

    public function createOrder(array $data): Order
    {
        // 1. Validation
        $this->validateOrderData($data);

        // 2. Calcul
        $total = $this->calculator->calculateTotal($data['items']);

        // 3. Paiement
        $paymentResult = $this->paymentGateway->charge($total, $data['payment_token']);

        if (!$paymentResult->isSuccessful()) {
            throw new PaymentFailedException($paymentResult->getError());
        }

        // 4. Création
        $order = Order::create($data['items'], $total, $paymentResult);

        // 5. Sauvegarde
        $this->orderRepository->save($order);

        // 6. Événement
        $this->eventDispatcher->dispatch(new OrderCreatedEvent($order));

        return $order;
    }

    private function validateOrderData(array $data): void
    {
        if (empty($data['items'])) {
            throw new InvalidOrderException('Order must have items');
        }

        if (!isset($data['payment_token'])) {
            throw new InvalidOrderException('Payment token required');
        }
    }
}
```

---

### 3. Repositories (Data Access)

**Règles** :
- ✅ Toujours créer une interface
- ✅ Méthodes de recherche explicites
- ✅ Pas de logique métier

```php
// Interface
interface UserRepositoryInterface
{
    public function find(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function findActive(): array;
    public function save(User $user): void;
    public function remove(User $user): void;
}

// Implémentation Doctrine
class DoctrineUserRepository extends ServiceEntityRepository implements UserRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    public function find(int $id): ?User
    {
        return parent::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->createQueryBuilder('u')
            ->where('u.email = :email')
            ->setParameter('email', $email)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findActive(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.isActive = :active')
            ->setParameter('active', true)
            ->getQuery()
            ->getResult();
    }

    public function save(User $user): void
    {
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }

    public function remove(User $user): void
    {
        $this->getEntityManager()->remove($user);
        $this->getEntityManager()->flush();
    }
}
```

---

### 4. Entities (Domain Models)

**Règles** :
- ✅ Pas d'interfaces (sauf UserInterface de Symfony Security)
- ✅ Getters/Setters
- ✅ Méthodes de validation si nécessaire
- ❌ Pas de logique métier complexe
- ❌ Pas d'appels à des services

```php
#[ORM\Entity]
#[ORM\Table(name: 'orders')]
#[ORM\HasLifecycleCallbacks]
class Order
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private string $status = 'pending';

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $total;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    // ✅ Méthode de création statique
    public static function create(array $items, Money $total, PaymentResult $payment): self
    {
        $order = new self();
        $order->total = (string) $total->getAmount();
        $order->status = 'paid';
        $order->createdAt = new \DateTimeImmutable();
        $order->updatedAt = new \DateTimeImmutable();

        return $order;
    }

    // ✅ Méthodes métier simples
    public function cancel(): void
    {
        if ($this->status === 'cancelled') {
            throw new OrderAlreadyCancelledException();
        }

        $this->status = 'cancelled';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    // Getters/Setters...
    public function getId(): ?int { return $this->id; }
    public function getStatus(): string { return $this->status; }
    public function getTotal(): string { return $this->total; }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }
}
```

---

### 5. Value Objects (Immutables)

**Règles** :
- ✅ `readonly` class (PHP 8.2+)
- ✅ Validation dans le constructeur
- ✅ Méthodes de transformation retournent une nouvelle instance
- ❌ Pas de setters

```php
// ✅ BON : Value Object immutable
final readonly class Money
{
    public function __construct(
        public float $amount,
        public string $currency = 'EUR'
    ) {
        if ($amount < 0) {
            throw new \InvalidArgumentException('Amount cannot be negative');
        }

        if (!in_array($currency, ['EUR', 'USD', 'GBP'])) {
            throw new \InvalidArgumentException("Invalid currency: $currency");
        }
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new \InvalidArgumentException('Cannot add different currencies');
        }

        return new self($this->amount + $other->amount, $this->currency);
    }

    public function multiply(int $factor): self
    {
        return new self($this->amount * $factor, $this->currency);
    }

    public function equals(Money $other): bool
    {
        return $this->amount === $other->amount
            && $this->currency === $other->currency;
    }
}

// Usage
$price = new Money(100);
$total = $price->multiply(3);  // Retourne nouvelle instance
// $price reste inchangé (immutabilité)
```

---

## 🧪 Tests pour chaque type

### Tests de Controller (Feature)

```php
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class OrderControllerTest extends WebTestCase
{
    public function testCreateOrderReturns201(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/orders', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'items' => [['product_id' => 1, 'quantity' => 2]],
            'payment_token' => 'tok_visa',
        ]));

        $this->assertResponseStatusCodeSame(201);
        $this->assertJson($client->getResponse()->getContent());
    }
}
```

### Tests de Service (Unit)

```php
use PHPUnit\Framework\TestCase;

class OrderServiceTest extends TestCase
{
    public function testCreateOrderChargesPayment(): void
    {
        // Mocks
        $mockPaymentGateway = $this->createMock(PaymentGatewayInterface::class);
        $mockPaymentGateway->expects($this->once())
            ->method('charge')
            ->willReturn(new PaymentResult(success: true));

        $mockRepository = $this->createMock(OrderRepositoryInterface::class);
        $mockCalculator = $this->createMock(OrderCalculatorInterface::class);
        $mockCalculator->method('calculateTotal')->willReturn(new Money(100));

        $service = new OrderService(
            $mockRepository,
            $mockPaymentGateway,
            $mockCalculator,
            $this->createMock(EventDispatcherInterface::class)
        );

        // Act
        $order = $service->createOrder([
            'items' => [['product_id' => 1, 'quantity' => 2]],
            'payment_token' => 'tok_visa',
        ]);

        // Assert
        $this->assertInstanceOf(Order::class, $order);
    }
}
```

---

## 📏 Métriques de qualité

```yaml
# .phpstan.neon
parameters:
    level: max
    paths:
        - src
    excludePaths:
        - src/Kernel.php
    ignoreErrors:
        - '#Cannot access property#'

# phpunit.xml
<coverage processUncoveredFiles="true">
    <include>
        <directory suffix=".php">src</directory>
    </include>
    <report>
        <html outputDirectory="var/coverage"/>
    </report>
</coverage>
```

**Objectifs** :
- ✅ Couverture de code > 80%
- ✅ PHPStan niveau max
- ✅ Tous les tests passent
- ✅ Cyclomatic complexity < 10

---

## 🔄 Workflow de développement

```
1. Nouvelle feature demandée

2. Écrire le test d'acceptance (Feature test)
   ❌ Le test échoue (endpoint n'existe pas)

3. Écrire le test unitaire du service
   ❌ Le test échoue (classe n'existe pas)

4. Créer l'interface du service

5. Créer l'implémentation du service
   ✅ Le test unitaire passe

6. Créer le controller slim
   ✅ Le test d'acceptance passe

7. Refactoriser en gardant les tests verts

8. Commit + Push
```

---

**Version** : 1.0
**Auteur** : AI-DD Team
