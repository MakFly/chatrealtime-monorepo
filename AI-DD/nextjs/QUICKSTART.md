# 🚀 QUICK START - AI-DD

Documentation ultra-complète pour développement assisté par IA du projet iAutos.

## 📁 Documentation disponible

| Fichier | Sujet | Size |
|---------|-------|------|
| **00-INDEX.md** | Guide complet + Index | 11K |
| **01-NEXTJS-PATTERNS.md** | Next.js 15 App Router | 11K |
| **02-TYPESCRIPT-REACT.md** | TypeScript & React | 11K |
| **03-CLEAN-ARCHITECTURE.md** | Architecture feature-first | 11K |
| **04-SHADCN-UI.md** | Shadcn/UI + Tailwind v4 | 12K |
| **05-TANSTACK-QUERY.md** | TanStack Query v5 | 9.8K |
| **06-SAFE-ACTIONS.md** | next-safe-action | 8.4K |
| **07-ZUSTAND.md** | Zustand state management | 9K |
| **08-PATTERNS-RECIPES.md** | Patterns combinés | N/A |
| **10-CODING-STANDARDS.md** | Standards de code | 11K |

**Total: ~100KB de documentation avec exemples concrets!**

## ⚡ Pour un agent IA

**Prompt optimal:**
```
Feature: [nom]
Domaine: [cars|dealers|announcements|auth|payments|user]
Type: [component|hook|form|action|store]

Consulter: @AI-DD/[fichier approprié].md
Patterns: @AI-DD/08-PATTERNS-RECIPES.md
```

## 🎯 Best Practices 2025

```typescript
// ✅ MUST
type Car = {} // JAMAIS interface
cars-*.tsx // JAMAIS vehicles-
features/cars/ // JAMAIS components/cars/

// ✅ Server First
export default async function Page() // Par défaut
'use client' // Seulement si hooks/events

// ✅ Type-safe everything
- Zod pour validation
- next-safe-action pour server actions
- TanStack Query typed
- Zustand typed stores
```

## 📖 Lire en premier

1. **[00-INDEX.md](./00-INDEX.md)** - Vue d'ensemble complète
2. **[08-PATTERNS-RECIPES.md](./08-PATTERNS-RECIPES.md)** - Patterns combinés

Ensuite consulter les fichiers spécifiques selon besoin.

---

**Toute la doc est basée sur les best practices 2025 officielles!**
