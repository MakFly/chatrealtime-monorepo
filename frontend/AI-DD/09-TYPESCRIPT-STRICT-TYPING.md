# TypeScript Strict Typing & Quality Rules

## 🎯 Objectif

Garantir 100% de conformité TypeScript avec typage strict, sans aucun `any` et avec respect total des règles ESLint.

## 🚨 RÈGLES CRITIQUES - Tolérance Zéro

### 1. Interdiction Absolue des Types `any`

**Motivation:** Les types `any` désactivent complètement la vérification TypeScript et masquent les bugs potentiels.

#### ❌ Patterns Interdits
```typescript
// JAMAIS accepté dans le codebase
const data: any = fetchData()
const handleClick = (e: any) => {}
const props: { value: any } = {}
type User = { preferences: any }
```

#### ✅ Solutions Type-Safe

**Pour les événements React:**
```typescript
// Event handlers
type InputEvent = React.ChangeEvent<HTMLInputElement>
type TextAreaEvent = React.ChangeEvent<HTMLTextAreaElement>
type SelectEvent = React.ChangeEvent<HTMLSelectElement>
type FormSubmitEvent = React.FormEvent<HTMLFormElement>
type ButtonClickEvent = React.MouseEvent<HTMLButtonElement>

// Usage
const handleChange = (e: InputEvent) => {
  setValue(e.target.value)
}

const handleSubmit = (e: FormSubmitEvent) => {
  e.preventDefault()
  // form logic
}
```

**Pour les données de formulaire:**
```typescript
// Définir types précis
type ContactInfoField =
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'postalCode'

type ContactInfoValue = string

const handleFieldChange = (
  field: ContactInfoField,
  value: ContactInfoValue
) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}
```

**Pour les données API inconnues:**
```typescript
// Utiliser unknown + type guards
const data: unknown = await fetchData()

// Type guard
function isValidUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data &&
    typeof (data as User).email === 'string'
  )
}

// Usage type-safe
if (isValidUser(data)) {
  // data est maintenant User
  console.log(data.email)
}
```

**Pour les objets complexes avec fallbacks:**
```typescript
// Créer un helper type-safe au lieu de (obj as any).prop
type CompanyInfo = {
  name?: string
  address?: string
  siret?: string
}

type UserProfile = {
  companyName?: string
  company?: CompanyInfo
}

const getCompanyValue = <K extends keyof CompanyInfo>(
  key: K,
  profile?: UserProfile,
  existing?: { company?: CompanyInfo }
): string | undefined => {
  return (
    existing?.company?.[key] ||
    profile?.company?.[key] ||
    (key === 'name' ? profile?.companyName : undefined)
  )
}

// Usage
const companyName = getCompanyValue('name', userProfile, existingProfile)
```

### 2. Variables Non Utilisées

**Règle:** Toute variable déclarée DOIT être utilisée ou préfixée par `_` si intentionnellement non utilisée.

#### ❌ Erreur Commune
```typescript
// Variable jamais utilisée
const [count, setCount] = useState(0)
const isLoading = true

function MyComponent() {
  const data = fetchData() // jamais utilisé
  return <div>Hello</div>
}
```

#### ✅ Solutions

**Option 1: Supprimer la variable**
```typescript
// Si vraiment inutile, supprimer complètement
const [, setCount] = useState(0) // underscore pour destructuring
// isLoading supprimé
```

**Option 2: Utiliser la variable**
```typescript
const isLoading = true

if (isLoading) {
  return <LoadingSpinner />
}

return <Content />
```

**Option 3: Préfixer `_` si debug/dev uniquement**
```typescript
const _debugMode = process.env.NODE_ENV === 'development'
const _logData = (data: unknown) => {
  if (_debugMode) console.log(data)
}
```

### 3. React Hooks - Dépendances Complètes

**Règle:** Tous les `useEffect`, `useMemo`, `useCallback` doivent lister TOUTES leurs dépendances.

#### ❌ Patterns Problématiques
```typescript
// Dépendances manquantes
useEffect(() => {
  validateData(formData.email)
  sendAnalytics(user.id)
}, []) // ❌ formData et user manquants!

// Expression complexe dans deps
useEffect(() => {
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match')
  }
}, [formData.password !== formData.confirmPassword]) // ❌ Complex expression
```

#### ✅ Solutions Type-Safe

**Extraire les variables:**
```typescript
const email = formData.email
const userId = user.id

useEffect(() => {
  validateData(email)
  sendAnalytics(userId)
}, [email, userId]) // ✅ Toutes les dépendances
```

**Utiliser useCallback pour fonctions:**
```typescript
const validateData = useCallback((email: string) => {
  // validation logic
}, [])

const sendAnalytics = useCallback((userId: string) => {
  // analytics logic
}, [])

useEffect(() => {
  validateData(formData.email)
  sendAnalytics(user.id)
}, [formData.email, user.id, validateData, sendAnalytics])
```

**Éviter expressions complexes:**
```typescript
const password = formData.password
const confirmPassword = formData.confirmPassword

useEffect(() => {
  setPasswordMatch(password === confirmPassword)
}, [password, confirmPassword]) // ✅ Variables simples
```

### 4. HTML Entities - Échappement Obligatoire

**Règle:** Tous les caractères spéciaux HTML doivent être échappés dans JSX.

#### ❌ Erreur Courante
```typescript
<p>L'option "premium" est activée</p>
// ❌ Guillemets non échappés
```

#### ✅ Solutions

**Option 1: Entités HTML**
```typescript
<p>L&apos;option &quot;premium&quot; est activée</p>
```

