# 🔧 Exemple de Correction: ContactInfoSection.tsx

## 📋 Problème Identifié

**Fichier:** `app/account/private/dealer-profile/components/ContactInfoSection.tsx`
**Erreurs:** 26 occurrences de `any` type
**Ligne typique:** `(existingProfile?.company as any)?.name`

## 🎯 Solution Complète

### Étape 1: Définir les types manquants

```typescript
// Ajouter dans types/dealer-profile.ts (ou créer types/user-profile.ts)

type CompanyInfo = {
  name?: string
  address?: string
  city?: string
  zipCode?: string
  siret?: string
  phone?: string
  email?: string
}

type UserProfileData = {
  email?: string
  companyName?: string
  companyAddress?: string
  companyCity?: string
  companyZipCode?: string
  companyPhone?: string
  siret?: string
  company?: CompanyInfo
}

type ExistingProfileData = {
  company?: CompanyInfo
}
```

### Étape 2: Mettre à jour les props du composant

**❌ Avant:**
```typescript
type ContactInfoSectionProps = {
  formData: DealerProfileFormData
  updateFormData: <K extends keyof DealerProfileFormData>(
    field: K,
    value: DealerProfileFormData[K]
  ) => void
  userProfile?: Record<string, unknown>  // ❌ Type trop vague
  existingProfile?: Record<string, unknown>  // ❌ Type trop vague
}
```

**✅ Après:**
```typescript
type ContactInfoSectionProps = {
  formData: DealerProfileFormData
  updateFormData: <K extends keyof DealerProfileFormData>(
    field: K,
    value: DealerProfileFormData[K]
  ) => void
  userProfile?: UserProfileData  // ✅ Type précis
  existingProfile?: ExistingProfileData  // ✅ Type précis
}
```

### Étape 3: Créer des helpers pour accès sûr

**❌ Avant:**
```typescript
{((existingProfile?.company as any)?.name ||
  (userProfile?.company as any)?.name ||
  userProfile?.companyName) ? (
  <div>
    <Label className="text-sm text-muted-foreground">Nom de l'entreprise</Label>
    <p className="font-medium">
      {(existingProfile?.company as any)?.name ||
       (userProfile?.company as any)?.name ||
       userProfile?.companyName}
    </p>
  </div>
) : null}
```

**✅ Après (avec helper):**
```typescript
// Helper en haut du composant
const getCompanyValue = <K extends keyof CompanyInfo>(
  key: K
): string | undefined => {
  // Priorité: existingProfile.company > userProfile.company > userProfile direct
  return (
    existingProfile?.company?.[key] ||
    userProfile?.company?.[key] ||
    (key === 'name' ? userProfile?.companyName :
     key === 'address' ? userProfile?.companyAddress :
     key === 'city' ? userProfile?.companyCity :
     key === 'zipCode' ? userProfile?.companyZipCode :
     key === 'phone' ? userProfile?.companyPhone :
     key === 'siret' ? userProfile?.siret :
     undefined)
  )
}

// Usage dans le JSX
const companyName = getCompanyValue('name')
const companyAddress = getCompanyValue('address')
const companyCity = getCompanyValue('city')
const companyZipCode = getCompanyValue('zipCode')
const companyPhone = getCompanyValue('phone')
const companySiret = getCompanyValue('siret')

// JSX simplifié
{companyName && (
  <div>
    <Label className="text-sm text-muted-foreground">Nom de l'entreprise</Label>
    <p className="font-medium">{companyName}</p>
  </div>
)}
```

### Étape 4: Version Complète Corrigée

