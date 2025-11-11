# AI-DD - AI-Driven Development Rules

**AI-DD** (AI-Driven Development) centralise toutes les règles, bonnes pratiques et instructions pour le développement assisté par IA du projet iAutos Frontend.

## 📋 Structure

```
AI-DD/
├── 00-README.md                    # Ce fichier
├── 01-NEXTJS-PATTERNS.md          # Next.js 15 App Router patterns
├── 02-TYPESCRIPT-REACT.md         # TypeScript & React guidelines
├── 03-CLEAN-ARCHITECTURE.md       # Architecture patterns
├── 04-API-INTEGRATION.md          # API client patterns
├── 05-STATE-MANAGEMENT.md         # Zustand & React Query
├── 06-FORMS-VALIDATION.md         # Forms & validation
├── 07-TESTING.md                  # Testing strategies
├── 08-PERFORMANCE.md              # Performance best practices
├── 09-SEO.md                      # SEO & accessibility
└── 10-CODING-STANDARDS.md         # Code style & conventions
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
import { serverAPI } from '@/shared/lib/api'

const { data } = await serverAPI.get('/cars')

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

| Fichier | Sujet | Quand consulter |
|---------|-------|-----------------|
| `01-NEXTJS-PATTERNS.md` | Next.js 15 patterns | Créer routes, layouts, utiliser App Router |
| `02-TYPESCRIPT-REACT.md` | TypeScript & React | Définir types, créer components |
| `03-CLEAN-ARCHITECTURE.md` | Architecture | Organiser code, créer features |
| `04-API-INTEGRATION.md` | API client | Appeler backend, gérer erreurs |
| `05-STATE-MANAGEMENT.md` | State management | Zustand stores, React Query |
| `06-FORMS-VALIDATION.md` | Forms & validation | React Hook Form, Zod schemas |
| `07-TESTING.md` | Testing | Tests unitaires, E2E |
| `08-PERFORMANCE.md` | Performance | Optimisations, code splitting |
| `09-SEO.md` | SEO & a11y | Métadonnées, accessibilité |
| `10-CODING-STANDARDS.md` | Standards | Code style, conventions |

## 🎓 Pour commencer

1. **Nouveau component**: Lire `02-TYPESCRIPT-REACT.md` + `03-CLEAN-ARCHITECTURE.md`
2. **Nouvelle route**: Lire `01-NEXTJS-PATTERNS.md`
3. **Appel API**: Lire `04-API-INTEGRATION.md`
4. **Formulaire**: Lire `06-FORMS-VALIDATION.md`
5. **Store**: Lire `05-STATE-MANAGEMENT.md`

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

---

**Version**: 2.5
**Dernière mise à jour**: 2025-10-06
**Mainteneur**: Équipe Dev iAutos