**Option 2: Template Literals**
```typescript
<p>{`L'option "premium" est activée`}</p>
```

**Option 3: Guillemets Français**
```typescript
<p>L'option « premium » est activée</p>
```

### 5. Accessibilité (A11y) - Toujours Requise

**Règle:** Tous les éléments interactifs doivent être accessibles au clavier et lecteurs d'écran.

#### ❌ Violations A11y
```typescript
// Div cliquable sans keyboard handler
<div onClick={handleClick}>Click me</div>

// Label sans control associé
<label>Email</label>
<input type="email" />
```

#### ✅ Solutions Accessibles

**Option 1: Utiliser `<button>`**
```typescript
<button onClick={handleClick} type="button">
  Click me
</button>
```

**Option 2: Role + Keyboard Handlers**
```typescript
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Click me
</div>
```

**Option 3: Labels Associés**
```typescript
// Avec htmlFor + id
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Ou wrapper
<label>
  Email
  <input type="email" />
</label>
```

## 📚 Types Utility - Référence Complète

### Types Built-in TypeScript

```typescript
// Partial - tous les champs optionnels
type PartialUser = Partial<User>

// Required - tous les champs requis
type RequiredUser = Required<PartialUser>

// Pick - sélectionner certains champs
type UserEmail = Pick<User, 'email'>
type UserBasics = Pick<User, 'id' | 'name' | 'email'>

// Omit - exclure certains champs
type UserWithoutPassword = Omit<User, 'password'>

// Record - objet avec clés typées
type ErrorMap = Record<string, string>
type UserMap = Record<string, User>

// Extract - extraire types d'union
type StringOnly = Extract<string | number | boolean, string>

// Exclude - exclure types d'union
type NoStrings = Exclude<string | number | boolean, string>

// ReturnType - type de retour de fonction
type FetchResult = ReturnType<typeof fetchData>

// Parameters - paramètres de fonction
type HandleChangeParams = Parameters<typeof handleChange>

// NonNullable - exclure null et undefined
type NotNull = NonNullable<string | null | undefined>

// Readonly - rendre tous les champs readonly
type ImmutableUser = Readonly<User>
```

### Types React Utiles

```typescript
// Props avec children
type CardProps = {
  title: string
  children: React.ReactNode
  className?: string
}

// Props avec event handlers
type ButtonProps = {
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

// Generic component props
type ListProps<T> = {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string | number
}

// Component with ref
type InputProps = {
  value: string
  onChange: (value: string) => void
} & React.ComponentPropsWithoutRef<'input'>
```

## 🎯 Patterns Type-Safe Avancés

### Discriminated Unions

```typescript
type LoadingState = {
  status: 'loading'
}

type SuccessState = {
  status: 'success'
  data: User
}

type ErrorState = {
  status: 'error'
  error: string
}

type AsyncState = LoadingState | SuccessState | ErrorState

// Type-safe handling
function renderState(state: AsyncState) {
  switch (state.status) {
    case 'loading':
      return <Spinner />
    case 'success':
      return <UserProfile user={state.data} />
    case 'error':
      return <ErrorMessage message={state.error} />
  }
}
```

### Type Guards

```typescript
// Type guard function
function isUser(data: unknown): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data &&
    typeof (data as User).email === 'string'
  )
}

// Array type guard
function isUserArray(data: unknown): data is User[] {
  return Array.isArray(data) && data.every(isUser)
}

// Usage
const data: unknown = await fetchData()
if (isUser(data)) {
  console.log(data.email) // ✅ Type-safe
}
```

### Generic Helpers

```typescript
// Safe object access
function getProperty<T, K extends keyof T>(
  obj: T,
  key: K
): T[K] {
  return obj[key]
}

// Usage
const user: User = { id: '1', email: 'test@example.com' }
const email = getProperty(user, 'email') // Type: string

// Array find with type narrowing
function findById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id)
}
```

## 🔧 Workflow de Conformité

### Pre-Commit Checklist

Avant chaque commit:
- [ ] Aucun type `any` dans le code
- [ ] Toutes les variables sont utilisées ou préfixées `_`
- [ ] Tous les `useEffect`/`useMemo`/`useCallback` ont deps complètes
- [ ] Tous les éléments interactifs sont accessibles
- [ ] Toutes les entités HTML sont échappées
- [ ] `pnpm lint` passe sans warnings
- [ ] `pnpm type-check` passe sans erreurs

### Commandes de Vérification

```bash
# Lint avec auto-fix
pnpm lint --fix

# Type-check strict
pnpm type-check

# Build pour vérification complète
pnpm build

# Progression lint
./scripts/check-lint-progress.sh
```

### Quick Fixes Automatiques

```bash
# Auto-fix formatting et imports
pnpm lint --fix

# Organiser imports (VSCode)
# Cmd+Shift+P → "Organize Imports"

# Fix tous les problèmes auto-fixables
pnpm lint --fix && pnpm type-check
```

## 📖 Références et Ressources

### Documentation Officielle
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [ESLint React Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [jsx-a11y Guidelines](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)

### Outils du Projet
- `.cursor/rules/typescript-strict-typing.mdc` - Règles Cursor automatiques
- `AI-DD/12-LINT-ROADMAP.md` - Roadmap vers 100% conformité
- `AI-DD/13-LINT-FIX-EXAMPLES.md` - Exemples de corrections complètes
- `scripts/check-lint-progress.sh` - Suivi de progression

---

**🎯 Objectif: 100% de conformité TypeScript strict sans compromis**

**📌 Règle d'or: Si TypeScript se plaint, améliorer le code, pas contourner la vérification**
