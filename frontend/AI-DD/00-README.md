# AI-DD - AI-Driven Development Rules

**AI-DD** (AI-Driven Development) centralise toutes les règles, bonnes pratiques et instructions pour le développement assisté par IA du projet iAutos Frontend.

## 📋 Structure

### Technologies & Patterns
```
AI-DD/
├── 00-INDEX.md                    # Index complet avec quick start
├── 00-README.md                   # Ce fichier - Vue d'ensemble
├── 01-NEXTJS-PATTERNS.md         # Next.js 15 App Router patterns
├── 02-TYPESCRIPT-REACT.md        # TypeScript & React 19 guidelines
├── 03-CLEAN-ARCHITECTURE.md      # Feature-first architecture
├── 04-SHADCN-UI.md               # Shadcn/UI + Tailwind v4
├── 05-TANSTACK-QUERY.md          # TanStack Query v5 patterns
├── 06-SAFE-ACTIONS.md            # next-safe-action patterns
├── 07-ZUSTAND.md                 # Zustand state management
└── 08-PATTERNS-RECIPES.md        # Combined patterns & recipes
```

### Code Quality & Standards
```
AI-DD/
├── 09-TYPESCRIPT-STRICT-TYPING.md # TypeScript strict, no any
├── 10-CODING-STANDARDS.md         # Code style & conventions
├── 11-SHARED-COMPONENTS.md        # Shared components library
├── 12-LINT-ROADMAP.md            # ESLint 100% roadmap
└── 13-LINT-FIX-EXAMPLES.md       # Lint fix examples
```

## 🎯 Objectif

Ces règles sont destinées à être utilisées par:
- **Claude Code** via `@CLAUDE.md`
- **Cursor IDE** via `.cursor/rules/`
- **GitHub Copilot** via `.github/copilot-instructions.md`
- **Développeurs** comme référence

## 🚀 Usage pour Claude Code

Dans `CLAUDE.md`, référencer ces règles:

```markdown
## AI-DD Rules

Consulter les règles AI-DD pour:
- Architecture: @frontend/AI-DD/03-CLEAN-ARCHITECTURE.md
- Next.js patterns: @frontend/AI-DD/01-NEXTJS-PATTERNS.md
- TypeScript: @frontend/AI-DD/02-TYPESCRIPT-REACT.md
- API integration: @frontend/AI-DD/04-API-INTEGRATION.md
```

## 📚 Principes fondamentaux

### 1. Feature-First Architecture

Code organisé par domaine métier, pas par type technique:

```
✅ CORRECT
features/cars/
  ├── components/
  ├── hooks/
  ├── lib/
  └── index.ts

❌ INCORRECT
components/cars/
hooks/cars/
lib/cars/
```

### 2. Type Safety

- **TOUJOURS** `type` pour les définitions, **JAMAIS** `interface`
- Mode strict TypeScript activé
- Aucun `any` toléré (sauf cas exceptionnels documentés)

### 3. Naming Conventions

