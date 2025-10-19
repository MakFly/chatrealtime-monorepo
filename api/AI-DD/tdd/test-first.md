# TDD : Test-Driven Development

## 🎯 Le cycle Red-Green-Refactor

```
┌─────────────────────────────────────────┐
│          1. RED (Test échoue)           │
│   Écrire un test qui échoue            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         2. GREEN (Test passe)           │
│   Écrire le minimum de code            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         3. REFACTOR (Améliorer)         │
│   Nettoyer le code sans casser         │
└────────────────┬────────────────────────┘
                 │
                 └──────┐
                        │
                        ▼
                  Recommencer
```

## 📋 Workflow TDD en pratique

### Étape 1 : RED - Écrire le test d'abord

```php
// tests/Unit/Service/UserRegistrationServiceTest.php
use PHPUnit\Framework\TestCase;

class UserRegistrationServiceTest extends TestCase
{
    public function testRegisterCreatesNewUser(): void
    {
        // GIVEN
        $mockRepository = $this->createMock(UserRepositoryInterface::class);
        $mockRepository->expects($this->once())
            ->method('findByEmail')
            ->with('test@example.com')
            ->willReturn(null);  // Email n'existe pas

        $mockRepository->expects($this->once())
            ->method('save')
            ->with($this->isInstanceOf(User::class));

        $mockHasher = $this->createMock(PasswordHasherInterface::class);
        $mockHasher->method('hash')->willReturn('hashed_password');

        $service = new UserRegistrationService($mockRepository, $mockHasher);

        // WHEN
        $user = $service->register('test@example.com', 'password123');

        // THEN
        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals('test@example.com', $user->getEmail());
    }
}
```

