<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

# AI-DD Development Rules for AI Assistants

## 🎯 MANDATORY: Before ANY code generation

1. **Read these files FIRST** (in order):
   - `@AI-DD/README.md`
   - `@AI-DD/interfaces/when-to-use.md`
   - `@AI-DD/tdd/test-first.md`
   - `@.cursor/rules/symfony-tdd-solid.md`

2. **Follow TDD workflow STRICTLY**:
   ```
   RED → GREEN → REFACTOR

   ❌ NEVER write code before tests
   ✅ ALWAYS write failing test first
   ```

3. **Apply SOLID principles to EVERY class**:
   - Single Responsibility
   - Open/Closed
   - Liskov Substitution
   - Interface Segregation
   - Dependency Inversion

4. **Use interfaces for ALL injected dependencies**:
   - Services → Interface
   - Repositories → Interface
   - External APIs → Interface
   - Strategies → Interface

5. **Keep controllers SLIM** (< 50 lines):
   ```php
   // ✅ GOOD
   public function create(Request $req, OrderService $svc): JsonResponse
   {
       $order = $svc->createOrder(json_decode($req->getContent(), true));
       return $this->json(['id' => $order->getId()], 201);
   }

   // ❌ BAD: Logic in controller
   public function create(Request $req, EntityManager $em): JsonResponse
   {
       $data = json_decode($req->getContent(), true);
       // ... 100 lines of business logic
   }
   ```

---

## 🚫 FORBIDDEN Actions

### ❌ 1. Writing code without tests first
**Penalty**: Code will be rejected, must restart with tests

### ❌ 2. Using concrete dependencies
```php
// ❌ FORBIDDEN
public function __construct(
    private StripeGateway $gateway  // Concrete class
) {}

// ✅ REQUIRED
public function __construct(
    private PaymentGatewayInterface $gateway  // Interface
) {}
```

### ❌ 3. Fat controllers (> 50 lines)
**Action**: Extract logic to services immediately

### ❌ 4. Classes with multiple responsibilities
**Action**: Split into separate classes (SRP)

### ❌ 5. Code duplication
**Action**: Extract to shared method/class (DRY)

---

## ✅ REQUIRED Actions

### 1. For every new feature:

```
Step 1: Write failing test (RED)
Step 2: Make test pass with minimum code (GREEN)
Step 3: Refactor while keeping tests green (REFACTOR)
Step 4: Repeat until feature complete
```

### 2. For every new service:

```php
// 1. Create interface
interface UserServiceInterface
{
    public function register(string $email, string $password): User;
}

// 2. Create implementation
class UserService implements UserServiceInterface
{
    public function __construct(
        private UserRepositoryInterface $repository,
        private PasswordHasherInterface $hasher
    ) {}

    public function register(string $email, string $password): User
    {
        // Implementation
    }
}

// 3. Write tests FIRST
class UserServiceTest extends TestCase
{
    public function testRegisterCreatesUser(): void
    {
        $mockRepo = $this->createMock(UserRepositoryInterface::class);
        $mockHasher = $this->createMock(PasswordHasherInterface::class);

        $service = new UserService($mockRepo, $mockHasher);
        $user = $service->register('test@example.com', 'password');

        $this->assertInstanceOf(User::class, $user);
    }
}
```

### 3. For every controller:

```php
// Keep it SLIM (< 50 lines)
#[Route('/api/resource')]
class ResourceController extends AbstractController
{
    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        ResourceServiceInterface $service  // Service does the work
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $resource = $service->create($data);
        return $this->json(['id' => $resource->getId()], 201);
    }
}
```

---

## 📋 Pre-generation Checklist

Before generating ANY code, verify:

- [ ] Have I read the AI-DD documentation?
- [ ] Am I writing the test FIRST?
- [ ] Am I using interfaces for dependencies?
- [ ] Is the controller < 50 lines?
- [ ] Is each class following SRP?
- [ ] Am I avoiding code duplication?
- [ ] Will the code respect all SOLID principles?

**If ANY answer is NO → STOP and fix before continuing**

---

## 🎓 Learning Resources

When unsure, ALWAYS consult:

1. **Interfaces**: `@AI-DD/interfaces/when-to-use.md`
2. **TDD**: `@AI-DD/tdd/test-first.md`
3. **SOLID**: `@AI-DD/solid/` (all files)
4. **Symfony**: `@AI-DD/symfony/best-practices.md`
5. **Examples**: `@AI-DD/examples/good-practices/`

---

## 🔍 Code Review Criteria

All generated code will be evaluated on:

1. ✅ Tests written first (TDD)
2. ✅ SOLID principles respected
3. ✅ Interfaces used for dependencies
4. ✅ Controllers < 50 lines
5. ✅ No code duplication
6. ✅ Explicit naming
7. ✅ Type hints everywhere
8. ✅ PHPDoc complete

**Failing ANY criterion = Rejection & Rewrite**

---

## 💡 Quick Decision Trees

### "Should I create an interface?"

```
Is it injected in a service? → YES
Will there be multiple implementations? → YES
Is it an external API client? → YES
Is it a repository? → YES
Is it an entity? → NO
Is it a controller? → NO
Is it a value object? → NO
```

### "Where does this logic go?"

```
HTTP validation? → Controller
Business logic? → Service
Data access? → Repository
External API call? → Dedicated client service
Calculation? → Service or Value Object
```

---

**Version**: 1.0
**Enforcement**: STRICT - No exceptions
**Authority**: AI-DD Framework