- **Automotive**: Toujours `cars-*` jamais `vehicles-*`
- **Components**: PascalCase (`CarCard`, `UserProfile`)
- **Functions**: camelCase (`fetchCars`, `formatPrice`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### 4. Performance First

- Code splitting par route et feature
- Lazy loading des components lourds
- Images optimisées avec Next.js Image
- Bundle size < 500KB total

### 5. Developer Experience

- Barrel exports (`index.ts`) pour public APIs
- Types exportés clairement
- Documentation inline (JSDoc)
- Tests co-localisés avec code

## 🔧 Quick Reference

### Imports

```typescript
// ✅ CORRECT
import { CarCard, useCars } from '@/features/cars'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

// ❌ INCORRECT
import { CarCard } from '@/components/car/CarCard'
import { useCars } from '@/hooks/cars/use-cars'
```

### API Calls

```typescript
// Server Component
import { serverGet } from '@/shared/lib/api/server'

const { data } = await serverGet('/cars')

// Client Component
import { clientAPI } from '@/shared/lib/api'

const { data } = await clientAPI.get('/cars')
```

### Type Definitions

```typescript
// ✅ CORRECT
export type Car = {
  id: string
  brand: string
  model: string
}

// ❌ INCORRECT
export interface Car {
  id: string
  brand: string
  model: string
}
```

### Component Patterns

```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetch('...')
  return <div>{data}</div>
}

// Client Component
'use client'
export default function InteractiveComponent() {
  const [state, setState] = useState()
  return <div>{state}</div>
}
```

## 📖 Documentation Index

### Technologies & Patterns

| Fichier | Sujet | Quand consulter |
|---------|-------|-----------------|
| `01-NEXTJS-PATTERNS.md` | Next.js 15 patterns | Créer routes, layouts, utiliser App Router |
| `02-TYPESCRIPT-REACT.md` | TypeScript & React 19 | Définir types, créer components |
| `03-CLEAN-ARCHITECTURE.md` | Feature-first architecture | Organiser code, créer features |
| `04-SHADCN-UI.md` | Shadcn/UI + Tailwind v4 | Components UI, styling |
| `05-TANSTACK-QUERY.md` | TanStack Query v5 | Data fetching, cache, mutations |
| `06-SAFE-ACTIONS.md` | next-safe-action | Server Actions type-safe |
| `07-ZUSTAND.md` | Zustand stores | Client state management |
| `08-PATTERNS-RECIPES.md` | Combined patterns | Features complètes end-to-end |

### Code Quality & Standards

| Fichier | Sujet | Quand consulter |
|---------|-------|-----------------|
| `09-TYPESCRIPT-STRICT-TYPING.md` | TypeScript strict typing | Éliminer any, type guards, ESLint |
| `10-CODING-STANDARDS.md` | Standards projet | Code style, naming, conventions |
| `11-SHARED-COMPONENTS.md` | Shared components | UI library, composants réutilisables |
| `12-LINT-ROADMAP.md` | ESLint 100% roadmap | Plan corrections, progression |
| `13-LINT-FIX-EXAMPLES.md` | Lint fix examples | Exemples corrections complètes |

## 🎓 Pour commencer

### Développement Features

1. **Nouveau component**: Lire `02-TYPESCRIPT-REACT.md` + `04-SHADCN-UI.md`
2. **Nouvelle route**: Lire `01-NEXTJS-PATTERNS.md`
3. **Data fetching**: Lire `05-TANSTACK-QUERY.md`
4. **Server Action**: Lire `06-SAFE-ACTIONS.md`
5. **State management**: Lire `07-ZUSTAND.md`
6. **Feature complète**: Lire `08-PATTERNS-RECIPES.md`

### Qualité & Conformité

1. **Typage strict**: Lire `09-TYPESCRIPT-STRICT-TYPING.md` (éliminer any)
2. **Standards projet**: Lire `10-CODING-STANDARDS.md` (conventions)
3. **Atteindre ESLint 100%**: Lire `12-LINT-ROADMAP.md` (plan d'action)
4. **Corrections types**: Lire `13-LINT-FIX-EXAMPLES.md` (exemples)

## 🔄 Maintenance

Ces règles doivent être mises à jour quand:
- Nouvelles patterns Next.js disponibles
- Architecture évolue (v2.5+)
- Best practices changent
- Problèmes récurrents identifiés

## ⚡ TL;DR - Règles critiques

```yaml
MUST:
  - Use 'type' not 'interface'
  - Use 'cars-' prefix for automotive files
  - Feature-first organization
  - No 'any' types
  - PNPM only (never npm/yarn)

MUST_NOT:
  - Use 'vehicles-' prefix
  - Import feature internals
  - Use /dashboard route (use /account/private)
  - Direct fetch() calls (use API clients)
  - 'use client' everywhere (Server Components by default)

SHOULD:
  - Code splitting
  - Lazy loading
  - Image optimization
  - Type safety
  - Tests co-located

RECOMMENDED:
  - JSDoc documentation
  - Barrel exports
  - Separation of concerns
  - Performance monitoring
  - Accessibility
```

## 🔧 Outils de Qualité

### Scripts Disponibles

```bash
# Vérifier conformité ESLint
pnpm lint

# Auto-fix ce qui peut l'être
pnpm lint --fix

# Type-check strict TypeScript
pnpm type-check

# Suivi progression ESLint vers 100%
./scripts/check-lint-progress.sh

# Build production complet
pnpm build
```

### Cursor Rules Automatiques

Règles appliquées automatiquement par Cursor IDE (dans `.cursor/rules/`):

- `typescript-strict-typing.mdc` - No any, ESLint 100% compliance
- `ai-dd-nextjs-patterns.mdc` - Next.js 15 patterns enforcement
- `ai-dd-typescript-react.mdc` - TypeScript & React 19 rules
- `ai-dd-clean-architecture.mdc` - Feature-first architecture
- `ai-dd-project-rules.mdc` - Règles spécifiques iAutos
- `api-server-endpoint.mdc` - server.ts endpoint unique

### Objectifs Qualité

- ✅ **TypeScript strict:** 100% (no any types)
- ✅ **ESLint conformance:** Objectif 100% (actuellement ~80 warnings)
- ✅ **Type coverage:** >95%
- ✅ **Architecture compliance:** Feature-first obligatoire
- ✅ **Performance:** Lighthouse score >90

---

**Version**: 2.5.1
**Dernière mise à jour**: 2025-10-09
**Mainteneur**: Équipe Dev iAutos

**Changelog 2.5.1:**
- ✅ Ajout section Code Quality & Standards (09-13)
- ✅ Documentation typage strict complet
- ✅ Roadmap ESLint 100% avec exemples
- ✅ Nouvelles règles Cursor pour qualité
- ✅ Scripts de suivi de progression
