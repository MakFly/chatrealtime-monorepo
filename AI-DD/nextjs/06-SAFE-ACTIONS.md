# next-safe-action - Server Actions Type-Safe 2025

## 🎯 Setup

```bash
pnpm add next-safe-action zod zod-form-data
```

```typescript
// shared/lib/safe-action.ts
import { createSafeActionClient } from 'next-safe-action'
import { cookies } from 'next/headers'

export const actionClient = createSafeActionClient()

// With auth middleware
export const authActionClient = actionClient.use(async ({ next }) => {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    throw new Error('Non authentifié')
  }

  // Verify token and get user
  const user = await verifyToken(token)

  return next({ ctx: { user } })
})
```

## 📦 Exemples iAutos

### Create Car Action

```typescript
// features/cars/lib/actions.ts
'use server'

import { z } from 'zod'
import { authActionClient } from '@/shared/lib/safe-action'
import { revalidatePath } from 'next/cache'

const createCarSchema = z.object({
  brand: z.string().min(2, 'Marque requise'),
  model: z.string().min(1, 'Modèle requis'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  price: z.number().min(0, 'Prix doit être positif'),
  mileage: z.number().min(0),
  fuelType: z.enum(['Essence', 'Diesel', 'Électrique', 'Hybride']),
  description: z.string().optional(),
})

export const createCarAction = authActionClient
  .schema(createCarSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx

    // Create car in database
    const car = await db.car.create({
      data: {
        ...parsedInput,
        userId: user.id,
      },
    })

    // Revalidate catalog page
    revalidatePath('/acheter')

    return { success: true, car }
  })

// Client usage
'use client'
import { useAction } from 'next-safe-action/hooks'
import { createCarAction } from '../lib/actions'

export function CreateCarForm() {
  const { execute, status, result } = useAction(createCarAction, {
    onSuccess: ({ data }) => {
      toast.success('Annonce créée!', {
        description: `${data.car.brand} ${data.car.model}`,
      })
      router.push(`/vehicle/${data.car.id}`)
    },
    onError: ({ error }) => {
      toast.error('Erreur', {
        description: error.serverError || 'Une erreur est survenue',
      })
    },
  })

  const handleSubmit = (formData: FormData) => {
    execute({
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      // ... autres champs
    })
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={status === 'executing'}>
        {status === 'executing' ? 'Création...' : 'Créer l\'annonce'}
      </Button>
    </form>
  )
}
```

### FormData Action

```typescript
// features/auth/lib/actions.ts
'use server'

import { z } from 'zod'
import { zfd } from 'zod-form-data' // zod-form-data helper
import { actionClient } from '@/shared/lib/safe-action'

const loginSchema = zfd.formData({
  email: zfd.text(z.string().email('Email invalide')),
  password: zfd.text(z.string().min(8, 'Min 8 caractères')),
  remember: zfd.checkbox({ trueValue: 'on' }),
})

export const loginAction = actionClient
  .schema(loginSchema)
  .action(async ({ parsedInput }) => {
    const { email, password, remember } = parsedInput

    // Authenticate user
    const user = await authenticate(email, password)

    if (!user) {
      throw new Error('Email ou mot de passe incorrect')
    }

    // Create session
    const token = await createSession(user, remember)

    // Set httpOnly cookie
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
    })

    return { success: true, user }
  })

// Client - Direct form action
<form action={loginAction}>
  <input type="email" name="email" required />
  <input type="password" name="password" required />
  <input type="checkbox" name="remember" value="on" />
  <button type="submit">Se connecter</button>
</form>
```

### Optimistic Updates

