# 🤖 AI-DD - AI-Driven Development Documentation

**Documentation ultra-complète pour le développement assisté par IA du projet iAutos**

Version: 2025.1 | Dernière mise à jour: 2025-10-06

## 🎯 Objectif

Ce répertoire contient **toute la documentation nécessaire** pour qu'un agent IA puisse créer des features de qualité production pour iAutos, en suivant les **best practices 2025** de chaque technologie utilisée.

## 📚 Technologies couvertes

- **Shadcn/UI** - Composants UI avec Tailwind CSS v4
- **Next.js 15** - App Router, Server Components, React 19
- **TanStack Query v5** - Data fetching, caching, synchronisation
- **next-safe-action** - Type-safe Server Actions
- **Zustand** - State management
- **React Hook Form + Zod** - Forms et validation
- **TypeScript 5** - Type safety complète

## 📖 Structure de la documentation

### Technologies & Patterns

| Fichier | Sujet | Exemples | Statut |
|---------|-------|----------|--------|
| **[00-INDEX.md](./00-INDEX.md)** | Index et guide | - | ✅ |
| **[01-NEXTJS-PATTERNS.md](./01-NEXTJS-PATTERNS.md)** | Next.js 15 patterns | Routes, RSC, Performance | ✅ |
| **[02-TYPESCRIPT-REACT.md](./02-TYPESCRIPT-REACT.md)** | TypeScript & React 19 | Types, Hooks, Components | ✅ |
| **[03-CLEAN-ARCHITECTURE.md](./03-CLEAN-ARCHITECTURE.md)** | Feature-first arch | Structure, Organization | ✅ |
| **[04-SHADCN-UI.md](./04-SHADCN-UI.md)** | Composants UI | CarCard, Filters, Modals | ✅ |
| **[05-TANSTACK-QUERY.md](./05-TANSTACK-QUERY.md)** | Data fetching | useCars, Prefetch, Mutations | ✅ |
| **[06-SAFE-ACTIONS.md](./06-SAFE-ACTIONS.md)** | Server Actions | Create car, Auth, Payments | ✅ |
| **[07-ZUSTAND.md](./07-ZUSTAND.md)** | State management | Filters, Auth, UI state | ✅ |
| **[08-PATTERNS-RECIPES.md](./08-PATTERNS-RECIPES.md)** | Patterns combinés | Features complètes | ✅ |

### Code Quality & Standards

| Fichier | Sujet | Exemples | Statut |
|---------|-------|----------|--------|
| **[09-TYPESCRIPT-STRICT-TYPING.md](./09-TYPESCRIPT-STRICT-TYPING.md)** | Typage strict | Type guards, No any, ESLint | ✅ |
| **[10-CODING-STANDARDS.md](./10-CODING-STANDARDS.md)** | Standards projet | Naming, Imports, Architecture | ✅ |
| **[11-SHARED-COMPONENTS.md](./11-SHARED-COMPONENTS.md)** | Composants partagés | UI components library | ✅ |
| **[12-LINT-ROADMAP.md](./12-LINT-ROADMAP.md)** | Roadmap vers 100% | Plan corrections, Statistiques | ✅ |
| **[13-LINT-FIX-EXAMPLES.md](./13-LINT-FIX-EXAMPLES.md)** | Exemples corrections | ContactInfoSection fix | ✅ |
| **[14-ERROR-HANDLING.md](./14-ERROR-HANDLING.md)** | Gestion d'erreurs | Error boundaries, useActionState | ✅ |
| **[16-API-PATTERNS.md](./16-API-PATTERNS.md)** | Patterns API | server.ts, client.ts, Retry, Timeout | ✅ |

## 🚀 Quick Start pour Agents IA

### Pour créer une nouvelle feature:

1. **Identifier le type de feature**:
   - UI Component → `04-SHADCN-UI.md`
   - Data fetching → `05-TANSTACK-QUERY.md`
   - Form → React Hook Form + Zod patterns
   - Server mutation → `06-SAFE-ACTIONS.md`
   - State management → `07-ZUSTAND.md`

2. **Consulter les patterns**:
   - Next.js patterns → `01-NEXTJS-PATTERNS.md`
   - TypeScript & React → `02-TYPESCRIPT-REACT.md`
   - Architecture → `03-CLEAN-ARCHITECTURE.md`
   - Patterns combinés → `08-PATTERNS-RECIPES.md`

3. **Garantir la qualité**:
   - TypeScript strict → `09-TYPESCRIPT-STRICT-TYPING.md`
   - Standards projet → `10-CODING-STANDARDS.md`
   - Linting 100% → `12-LINT-ROADMAP.md`
   - Exemples corrections → `13-LINT-FIX-EXAMPLES.md`