**Résultat attendu** : ❌ Le test échoue (classe n'existe pas encore)

---

### Étape 2 : GREEN - Écrire le minimum de code

```php
// src/Service/UserRegistrationService.php
class UserRegistrationService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private PasswordHasherInterface $passwordHasher
    ) {}

    public function register(string $email, string $password): User
    {
        // Vérifier que l'email n'existe pas
        if ($this->userRepository->findByEmail($email)) {
            throw new \RuntimeException('Email exists');
        }

        // Créer l'utilisateur
        $user = new User();
        $user->setEmail($email);
        $user->setPassword($this->passwordHasher->hash($password));

        // Sauvegarder
        $this->userRepository->save($user);

        return $user;
    }
}
```

**Résultat** : ✅ Le test passe

---

### Étape 3 : REFACTOR - Améliorer le code

```php
// Refactoring : Créer une exception personnalisée
class EmailAlreadyExistsException extends \DomainException
{
    public function __construct(string $email)
    {
        parent::__construct("Email already exists: $email");
    }
}

// Service refactorisé
class UserRegistrationService
{
    public function __construct(
        private UserRepositoryInterface $userRepository,
        private PasswordHasherInterface $passwordHasher
    ) {}

    public function register(string $email, string $password): User
    {
        $this->ensureEmailIsAvailable($email);

        $user = $this->createUser($email, $password);

        $this->userRepository->save($user);

        return $user;
    }

    private function ensureEmailIsAvailable(string $email): void
    {
        if ($this->userRepository->findByEmail($email)) {
            throw new EmailAlreadyExistsException($email);
        }
    }

    private function createUser(string $email, string $password): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setPassword($this->passwordHasher->hash($password));

        return $user;
    }
}
```

**Résultat** : ✅ Les tests passent toujours, le code est plus propre

---

## 🏗️ Structure de test recommandée

### Pattern AAA (Arrange, Act, Assert)

```php
public function testSomething(): void
{
    // ARRANGE (Given) : Préparer le contexte
    $mockDependency = $this->createMock(DependencyInterface::class);
    $mockDependency->method('someMethod')->willReturn('result');
    $service = new ServiceUnderTest($mockDependency);

    // ACT (When) : Exécuter l'action
    $result = $service->doSomething('input');

    // ASSERT (Then) : Vérifier le résultat
    $this->assertEquals('expected', $result);
}
```

### Nommage des tests

```php
// ✅ BON : Nom descriptif du comportement
public function testRegisterThrowsExceptionWhenEmailExists(): void
public function testCalculateTotalReturnsSumOfPrices(): void
public function testSendEmailLogsErrorOnFailure(): void

// ❌ MAUVAIS : Nom vague
public function testRegister(): void
public function testCalculate(): void
public function testSend(): void
```

---

## 🎯 Types de tests TDD

### 1. Tests unitaires (⭐⭐⭐ Priorité HAUTE)

**Cible** : Une classe isolée avec mocks pour les dépendances

```php
// Test d'un service isolé
class OrderCalculatorTest extends TestCase
{
    public function testCalculateTotalWithTax(): void
    {
        $calculator = new OrderCalculator(taxRate: 0.20);

        $total = $calculator->calculate([
            new OrderItem(price: 100, quantity: 2),
            new OrderItem(price: 50, quantity: 1),
        ]);

        $this->assertEquals(300, $total);  // (200 + 50) * 1.20
    }
}
```

**Caractéristiques** :
- ⚡ Très rapides (<10ms)
- 🎯 Testent UNE classe
- 🔧 Utilisent des mocks pour les dépendances
- 📈 Couverture de code maximale

---

### 2. Tests d'intégration (⭐⭐ Priorité MOYENNE)

**Cible** : Plusieurs classes travaillant ensemble (avec base de données)

```php
// Test avec base de données réelle
class UserRegistrationIntegrationTest extends KernelTestCase
{
    private EntityManagerInterface $entityManager;
    private UserRegistrationService $service;

    protected function setUp(): void
    {
        self::bootKernel();

        $this->entityManager = self::getContainer()
            ->get(EntityManagerInterface::class);

        $this->service = self::getContainer()
            ->get(UserRegistrationService::class);
    }

    public function testRegisterSavesUserToDatabase(): void
    {
        $user = $this->service->register('test@example.com', 'password123');

        $this->entityManager->refresh($user);

        $savedUser = $this->entityManager
            ->getRepository(User::class)
            ->findOneBy(['email' => 'test@example.com']);

        $this->assertNotNull($savedUser);
        $this->assertEquals($user->getId(), $savedUser->getId());
    }
}
```

**Caractéristiques** :
- 🐢 Plus lents (50-500ms)
- 🔗 Testent l'intégration entre composants
- 💾 Utilisent une vraie base de données (test)
- 🧪 Tests plus réalistes

---

### 3. Tests fonctionnels/E2E (⭐ Priorité BASSE)

**Cible** : L'application complète via HTTP

```php
// Test d'un endpoint API
class AuthControllerTest extends WebTestCase
{
    public function testRegisterEndpointCreatesUser(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/v1/auth/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => 'test@example.com',
            'password' => 'password123',
        ]));

        $this->assertResponseStatusCodeSame(201);
        $this->assertJson($client->getResponse()->getContent());

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $data);
    }
}
```

**Caractéristiques** :
- 🐌 Les plus lents (500ms-2s)
- 🌐 Testent via HTTP
- 🎭 Simulent un vrai utilisateur
- 🔄 Couvrent tout le stack

---

## 📊 Pyramide de tests (stratégie optimale)

```
         ┌─────────────┐
         │  E2E Tests  │ 10%
         │   (lents)   │
       ┌─┴─────────────┴─┐
       │ Integration     │ 20%
       │  Tests (moyens) │
     ┌─┴─────────────────┴─┐
     │   Unit Tests         │ 70%
     │   (rapides)          │
     └─────────────────────┘

Objectif : Beaucoup de tests unitaires, peu de tests E2E
```

---

## ✅ Checklist TDD

Avant d'écrire du code :
- [ ] J'ai écrit le test d'abord (RED)
- [ ] Le test échoue pour la bonne raison
- [ ] J'ai écrit le minimum de code pour le faire passer (GREEN)
- [ ] Le test passe maintenant
- [ ] J'ai refactorisé le code sans casser les tests
- [ ] J'ai nommé le test de façon descriptive
- [ ] J'ai utilisé le pattern AAA (Arrange, Act, Assert)
- [ ] J'ai mocké les dépendances externes

---

## 🚫 Anti-patterns à éviter

### ❌ 1. Écrire le code avant le test

```php
// ❌ MAUVAIS : Code d'abord, test après
// 1. Écrire UserService
// 2. Écrire UserServiceTest

// ✅ BON : Test d'abord
// 1. Écrire UserServiceTest
// 2. Écrire UserService
```

---

### ❌ 2. Tests trop complexes

```php
// ❌ MAUVAIS : Test qui fait trop de choses
public function testCompleteUserFlow(): void
{
    // Register user
    $user = $this->service->register('test@example.com', 'pass');

    // Login
    $token = $this->authService->login('test@example.com', 'pass');

    // Update profile
    $this->profileService->update($user, ['name' => 'John']);

    // ... 50 lignes plus loin
    $this->assertTrue($something);
}

// ✅ BON : Tests atomiques
public function testRegisterCreatesUser(): void { }
public function testLoginReturnsToken(): void { }
public function testUpdateProfileChangesName(): void { }
```

---

### ❌ 3. Tests qui dépendent les uns des autres

```php
// ❌ MAUVAIS : Tests interdépendants
class UserServiceTest extends TestCase
{
    private static ?User $user = null;

    public function testRegister(): void
    {
        self::$user = $this->service->register('test@example.com');
    }

    public function testUpdate(): void
    {
        // Dépend du test précédent !!
        $this->service->update(self::$user, ['name' => 'John']);
    }
}

// ✅ BON : Tests indépendants
public function testRegister(): void
{
    $user = $this->service->register('test@example.com');
    $this->assertInstanceOf(User::class, $user);
}

public function testUpdate(): void
{
    $user = $this->createUser();  // Setup propre à ce test
    $this->service->update($user, ['name' => 'John']);
    $this->assertEquals('John', $user->getName());
}
```

---

## 🎓 Exercice pratique

**Défi** : Implémenter un service de calcul de réduction avec TDD

### Étape 1 : Écrire le test (RED)

```php
class DiscountCalculatorTest extends TestCase
{
    public function testCalculateWithNoDiscount(): void
    {
        $calculator = new DiscountCalculator();
        $result = $calculator->calculate(price: 100, discountPercent: 0);
        $this->assertEquals(100, $result);
    }

    public function testCalculateWith10PercentDiscount(): void
    {
        $calculator = new DiscountCalculator();
        $result = $calculator->calculate(price: 100, discountPercent: 10);
        $this->assertEquals(90, $result);
    }

    public function testCalculateWith100PercentDiscount(): void
    {
        $calculator = new DiscountCalculator();
        $result = $calculator->calculate(price: 100, discountPercent: 100);
        $this->assertEquals(0, $result);
    }
}
```

### Étape 2 : Implémenter (GREEN)

```php
class DiscountCalculator
{
    public function calculate(float $price, float $discountPercent): float
    {
        if ($discountPercent < 0 || $discountPercent > 100) {
            throw new \InvalidArgumentException('Discount must be between 0 and 100');
        }

        $discount = $price * ($discountPercent / 100);
        return $price - $discount;
    }
}
```

### Étape 3 : Refactoriser

```php
class DiscountCalculator
{
    public function calculate(float $price, float $discountPercent): float
    {
        $this->validateDiscountPercent($discountPercent);

        return $price * (1 - $discountPercent / 100);
    }

    private function validateDiscountPercent(float $discountPercent): void
    {
        if ($discountPercent < 0 || $discountPercent > 100) {
            throw new \InvalidArgumentException(
                "Discount percent must be between 0 and 100, got: $discountPercent"
            );
        }
    }
}
```

---

## 📚 Ressources

- **PHPUnit Documentation** : https://phpunit.de/documentation.html
- **PEST PHP** : https://pestphp.com/
- **Test-Driven Development** (Kent Beck)
- **Growing Object-Oriented Software, Guided by Tests** (Freeman & Pryce)

---

**Version** : 1.0
**Auteur** : AI-DD Team
