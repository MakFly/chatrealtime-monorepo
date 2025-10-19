# 🎯 Roadmap vers 100% de conformité ESLint

Date: 2025-10-09
Objectif: Atteindre 0 warnings/errors dans `pnpm lint`

## 📊 État Actuel

### Statistiques par type d'erreur

| Type d'erreur | Count | Priorité | Temps estimé |
|---------------|-------|----------|--------------|
| `@typescript-eslint/no-explicit-any` | ~55 | 🔴 CRITICAL | 2-3h |
| `@typescript-eslint/no-unused-vars` | ~10 | 🟡 HIGH | 30min |
| `react/no-unescaped-entities` | ~6 | 🟢 LOW | 15min |
| `react-hooks/exhaustive-deps` | ~3 | 🟡 HIGH | 30min |
| `jsx-a11y/*` | ~6 | 🟡 MEDIUM | 45min |

**Total estimé: 4-5 heures de corrections**

## 🔥 Phase 1: Corrections Critiques (Typage)

### Priorité 1: Éliminer tous les `any` types

#### Fichier: `ContactInfoSection.tsx`
**55+ occurrences de `any`** - Record du projet!

**Problème:**
```typescript
const handleFieldChange = (field: any, value: any) => { /* ... */ }
```

**Solution:**
```typescript
// Définir les types de champs
type ContactInfoField =
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'postalCode'
  | 'website'
  | 'facebookUrl'
  | 'instagramUrl'

type ContactInfoValue = string

const handleFieldChange = (
  field: ContactInfoField,
  value: ContactInfoValue
) => {
  setFormData(prev => ({ ...prev, [field]: value }))
}
```

#### Fichier: `ProfessionalTypeSection.tsx`
**6 occurrences de `any`**

**Problème:**
```typescript
const data: any = formData
```

**Solution:**
```typescript
// Utiliser le type existant
import type { DealerProfile } from '@/types/dealer-profile'

const data: Partial<DealerProfile> = formData
```

#### Fichier: `DealerProfilePageClient.tsx`
**4 occurrences de `any`**

**Problème:**
```typescript
const handleUpdate = async (field: any, value: any) => { /* ... */ }
```

**Solution:**
```typescript
type ProfileField = keyof DealerProfile

const handleUpdate = async (field: ProfileField, value: string | string[]) => {
  // Type-safe update logic
}
```

#### Fichier: `siret-validation-modal.tsx`
**1 occurrence de `any`**

**Problème:**
```typescript
const onSuccess = (data: any) => { /* ... */ }
```

**Solution:**
```typescript
type SiretValidationData = {
  companyName: string
  siret: string
  isValid: boolean
}

const onSuccess = (data: SiretValidationData) => {
  onValidationComplete(data)
}
```

#### Fichier: `CreateAnnonceForm.tsx`
**2 occurrences de `any`**

**Problème:**
```typescript
user: any
quotas: any
```

**Solution:**
```typescript
import type { User } from '@/features/auth/types'
import type { UserQuotas } from '@/features/billing/types'

type CreateAnnonceFormProps = {
  user: User
  quotas: UserQuotas
}
```

### 🛠️ Script de correction automatique

Créer `scripts/fix-any-types.sh`:
```bash
#!/bin/bash

# Rechercher tous les fichiers avec 'any'
FILES=$(grep -rl "any" app/ features/ --include="*.tsx" --include="*.ts")

echo "Files with 'any' types:"
echo "$FILES"

echo ""
echo "Patterns to search:"
grep -rn ": any" app/ features/ --include="*.tsx" --include="*.ts" | head -20
```

## 🟡 Phase 2: Variables Non Utilisées

### Variables à supprimer ou utiliser

#### `BusinessHoursSection.tsx`
```typescript
// Ligne 135: 'short' défini mais jamais utilisé
// ❌ Supprimer ou préfixer _
const short = formatShortDay(day)

// ✅ Solution
const _short = formatShortDay(day) // si volontairement non utilisé
// ou supprimer si vraiment inutile
```

#### `DealerProfilePageClient.tsx`
```typescript
// Ligne 169: 'toastPromise' défini mais jamais utilisé
const toastPromise = toast.promise(/* ... */)

// ✅ Solution: Utiliser le toast
toastPromise.then(() => {
  console.log('Toast shown')
})

// Ou utiliser void si intentionnel
void toast.promise(/* ... */)
```

#### `siret-validation-modal.tsx`
```typescript
// Ligne 28: 'isLoading' défini mais jamais utilisé
const { isLoading, mutate } = useMutation(/* ... */)

// ✅ Solution: Utiliser isLoading
{isLoading && <Spinner />}

// Ou destructure sans l'assigner
const { mutate } = useMutation(/* ... */)
```

#### `PersonalInfoStep.tsx`
```typescript
// 'loadTestData' et 'handleSiretValidationComplete' non utilisés
const loadTestData = () => { /* ... */ }
const handleSiretValidationComplete = (data: any) => { /* ... */ }

// ✅ Solution: Supprimer ou activer en dev mode
const _loadTestData = () => { /* ... */ } // si debug uniquement
```