## 🎨 Contexte projet iAutos

### Stack technique
```yaml
Frontend:
  Framework: Next.js 15.4.5
  UI: Shadcn/UI + Tailwind CSS v4
  State: Zustand (client) + TanStack Query (server)
  Forms: React Hook Form + Zod
  Actions: next-safe-action
  Language: TypeScript 5 (strict mode)

Backend:
  API: Symfony 7.1+ (REST)
  Auth: JWT (httpOnly cookies)
  Storage: MinIO (S3-compatible)
  Search: Meilisearch
```

### Features principales
```typescript
// Domaines métier
type BusinessDomains = {
  cars: "Catalogue véhicules, recherche, filtres"
  dealers: "Concessionnaires, profils pros, CRM"
  announcements: "Création/gestion annonces (AI + Classic)"
  auth: "Authentification, sessions, profils"
  payments: "Paiements, factures, crédits"
  user: "Profils utilisateurs, préférences"
}
```

### Conventions projet
```typescript
// ⚠️ RÈGLES CRITIQUES
type ProjectRules = {
  types: "TOUJOURS 'type', JAMAIS 'interface'"
  naming: "TOUJOURS 'cars-*', JAMAIS 'vehicles-*'"
  architecture: "Feature-first (features/ pas components/)"
  packageManager: "PNPM uniquement (jamais npm/yarn)"
  routes: "/account/private (PAS /dashboard)"
  api: "API clients unifiés (serverAPI/clientAPI)"
}
```

## 💡 Comment utiliser cette documentation

### Pour les Agents IA

**Contexte à fournir lors de la création de feature:**

```markdown
Feature: [Nom de la feature]
Type: [UI Component / Data Fetching / Form / Server Action / State]
Domaine: [cars / dealers / announcements / auth / payments / user]

Consulter:
- @AI-DD/[fichier approprié].md pour patterns
- @AI-DD/07-PATTERNS-RECIPES.md pour exemples combinés
- @AI-DD/08-EXAMPLES-TEMPLATES.md pour templates

Suivre:
- Best practices 2025 de chaque technologie
- Conventions projet iAutos
- Architecture feature-first
```

### Exemples de requêtes optimales

#### ✅ Créer un composant UI
```
Créer un CarCard component pour afficher une voiture dans le catalogue.
Consulter @AI-DD/01-SHADCN-UI.md pour patterns Shadcn/UI.
Feature: cars
Type: UI Component
```

#### ✅ Créer un hook de data fetching
```
Créer un hook useCars pour fetcher et cacher la liste des voitures.
Consulter @AI-DD/03-TANSTACK-QUERY.md pour TanStack Query patterns.
Feature: cars
Type: Data Fetching
```

#### ✅ Créer un formulaire
```
Créer un formulaire de création d'annonce avec validation.
Consulter @AI-DD/06-FORMS-VALIDATION.md pour React Hook Form + Zod.
Feature: announcements
Type: Form
```

#### ✅ Créer une feature complète
```
Créer une feature complète de recherche de voitures:
- Filtres (UI + State)
- Liste de résultats (Data fetching)
- Détails en modal (Intercepting routes)

Consulter:
- @AI-DD/07-PATTERNS-RECIPES.md pour pattern complet
- @AI-DD/08-EXAMPLES-TEMPLATES.md pour template CRUD
```

## 🎓 Principes de développement

### 1. Type Safety First
```typescript
// ✅ TOUJOURS
type Car = {
  id: string
  brand: string
  model: string
}

// ❌ JAMAIS
const car: any = ...
interface Car { ... } // Utiliser 'type'
```

### 2. Feature-First Architecture
```
features/cars/
  ├── components/    # UI components
  ├── hooks/         # Custom hooks
  ├── lib/           # Business logic, API
  ├── stores/        # Zustand stores
  └── index.ts       # Public API
```

### 3. Server-First Mindset
```typescript
// ✅ Server Component par défaut
export default async function Page() {
  const data = await fetchData()
  return <UI data={data} />
}

// ✅ Client Component seulement si nécessaire
'use client'
export function InteractiveComponent() {
  const [state, setState] = useState()
  return <UI />
}
```

### 4. Performance-Conscious
```typescript
// ✅ Code splitting
const HeavyComponent = dynamic(() => import('./Heavy'))

// ✅ Memoization
const MemoComponent = memo(ExpensiveComponent)

// ✅ Lazy loading
<Suspense fallback={<Skeleton />}>
  <LazyComponent />
</Suspense>
```

## 📋 Checklist création de feature

