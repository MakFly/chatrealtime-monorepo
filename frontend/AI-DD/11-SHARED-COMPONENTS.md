# 📋 Prompt : Organisation des Composants dans @shared/components

## 🎯 Vue d'ensemble

Ce prompt guide l'organisation des composants dans `shared/components/` pour maintenir une architecture clean et réutilisable. Il complète les règles Cursor définies dans [shared-components-organization.mdc](../.cursor/rules/shared-components-organization.mdc).

## 🏗️ Structure Recommandée

### 1. **Identifier le Type de Composant**
Avant de créer un composant, pose-toi ces questions :
- **Est-ce un composant UI de base ?** (bouton, carte, input) → `ui/`
- **Est-ce un élément de layout ?** (header, footer, sidebar) → `layout/`
- **Est-ce un composant avec logique métier partagée ?** (spinner personnalisé, error boundary) → `common/`

### 2. **Règles de Placement**
- **ui/** : Composants primitifs, souvent basés sur Shadcn/UI. Ex. : Button, Dialog, Card.
- **layout/** : Composants qui définissent la structure de la page. Peuvent inclure des éléments comme Header, Footer.
- **common/** : Composants génériques ou avec logique métier légère, réutilisables across features.

## 🔧 Conseils Pratiques

### Pour les Composants UI
- Utilise les composants de Shadcn/UI comme base.
- Étends-les avec des props typées (toujours `type`, pas `interface`).
- Exemple : Un bouton personnalisé pour iAutos.

```typescript
// Dans shared/components/ui/CarButton.tsx
export type CarButtonProps = {
  car: Car  // Type importé depuis shared/types ou features
  onClick?: (car: Car) => void
}

export function CarButton({ car, onClick }: CarButtonProps) {
  return (
    <Button onClick={() => onClick?.(car)}>
      Voir {car.title}
    </Button>
  )
}
```

### Pour les Composants de Layout
- Pense "structure" : Comment ça organise la page ?
- Exemple : Un layout pour les pages de catalogue.

```typescript
// Dans shared/components/layout/CatalogLayout.tsx
export type CatalogLayoutProps = {
  filters: ReactNode
  children: ReactNode
}

export function CatalogLayout({ filters, children }: CatalogLayoutProps) {
  return (
    <div className="catalog-layout">
      <aside>{filters}</aside>
      <main>{children}</main>
    </div>
  )
}
```

### Pour les Composants Common
- Logique métier partagée, mais pas spécifique à une feature.
- Exemple : Un composant de recherche générique.

```typescript
// Dans shared/components/common/GlobalSearch.tsx
import { useSearch } from '@/shared/hooks/useSearch'

export function GlobalSearch() {
  const { query, results, search } = useSearch('/api/search')

  return (
    <div className="search-container">
      <input value={query} onChange={(e) => search(e.target.value)} />
      {results.map(item => <div key={item.id}>{item.title}</div>)}
    </div>
  )
}
```

## ⚠️ Erreurs Courantes à Éviter

- **Placer dans le mauvais dossier** : Un bouton stylisé dans `layout/` au lieu de `ui/`.
- **Logique métier dans UI** : Éviter les appels API directs dans `ui/` ; déléguer à des hooks.
- **Dépendances interdites** : Ne pas importer depuis `features/` dans `shared/`.
- **Types incorrects** : Toujours `type`, jamais `interface`.

## 🎨 Intégration avec l'Architecture Globale

- **Shared Kernel** : Tous les composants ici sont réutilisables across features.
- **Feature-First** : Les composants spécifiques à une feature restent dans `features/[feature]/components/`.
- **Tests** : Chaque composant doit avoir des tests co-localisés.
- **Exports** : Utilise des barrel exports pour une API propre.

## 📈 Avantages
- **Réutilisabilité** : Composants partagés réduisent la duplication.
- **Maintenabilité** : Séparation claire facilite les updates.
- **Performance** : Composants optimisés et cohérents.

## 🚀 Prochaines Étapes
1. Vérifie le type de ton composant.
2. Place-le dans le sous-dossier approprié.
3. Respecte les règles de types et d'exports.
4. Ajoute des tests et de la documentation si nécessaire.

Référence : [AI-DD Index](../AI-DD/00-INDEX.md) pour plus de détails sur l'architecture.
