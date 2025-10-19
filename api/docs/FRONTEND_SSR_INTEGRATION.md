# 🎨 Frontend SSR Integration - Guide Complet

## 📋 Vue d'Ensemble

Ce guide explique comment intégrer proprement l'authentification JWT dans une application frontend moderne (Next.js, Nuxt, SvelteKit) avec SSR.

---

## 🔐 Approche Recommandée : JWT Minimal + API /me

### Principe

1. **JWT contient uniquement :** `sub` (user ID), `email`, claims standards
2. **Rôles et profil récupérés :** Via endpoint `/api/v1/user/me`
3. **Stockage :** Dans un store côté client (Zustand, Pinia, Redux)
4. **SSR :** Récupération des données au moment du rendu initial

### Avantages

✅ **Sécurité**
- Rôles peuvent changer en temps réel
- Token reste petit et rapide
- Pas de données sensibles dans le JWT

✅ **Flexibilité**
- Permissions mises à jour instantanément
- Facile d'ajouter des champs au profil
- Pas besoin de re-générer le token

✅ **Performance**
- JWT minimal = headers HTTP légers
- Cache côté frontend des données utilisateur
- Une seule requête au chargement initial

---

## 🚀 Implémentation par Framework

### Next.js 14+ (App Router)

#### 1. Structure du Projet

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx          # Layout protégé
│   └── page.tsx
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts
└── providers.tsx

lib/
├── auth.ts                 # Config auth
├── api-client.ts           # Client API
└── stores/
    └── user-store.ts       # Store Zustand

middleware.ts               # Protection des routes
```

#### 2. Client API

**`lib/api-client.ts`**

```typescript
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost';

// Client pour Server Components (SSR)
export async function apiServerClient(endpoint: string, options?: RequestInit) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options?.headers,
    },
  });
}

// Client pour Client Components
export async function apiClient(endpoint: string, options?: RequestInit) {
  const accessToken = localStorage.getItem('access_token');

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options?.headers,
    },
  });
}
```

#### 3. Store Utilisateur (Zustand)

**`lib/stores/user-store.ts`**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  roles: string[];
  has_google_account: boolean;
  has_password: boolean;
}

interface UserStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, error: null }),

      clearUser: () => set({ user: null, error: null }),

      fetchUser: async () => {
        set({ isLoading: true, error: null });

        try {
          const accessToken = localStorage.getItem('access_token');

          if (!accessToken) {
            throw new Error('No access token');
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user');
          }

          const user = await response.json();
          set({ user, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            isLoading: false,
            user: null,
          });
        }
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.roles.includes(role) ?? false;
      },
    }),
    {
      name: 'user-storage',
      // Sauvegarder uniquement le user, pas les états de chargement
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

#### 4. Actions d'Authentification

**`lib/auth.ts`**

```typescript
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
  };
}

export async function login(credentials: LoginCredentials) {
  const response = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data: AuthResponse = await response.json();

  // ✅ Stocker les tokens dans httpOnly cookies (SSR)
  cookies().set('access_token', data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: data.expires_in,
  });

  cookies().set('refresh_token', data.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  });

  return data;
}

export async function logout() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;
  const accessToken = cookieStore.get('access_token')?.value;

  if (refreshToken) {
    // Appeler l'API logout
    await fetch(`${process.env.API_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        access_token: accessToken, // Pour blacklisting
      }),
    });
  }

  // Supprimer les cookies
  cookies().delete('access_token');
  cookies().delete('refresh_token');

  redirect('/login');
}

export async function getUser() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/v1/user/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Important pour SSR
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}
```

#### 5. Middleware de Protection

**`middleware.ts`**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/profile', '/admin'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Rediriger vers login si route protégée sans token
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !accessToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Rediriger vers dashboard si authentifié et sur page auth
  if (authRoutes.some(route => pathname.startsWith(route)) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

#### 6. Layout Protégé avec SSR

**`app/(dashboard)/layout.tsx`**

```typescript
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { UserProvider } from '@/providers/user-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ SSR: Récupérer l'utilisateur côté serveur
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <UserProvider initialUser={user}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-lg font-semibold">
                  {user.name || user.email}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {user.roles.join(', ')}
                </span>
                <form action="/api/auth/logout" method="POST">
                  <button className="btn-secondary">Déconnexion</button>
                </form>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    </UserProvider>
  );
}
```

#### 7. Provider Utilisateur (Hydratation Client)

**`providers/user-provider.tsx`**

```typescript
'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/lib/stores/user-store';

interface UserProviderProps {
  initialUser: any;
  children: React.ReactNode;
}

export function UserProvider({ initialUser, children }: UserProviderProps) {
  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    // ✅ Hydrater le store client avec les données SSR
    if (initialUser) {
      setUser(initialUser);

      // Stocker aussi l'access token côté client pour les requêtes API
      // Note: Token récupéré depuis le cookie httpOnly via une route API
    }
  }, [initialUser, setUser]);

  return <>{children}</>;
}
```

#### 8. Hook de Protection de Route

**`hooks/use-require-auth.ts`**

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/user-store';

export function useRequireAuth(requiredRole?: string) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const hasRole = useUserStore((state) => state.hasRole);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
    }
  }, [user, requiredRole, hasRole, router]);

  return { user, isAuthorized: requiredRole ? hasRole(requiredRole) : !!user };
}
```

---

### Nuxt 3

#### 1. Configuration

**`nuxt.config.ts`**

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    apiUrl: process.env.API_URL || 'https://localhost',
    public: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://localhost',
    },
  },

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
});
```

#### 2. Plugin Auth

**`plugins/auth.client.ts`**