```typescript
'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Separator } from '@/shared/components/ui/separator'
import { UserCheck } from 'lucide-react'
import type { DealerProfileFormData } from '@/types/dealer-profile'

// ✅ Types précis
type CompanyInfo = {
  name?: string
  address?: string
  city?: string
  zipCode?: string
  siret?: string
  phone?: string
  email?: string
}

type UserProfileData = {
  email?: string
  companyName?: string
  companyAddress?: string
  companyCity?: string
  companyZipCode?: string
  companyPhone?: string
  siret?: string
  company?: CompanyInfo
}

type ExistingProfileData = {
  company?: CompanyInfo
}

type ContactInfoSectionProps = {
  formData: DealerProfileFormData
  updateFormData: <K extends keyof DealerProfileFormData>(
    field: K,
    value: DealerProfileFormData[K]
  ) => void
  userProfile?: UserProfileData
  existingProfile?: ExistingProfileData
}

export function ContactInfoSection({
  formData,
  updateFormData,
  userProfile,
  existingProfile
}: ContactInfoSectionProps) {
  // ✅ Helper type-safe pour accès aux valeurs
  const getCompanyValue = <K extends keyof CompanyInfo>(
    key: K
  ): string | undefined => {
    return (
      existingProfile?.company?.[key] ||
      userProfile?.company?.[key] ||
      (key === 'name' ? userProfile?.companyName :
       key === 'address' ? userProfile?.companyAddress :
       key === 'city' ? userProfile?.companyCity :
       key === 'zipCode' ? userProfile?.companyZipCode :
       key === 'phone' ? userProfile?.companyPhone :
       key === 'siret' ? userProfile?.siret :
       undefined)
    )
  }

  // ✅ Extraire les valeurs une seule fois
  const companyName = getCompanyValue('name')
  const companyAddress = getCompanyValue('address')
  const companyCity = getCompanyValue('city')
  const companyZipCode = getCompanyValue('zipCode')
  const companyPhone = getCompanyValue('phone')
  const companySiret = getCompanyValue('siret')
  const companyEmail = getCompanyValue('email') || userProfile?.email

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          Informations de contact et visibilité
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Informations de votre entreprise et paramètres de visibilité
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ✅ Informations de l'entreprise - Type-safe */}
        {(userProfile || existingProfile?.company) && (
          <div className="space-y-4">
            <h4 className="font-medium">Informations de votre entreprise</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              {companyName && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Nom de l'entreprise
                  </Label>
                  <p className="font-medium">{companyName}</p>
                </div>
              )}

              {companyAddress && (
                <div>
                  <Label className="text-sm text-muted-foreground">Adresse</Label>
                  <p className="text-sm">{companyAddress}</p>
                  {companyCity && companyZipCode && (
                    <p className="text-sm">
                      {companyZipCode} {companyCity}
                    </p>
                  )}
                </div>
              )}

              {companySiret && (
                <div>
                  <Label className="text-sm text-muted-foreground">SIRET</Label>
                  <p className="font-mono text-sm">{companySiret}</p>
                </div>
              )}

              {companyPhone && (
                <div>
                  <Label className="text-sm text-muted-foreground">Téléphone</Label>
                  <p className="text-sm">{companyPhone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* ✅ Email de contact - Type-safe */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Email de contact public</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="contact@monentreprise.com"
            value={formData.contactEmail}
            onChange={(e) => updateFormData('contactEmail', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Cet email sera affiché publiquement. Laissez vide pour utiliser{' '}
            {companyEmail || 'votre email principal'}.
          </p>
        </div>

        {/* Reste du composant... */}
      </CardContent>
    </Card>
  )
}
```

## 📊 Résultat

### Avant
- ❌ 26 occurrences de `any`
- ❌ Code répétitif et difficile à maintenir
- ❌ Pas de type safety
- ❌ ESLint warnings

### Après
- ✅ 0 occurrence de `any`
- ✅ Code DRY avec helper réutilisable
- ✅ Type safety complet
- ✅ ESLint conforme
- ✅ Plus facile à comprendre et maintenir

## 🎓 Leçons Apprises

### Pattern 1: Helper Functions pour Accès Complexe
```typescript
// Au lieu de répéter (obj as any).prop partout
// Créer une fonction typée qui gère la logique

const getValue = <K extends keyof Type>(key: K): Type[K] | undefined => {
  return fallback1?.[key] || fallback2?.[key] || fallback3
}
```

### Pattern 2: Type Guards pour Unknown Data
```typescript
function isCompanyInfo(data: unknown): data is CompanyInfo {
  return (
    typeof data === 'object' &&
    data !== null &&
    ('name' in data || 'address' in data || 'siret' in data)
  )
}

// Usage
if (isCompanyInfo(unknownData)) {
  // unknownData est maintenant CompanyInfo
  console.log(unknownData.name)
}
```

### Pattern 3: Extraction de Variables
```typescript
// Au lieu de chaîner dans le JSX
{data?.nested?.value || fallback?.nested?.value}

// Extraire avant le render
const value = data?.nested?.value || fallback?.nested?.value
{value}
```

## 🔧 Application aux Autres Fichiers

Ce même pattern peut être appliqué à:
- `ProfessionalTypeSection.tsx` (6 occurrences)
- `DealerProfilePageClient.tsx` (4 occurrences)
- `DescriptionSection.tsx` (1 occurrence)
- Tous les autres fichiers avec `any`

**Template réutilisable:**
1. Identifier les structures de données utilisées
2. Créer des types TypeScript précis
3. Créer des helpers type-safe si logique complexe
4. Remplacer tous les `as any` par les types réels
5. Tester et valider avec `pnpm lint`

---

**🎯 Estimation: ~45 minutes pour corriger ce fichier complètement**
**📚 Référence: `.cursor/rules/typescript-strict-typing.mdc`**
