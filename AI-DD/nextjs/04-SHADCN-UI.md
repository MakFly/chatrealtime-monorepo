# Shadcn/UI + Tailwind CSS v4 - Guide complet 2025

## 🎯 Setup (Next.js 15 + Tailwind v4)

```bash
# Installation
npx create-next-app@latest --typescript --tailwind --app
npx shadcn@latest init
npx shadcn@latest add button card dialog select input form
```

**Tailwind v4 (inline theming, pas de config):**
```css
/* app/globals.css */
@import "tailwindcss";
@theme {
  --color-primary: #0066cc;
  --color-secondary: #64748b;
}
```

## 📦 Exemples concrets iAutos

### CarCard Component

```typescript
// features/cars/components/CarCard.tsx
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'
import type { Car } from '../types'

const cardVariants = cva(
  "transition-all hover:shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-card",
        featured: "border-2 border-primary bg-primary/5",
        compact: "p-2",
      },
      size: {
        default: "w-full",
        sm: "max-w-sm",
        lg: "max-w-lg",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    }
  }
)

type CarCardProps = {
  car: Car
  onSelect?: (car: Car) => void
} & VariantProps<typeof cardVariants>

export function CarCard({ car, variant, size, onSelect }: CarCardProps) {
  return (
    <Card className={cn(cardVariants({ variant, size }))}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg">
            {car.brand} {car.model}
          </h3>
          {car.featured && <Badge variant="default">Coup de ❤️</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{car.year}</p>
      </CardHeader>

      <CardContent>
        <img
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-48 object-cover rounded-md"
        />
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Kilométrage:</span>
            <span className="ml-2 font-medium">{car.mileage.toLocaleString()} km</span>
          </div>
          <div>
            <span className="text-muted-foreground">Carburant:</span>
            <span className="ml-2 font-medium">{car.fuelType}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="text-2xl font-bold text-primary">
          {car.price.toLocaleString('fr-FR')} €
        </div>
        <Button onClick={() => onSelect?.(car)}>
          Voir détails
        </Button>
      </CardFooter>
    </Card>
  )
}
```

### CarFilters avec Shadcn Components

```typescript
// features/cars/components/CarFilters.tsx
'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Slider } from '@/shared/components/ui/slider'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { useFiltersStore } from '../stores/filters-store'

export function CarFilters() {
  const { filters, setFilter, resetFilters } = useFiltersStore()

  return (
    <div className="space-y-6 p-4">
      {/* Brand Select */}
      <div className="space-y-2">
        <Label>Marque</Label>
        <Select
          value={filters.brand}
          onValueChange={(value) => setFilter('brand', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes les marques" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="peugeot">Peugeot</SelectItem>
            <SelectItem value="renault">Renault</SelectItem>
            <SelectItem value="citroen">Citroën</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-2">
        <Label>Prix maximum: {filters.maxPrice.toLocaleString()} €</Label>
        <Slider
          value={[filters.maxPrice]}
          onValueChange={([value]) => setFilter('maxPrice', value)}
          max={100000}
          step={1000}
          className="w-full"
        />
      </div>

      {/* Fuel Type Checkboxes */}
      <div className="space-y-2">
        <Label>Carburant</Label>
        <div className="space-y-2">
          {['Essence', 'Diesel', 'Électrique', 'Hybride'].map((fuel) => (
            <div key={fuel} className="flex items-center space-x-2">
              <Checkbox
                id={fuel}
                checked={filters.fuelTypes.includes(fuel)}
                onCheckedChange={(checked) => {
                  const newFuels = checked
                    ? [...filters.fuelTypes, fuel]
                    : filters.fuelTypes.filter(f => f !== fuel)
                  setFilter('fuelTypes', newFuels)
                }}
              />
              <Label htmlFor={fuel} className="cursor-pointer">{fuel}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={resetFilters} variant="outline" className="flex-1">
          Réinitialiser
        </Button>
        <Button className="flex-1">
          Appliquer
        </Button>
      </div>
    </div>
  )
}
```

### Modal avec Dialog (Intercepting Route)

```typescript
// app/(catalog)/acheter/(..)vehicle/[id]/page.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { CarDetails } from '@/features/cars'
import { useRouter } from 'next/navigation'

export default function VehicleModal({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du véhicule</DialogTitle>
        </DialogHeader>
        <CarDetails id={params.id} />
      </DialogContent>
    </Dialog>
  )
}
```

### Form Components avec Error States

```typescript
// features/cars/components/CreateCarForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Button } from '@/shared/components/ui/button'
import { carSchema } from '../lib/validations'

export function CreateCarForm() {
  const form = useForm({
    resolver: zodResolver(carSchema),
    defaultValues: {
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: 0,
      description: '',
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Brand */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marque *</FormLabel>
              <FormControl>
                <Input placeholder="Peugeot" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Model */}
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modèle *</FormLabel>
              <FormControl>
                <Input placeholder="308" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Décrivez votre véhicule..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Création...' : 'Créer l\'annonce'}
        </Button>
      </form>
    </Form>
  )
}
```

### Toast Notifications avec Sonner

```typescript
// features/cars/components/CarActions.tsx
'use client'

import { toast } from 'sonner'
import { Button } from '@/shared/components/ui/button'
import { createCarAction } from '../lib/actions'

export function CarActions() {
  const handleCreate = async () => {
    try {
      const result = await createCarAction(data)

      if (result.success) {
        toast.success('Annonce créée!', {
          description: 'Votre véhicule est maintenant en ligne',
          action: {
            label: 'Voir',
            onClick: () => router.push(`/vehicle/${result.data.id}`)
          }
        })
      } else {
        toast.error('Erreur', {
          description: result.error
        })
      }
    } catch (error) {
      toast.error('Erreur inattendue')
    }
  }

  return <Button onClick={handleCreate}>Créer</Button>
}

// app/layout.tsx - Setup Toaster
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
```

## 🎨 Best Practices 2025

### Component Organization
```
features/cars/components/
├── CarCard/
│   ├── index.tsx          # Main component
│   ├── CarCardSkeleton.tsx
│   └── types.ts
└── index.ts               # Barrel export
```

### Variants with CVA
```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", destructive: "..." },
      size: { default: "...", sm: "...", lg: "..." }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
)
```

### Responsive Design
```typescript
<Card className="w-full md:w-1/2 lg:w-1/3">
  <CardContent className="p-4 md:p-6">
    {/* Mobile-first approach */}
  </CardContent>
</Card>
```

### Dark Mode Support
```typescript
// Automatic with Tailwind v4
<div className="bg-background text-foreground">
  <Card className="bg-card"> {/* Adapts to theme */}
</div>
```

## 📋 Components Checklist

Recommended Shadcn components for iAutos:
- [x] button, card, badge - UI basics
- [x] dialog, sheet - Modals
- [x] select, input, textarea, checkbox - Forms
- [x] form - React Hook Form integration
- [x] toast (sonner) - Notifications
- [ ] table - Data display
- [ ] tabs - Navigation
- [ ] dropdown-menu - Actions
- [ ] avatar - User/Dealer profiles
- [ ] calendar - Date selection
- [ ] slider - Range inputs

## 🔗 Resources

- [Shadcn/UI Docs](https://ui.shadcn.com)
- [Tailwind v4](https://tailwindcss.com)
- [Radix UI](https://radix-ui.com)
- [CVA](https://cva.style/docs)