```typescript
export default defineNuxtPlugin(async () => {
  const userStore = useUserStore();
  const accessToken = useCookie('access_token');

  // ✅ Récupérer l'utilisateur au chargement
  if (accessToken.value && !userStore.user) {
    await userStore.fetchUser();
  }
});
```

#### 3. Store Pinia

**`stores/user.ts`**

```typescript
import { defineStore } from 'pinia';

interface User {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    hasRole: (state) => (role: string) => state.user?.roles.includes(role) ?? false,
  },

  actions: {
    async fetchUser() {
      this.isLoading = true;

      try {
        const config = useRuntimeConfig();
        const accessToken = useCookie('access_token');

        const data = await $fetch(`${config.public.apiUrl}/api/v1/user/me`, {
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
          },
        });

        this.user = data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        this.user = null;
      } finally {
        this.isLoading = false;
      }
    },

    async login(credentials: { email: string; password: string }) {
      const config = useRuntimeConfig();

      const data = await $fetch(`${config.public.apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        body: credentials,
      });

      // Stocker les tokens
      const accessToken = useCookie('access_token', {
        maxAge: data.expires_in,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      const refreshToken = useCookie('refresh_token', {
        maxAge: 7 * 24 * 60 * 60,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      accessToken.value = data.access_token;
      refreshToken.value = data.refresh_token;

      // Récupérer les infos complètes
      await this.fetchUser();

      return data;
    },

    async logout() {
      const config = useRuntimeConfig();
      const refreshToken = useCookie('refresh_token');
      const accessToken = useCookie('access_token');

      try {
        await $fetch(`${config.public.apiUrl}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.value}`,
          },
          body: {
            refresh_token: refreshToken.value,
            access_token: accessToken.value,
          },
        });
      } finally {
        // Nettoyer même en cas d'erreur
        accessToken.value = null;
        refreshToken.value = null;
        this.user = null;

        await navigateTo('/login');
      }
    },
  },
});
```

#### 4. Middleware

**`middleware/auth.ts`**

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const userStore = useUserStore();
  const accessToken = useCookie('access_token');

  // Routes publiques
  const publicRoutes = ['/login', '/register'];
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Vérifier le token
  if (!accessToken.value) {
    return navigateTo('/login');
  }

  // Charger l'utilisateur si pas encore fait
  if (!userStore.user && !userStore.isLoading) {
    await userStore.fetchUser();
  }

  // Vérifier si l'utilisateur existe après fetch
  if (!userStore.user) {
    return navigateTo('/login');
  }
});
```

---

## 🎯 Flow Complet

### 1. Connexion

```
Frontend                    Backend API
   |                            |
   |--- POST /auth/login ------>|
   |    { email, password }     |
   |                            |
   |<--- 200 OK ----------------|
   |    {                       |
   |      access_token,         |
   |      refresh_token,        |
   |      user: {...}           |  ← Infos basiques seulement
   |    }                       |
   |                            |
   |--- GET /user/me ---------->|
   |    Authorization: Bearer   |
   |                            |
   |<--- 200 OK ----------------|
   |    {                       |
   |      id, email, name,      |
   |      roles: [...],         |  ← Rôles complets
   |      permissions: [...]    |
   |    }                       |
   |                            |
   [Store les données dans     |
    Zustand/Pinia/Redux]       |
```

### 2. SSR (Chargement Page)

```
Browser                   Next.js SSR                Backend
   |                          |                          |
   |--- GET /dashboard ------>|                          |
   |                          |                          |
   |                          |--- GET /user/me -------->|
   |                          |    Cookie: access_token  |
   |                          |                          |
   |                          |<--- User data -----------|
   |                          |                          |
   |<--- HTML with data ------|                          |
   |    (SSR rendered)        |                          |
   |                          |                          |
   [Hydrate client store]    |                          |
```

### 3. Navigation Client

```
Frontend Store              Backend API
   |                            |
   [User data in memory]       |
   |                            |
   [Check roles locally]       |
   |                            |
   |--- Protected API call---->|
   |    Authorization: Bearer   |
   |                            |
   |<--- Response --------------|
```

---

## ✅ Checklist d'Implémentation

### Backend (Déjà Fait ✅)

- [x] JWT sans rôles (Event Listeners créés)
- [x] Endpoint `/api/v1/user/me`
- [x] Refresh token rotation
- [x] Token blacklisting

### Frontend (À Faire)

- [ ] Installer store (Zustand/Pinia)
- [ ] Créer `apiClient` helpers
- [ ] Créer actions auth (login, logout)
- [ ] Créer middleware protection routes
- [ ] Implémenter SSR data fetching
- [ ] Hydrater store client avec données SSR

---

## 🎁 Bonus: Auto-refresh Token

**`lib/api-client.ts` (amélioré)**

```typescript
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem('refresh_token');

    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    // ✅ IMPORTANT: Sauvegarder le NOUVEAU refresh token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    refreshSubscribers.forEach(cb => cb(data.access_token));
    refreshSubscribers = [];

    return data.access_token;
  } finally {
    isRefreshing = false;
  }
}

export async function apiClient(endpoint: string, options?: RequestInit) {
  let accessToken = localStorage.getItem('access_token');

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options?.headers,
    },
  });

  // ✅ Auto-refresh si 401
  if (response.status === 401) {
    accessToken = await refreshAccessToken();

    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...options?.headers,
      },
    });
  }

  return response;
}
```

---

**Tout est prêt côté backend ! 🎉**

Voulez-vous que je crée aussi un exemple complet pour un framework spécifique (Next.js, Nuxt, SvelteKit) ?