```typescript
'use client'
import { useOptimisticAction } from 'next-safe-action/hooks'

export function ToggleFavoriteButton({ carId }: { carId: string }) {
  const { execute, optimisticState } = useOptimisticAction(
    toggleFavoriteAction,
    {
      currentState: { isFavorite: false },
      updateFn: (state) => ({
        isFavorite: !state.isFavorite,
      }),
    }
  )

  return (
    <Button
      onClick={() => execute({ carId })}
      variant={optimisticState.isFavorite ? 'default' : 'outline'}
    >
      {optimisticState.isFavorite ? '❤️ Favori' : '🤍 Ajouter aux favoris'}
    </Button>
  )
}
```

### Multiple Actions Composition

```typescript
// features/cars/lib/actions.ts
'use server'

// Upload images
const uploadImagesSchema = z.object({
  carId: z.string(),
  images: z.array(z.instanceof(File)),
})

export const uploadCarImagesAction = authActionClient
  .schema(uploadImagesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { carId, images } = parsedInput
    const uploadedUrls = await uploadToMinIO(images)

    await db.car.update({
      where: { id: carId },
      data: {
        images: uploadedUrls,
      },
    })

    return { success: true, urls: uploadedUrls }
  })

// Publish car
export const publishCarAction = authActionClient
  .schema(z.object({ carId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const { carId } = parsedInput

    const car = await db.car.update({
      where: { id: carId },
      data: { status: 'published', publishedAt: new Date() },
    })

    revalidatePath(`/vehicle/${carId}`)
    return { success: true, car }
  })

// Composé - Create + Upload + Publish
export const createCompleteCarAction = authActionClient
  .schema(z.object({
    car: createCarSchema,
    images: z.array(z.instanceof(File)),
  }))
  .action(async ({ parsedInput, ctx }) => {
    // 1. Create car
    const { car: createdCar } = await createCarAction.execute({
      ...parsedInput.car,
    })

    // 2. Upload images
    await uploadCarImagesAction.execute({
      carId: createdCar.id,
      images: parsedInput.images,
    })

    // 3. Publish
    const { car: publishedCar } = await publishCarAction.execute({
      carId: createdCar.id,
    })

    return { success: true, car: publishedCar }
  })
```

### Error Handling Patterns

```typescript
'use client'

export function CreateCarForm() {
  const { execute, status, result } = useAction(createCarAction, {
    onError: ({ error }) => {
      // Validation errors
      if (error.validationErrors) {
        const { brand, model, price } = error.validationErrors
        if (brand) setError('brand', { message: brand[0] })
        if (model) setError('model', { message: model[0] })
        if (price) setError('price', { message: price[0] })
      }

      // Server errors
      if (error.serverError) {
        toast.error('Erreur serveur', {
          description: error.serverError,
        })
      }
    },
  })
}
```

## 🎯 Best Practices 2025

### Middleware Chain
```typescript
// Auth + Rate Limiting
export const protectedActionClient = actionClient
  .use(authMiddleware)
  .use(rateLimitMiddleware)
  .use(loggingMiddleware)

const rateLimitMiddleware = async ({ next, clientInput }) => {
  const ip = headers().get('x-forwarded-for')
  const allowed = await checkRateLimit(ip)

  if (!allowed) {
    throw new Error('Trop de requêtes')
  }

  return next()
}
```

### Type-Safe Responses
```typescript
const action = actionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    return {
      success: true as const,
      data: { id: '123', name: 'Test' },
    }
  })

// Client knows exact type
const { data } = result
data?.data.id // string
data?.data.name // string
```

### Revalidation Strategy
```typescript
export const updateCarAction = authActionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    const car = await updateCar(parsedInput)

    // Revalidate multiple paths
    revalidatePath('/acheter') // Catalog
    revalidatePath(`/vehicle/${car.id}`) // Details
    revalidatePath('/account/private/listings') // My listings

    // Or use tags
    revalidateTag('cars')

    return { success: true, car }
  })
```

## 🔗 Resources

- [next-safe-action Docs](https://next-safe-action.dev)
- [Zod](https://zod.dev)
- [zod-form-data](https://www.npmjs.com/package/zod-form-data)