#### `layout.tsx`
```typescript
// 'AuthDebug' importé mais jamais utilisé
import { AuthDebug } from '@/features/auth'

// ✅ Solution: Supprimer l'import ou utiliser
// <AuthDebug /> dans le layout en dev mode
```

## 🟢 Phase 3: Entités HTML Non Échappées

### `AdvancedFeaturesSection.tsx`
```typescript
// Ligne 179, 181, 227: Guillemets non échappés
<p>Option "premium" activée</p>

// ✅ Solution 1: Entités HTML
<p>Option &quot;premium&quot; activée</p>

// ✅ Solution 2: Template literals
<p>{`Option "premium" activée`}</p>

// ✅ Solution 3: Guillemets français
<p>Option « premium » activée</p>
```

## 🟡 Phase 4: React Hooks Dependencies

### `siret-validation-modal.tsx`
```typescript
// Ligne 47: Dépendances manquantes
useEffect(() => {
  validateSiret()
  simulateValidation()
}, [isOpen])

// ✅ Solution: useCallback pour stabilité
const validateSiret = useCallback(() => {
  // validation logic
}, [])

const simulateValidation = useCallback(() => {
  // simulation logic
}, [reset, onValidationComplete])

useEffect(() => {
  if (isOpen) {
    validateSiret()
    simulateValidation()
  }
}, [isOpen, validateSiret, simulateValidation])
```

### `SecurityStep.tsx`
```typescript
// Ligne 40: Expression complexe dans dépendances
useEffect(() => {
  if (formData.password !== formData.confirmPassword) {
    setPasswordMatch(false)
  }
}, [formData.password !== formData.confirmPassword])

// ✅ Solution: Extraire les variables
const password = formData.password
const confirmPassword = formData.confirmPassword

useEffect(() => {
  setPasswordMatch(password === confirmPassword)
}, [password, confirmPassword])
```

## 🟢 Phase 5: Accessibilité (A11y)

### `ServicesSection.tsx`
```typescript
// Ligne 85: div cliquable sans keyboard handler
<div onClick={handleServiceToggle(service.id)}>
  Toggle service
</div>

// ✅ Solution 1: Utiliser un button
<button onClick={handleServiceToggle(service.id)}>
  Toggle service
</button>

// ✅ Solution 2: Ajouter keyboard handlers
<div
  role="button"
  tabIndex={0}
  onClick={handleServiceToggle(service.id)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleServiceToggle(service.id)()
    }
  }}
>
  Toggle service
</div>
```

### `settings/page.tsx`
```typescript
// Lignes 96, 100, 104, 113: Labels sans control
<label>Email</label>
<input type="email" />

// ✅ Solution: Associer label et input
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ Alternative: Wrapper
<label>
  Email
  <input type="email" />
</label>
```

## 📋 Plan d'Action Recommandé

### Semaine 1: Phase critique
- [ ] Jour 1-2: Corriger tous les `any` dans `ContactInfoSection.tsx`
- [ ] Jour 3: Corriger `ProfessionalTypeSection.tsx` et `DealerProfilePageClient.tsx`
- [ ] Jour 4: Corriger les autres fichiers avec `any`
- [ ] Jour 5: Vérification et tests

### Semaine 2: Phases complémentaires
- [ ] Jour 1: Variables non utilisées (toutes)
- [ ] Jour 2: Entités HTML + A11y
- [ ] Jour 3: React Hooks dependencies
- [ ] Jour 4-5: Tests et validation complète

## 🔧 Outils et Scripts Utiles

### Script de vérification progressive
```bash
#!/bin/bash
# scripts/check-lint-progress.sh

echo "=== Comptage par type d'erreur ==="
pnpm lint 2>&1 | grep "warning" | awk '{print $NF}' | sort | uniq -c | sort -rn

echo ""
echo "=== Files with most errors ==="
pnpm lint 2>&1 | grep "^/" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10

echo ""
echo "=== Total warnings ==="
pnpm lint 2>&1 | grep -c "warning"
```

### Auto-fix ce qui peut l'être
```bash
# Fix formatting
pnpm lint --fix

# Supprimer imports inutilisés (via IDE)
# VSCode: Organize Imports (Shift+Alt+O)

# Type-check strict
pnpm type-check
```

## 🎯 Métriques de Succès

### Objectifs par phase
1. **Phase 1 terminée**: `any` warnings = 0 (actuellement ~55)
2. **Phase 2 terminée**: unused-vars warnings = 0 (actuellement ~10)
3. **Phase 3 terminée**: HTML entities warnings = 0 (actuellement ~6)
4. **Phase 4 terminée**: hooks deps warnings = 0 (actuellement ~3)
5. **Phase 5 terminée**: a11y warnings = 0 (actuellement ~6)

### Validation finale
```bash
# Doit retourner 0 warnings
pnpm lint

# Doit passer sans erreur
pnpm type-check

# Build doit réussir
pnpm build
```

## 📚 Ressources

- **Nouvelle règle Cursor**: `.cursor/rules/typescript-strict-typing.mdc`
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **ESLint React**: https://github.com/jsx-eslint/eslint-plugin-react
- **A11y Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**🎯 Objectif: 0 warnings dans 2 semaines maximum**

**📌 Prochaine étape: Commencer par ContactInfoSection.tsx (plus gros fichier problématique)**
