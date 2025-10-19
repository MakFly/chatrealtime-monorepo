# AI-DD - AI-Driven Development Rules

Lire **[00-README.md](./00-README.md)** pour la documentation complète.

## 📁 Structure

| Fichier | Sujet | Status |
|---------|-------|--------|
| [00-README.md](./00-README.md) | Introduction & Index | ✅ Complet |
| [01-NEXTJS-PATTERNS.md](./01-NEXTJS-PATTERNS.md) | Next.js 15 App Router | ✅ Complet |
| [02-TYPESCRIPT-REACT.md](./02-TYPESCRIPT-REACT.md) | TypeScript & React | ✅ Complet |
| [03-CLEAN-ARCHITECTURE.md](./03-CLEAN-ARCHITECTURE.md) | Clean Architecture | ✅ Complet |
| 04-API-INTEGRATION.md | API Client patterns | 🔄 À créer |
| 05-STATE-MANAGEMENT.md | Zustand & React Query | 🔄 À créer |
| 06-FORMS-VALIDATION.md | Forms & validation | 🔄 À créer |
| 07-TESTING.md | Testing strategies | 🔄 À créer |
| 08-PERFORMANCE.md | Performance | 🔄 À créer |
| 09-SEO.md | SEO & Accessibility | 🔄 À créer |
| [10-CODING-STANDARDS.md](./10-CODING-STANDARDS.md) | Code standards | ✅ Complet |

## 🎯 Usage rapide

### Pour Claude Code

Référencer dans `CLAUDE.md`:

```markdown
## AI-DD Rules

Consulter @frontend/AI-DD/ pour:
- Next.js: @01-NEXTJS-PATTERNS.md
- TypeScript: @02-TYPESCRIPT-REACT.md
- Architecture: @03-CLEAN-ARCHITECTURE.md
- Standards: @10-CODING-STANDARDS.md
```

### Règles critiques

```yaml
MUST:
  - Use 'type' not 'interface'
  - Use 'cars-' prefix (never 'vehicles-')
  - Feature-first organization
  - No 'any' types
  - PNPM only

MUST_NOT:
  - Import feature internals
  - Use /dashboard (use /account/private)
  - Direct fetch() calls
  - 'use client' everywhere
```

## 🚀 Quick Reference

```typescript
// ✅ Imports
import { CarCard, useCars } from '@/features/cars'
import { Button } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

// ✅ Types
export type Car = { id: string; brand: string }

// ✅ API
import { serverGet } from '@/shared/lib/api/server'
import { clientAPI } from '@/shared/lib/api'
const { data } = await serverGet('/cars')
```

---

**Voir [00-README.md](./00-README.md) pour documentation complète**