### Avant de commencer
- [ ] Identifier le domaine métier (cars/dealers/announcements/etc.)
- [ ] Consulter la documentation appropriée
- [ ] Vérifier les exemples similaires existants
- [ ] Planifier l'architecture de la feature

### Pendant le développement
- [ ] Suivre les conventions de nommage du projet
- [ ] Utiliser les types TypeScript (pas `any`)
- [ ] Implémenter error handling
- [ ] Ajouter loading states
- [ ] Optimiser performance (code splitting, memoization)
- [ ] Tests si complexe

### Avant de merger
- [ ] TypeScript compile sans erreur
- [ ] ESLint passe (architecture rules)
- [ ] Patterns suivent la documentation AI-DD
- [ ] Code est maintenable et documenté
- [ ] Performance OK (Lighthouse > 90)

## 🔍 Index des exemples

### Par type de composant

**UI Components** (01-SHADCN-UI.md):
- CarCard - Carte véhicule avec variants
- CarFilters - Filtres avec Shadcn components
- DealerProfile - Profil concessionnaire
- CreateAnnonceWizard - Wizard multi-steps

**Data Hooks** (03-TANSTACK-QUERY.md):
- useCars - Liste véhicules avec cache
- useCarDetails - Détails véhicule
- useInfiniteScroll - Pagination infinie
- usePrefetch - Prefetch optimistic

**Forms** (06-FORMS-VALIDATION.md):
- CarSearchForm - Formulaire de recherche
- CreateCarForm - Création annonce
- UserProfileForm - Profil utilisateur
- DealerRegistrationForm - Inscription pro

**Server Actions** (04-SAFE-ACTIONS.md):
- createCarAction - Créer annonce
- updateUserAction - Mettre à jour profil
- loginAction - Authentification
- uploadImageAction - Upload média

**Stores** (05-ZUSTAND.md):
- useFiltersStore - Filtres de recherche
- useAuthStore - État authentification
- useUIStore - État UI (modals, drawer)
- useCartStore - Panier (si e-commerce)

### Par domaine métier

**Cars** (Véhicules):
- Components: CarCard, CarList, CarDetails, CarFilters
- Hooks: useCars, useCarDetails, useCarSearch
- Forms: CarSearchForm, CreateCarForm
- Actions: createCar, updateCar, deleteCar

**Dealers** (Concessionnaires):
- Components: DealerCard, DealerProfile, DealerDashboard
- Hooks: useDealers, useDealerStats
- Forms: DealerProfileForm, DealerRegistrationForm
- Actions: createDealer, updateDealerProfile

**Announcements** (Annonces):
- Components: CreateAnnonceWizard, AnnonceList
- Hooks: useAnnouncements, useAnnonceCreation
- Forms: CreateAnnonceForm (Classic/AI)
- Actions: createAnnounce, updateAnnounce

**Auth** (Authentification):
- Components: LoginForm, RegisterForm, AuthProvider
- Hooks: useAuth, useSession, useUser
- Forms: LoginForm, RegisterForm, ResetPasswordForm
- Actions: login, register, logout, resetPassword

## 🌟 Best Practices Highlights

### Shadcn/UI (2025)
- ✅ Tailwind v4 inline theming (pas de config)
- ✅ React 19 support complet
- ✅ Radix UI primitives
- ✅ Composable et customizable

### Next.js 15 (2025)
- ✅ App Router (pas Pages Router)
- ✅ Server Components par défaut
- ✅ Parallel & Intercepting routes
- ✅ Turbopack pour dev speed

### TanStack Query v5 (2025)
- ✅ HydrationBoundary (pas Hydrate)
- ✅ Prefetch sans await
- ✅ staleTime > 0 pour SSR
- ✅ Integration avec Server Actions

### next-safe-action (2025)
- ✅ Validation Zod obligatoire
- ✅ Middleware pour auth
- ✅ Type-safe client/server
- ✅ FormData support avec zod-form-data

### Zustand (2025)
- ✅ Per-request stores (pas global)
- ✅ Slice pattern pour organisation
- ✅ Pas de hooks dans RSC
- ✅ Persistence avec middleware

## 📞 Support & Ressources

### Documentation officielle
- [Next.js](https://nextjs.org/docs)
- [Shadcn/UI](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query/latest)
- [next-safe-action](https://next-safe-action.dev)
- [Zustand](https://zustand.docs.pmnd.rs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)

### Projet iAutos
- CLAUDE.md - Instructions projet
- frontend/AI-DD/ - Rules frontend spécifiques
- backend/ - API Symfony

---

**🚀 Prêt à créer des features de qualité !**

Consulter les fichiers de documentation détaillée pour chaque technologie.
