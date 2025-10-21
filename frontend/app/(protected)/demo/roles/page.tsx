import { RoleBasedComponent } from '@/components/examples/role-based-component'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Users, Lock, Eye } from 'lucide-react'

export default function RolesDemoPage() {
  return (
    <div className="container py-12 max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-2 mb-4">
          <Badge variant="default">
            <Shield className="size-3 mr-1" />
            RBAC Demo
          </Badge>
          <Badge variant="outline">Protected Route</Badge>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Démo Contrôle d'Accès par Rôles
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Démonstration complète du système RBAC (Role-Based Access Control) avec React Context et hooks personnalisés
        </p>
      </div>

      {/* What You'll See */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="size-5" />
            Ce que vous allez voir
          </CardTitle>
          <CardDescription>
            Le contenu ci-dessous change dynamiquement selon vos rôles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-green-600" />
                <p className="font-medium">Tous les utilisateurs</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Informations de base visibles par tous
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-yellow-600" />
                <p className="font-medium">Admin / Modérateur</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Outils de modération (nécessite ROLE_ADMIN ou ROLE_MODERATOR)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-red-600" />
                <p className="font-medium">Admin uniquement</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Panneau d'administration (nécessite ROLE_ADMIN)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Demo */}
      <RoleBasedComponent />

      {/* Technical Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🎯 Hooks Utilisés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                const user = useUser()
              </code>
              <p className="text-muted-foreground mt-1">
                Récupère toutes les données utilisateur (id, name, email, roles)
              </p>
            </div>

            <div>
              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                const isAdmin = useHasRole('ROLE_ADMIN')
              </code>
              <p className="text-muted-foreground mt-1">
                Vérifie si l'utilisateur a un rôle spécifique
              </p>
            </div>

            <div>
              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                const canModerate = useHasAnyRole(['ROLE_ADMIN', 'ROLE_MODERATOR'])
              </code>
              <p className="text-muted-foreground mt-1">
                Vérifie si l'utilisateur a au moins un des rôles
              </p>
            </div>

            <div>
              <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                const isSuperAdmin = useHasAllRoles(['ROLE_ADMIN', 'ROLE_SUPER_USER'])
              </code>
              <p className="text-muted-foreground mt-1">
                Vérifie si l'utilisateur a tous les rôles spécifiés
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏗️ Architecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium mb-1">Server Components</p>
              <p className="text-muted-foreground">
                Récupèrent les données utilisateur via <code className="text-xs bg-muted px-1 py-0.5 rounded">getCurrentUser()</code> qui appelle <code className="text-xs bg-muted px-1 py-0.5 rounded">/api/v1/user/me</code>
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">AuthProvider</p>
              <p className="text-muted-foreground">
                Fournit le <code className="text-xs bg-muted px-1 py-0.5 rounded">UserContext</code> avec les données utilisateur à toute l'application
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">Client Components</p>
              <p className="text-muted-foreground">
                Utilisent les hooks <code className="text-xs bg-muted px-1 py-0.5 rounded">useUser()</code> et <code className="text-xs bg-muted px-1 py-0.5 rounded">useHasRole()</code> pour afficher du contenu conditionnel
              </p>
            </div>

            <div>
              <p className="font-medium mb-1">Zustand Store</p>
              <p className="text-muted-foreground">
                Store minimal avec juste <code className="text-xs bg-muted px-1 py-0.5 rounded">isAuthenticated</code> pour la navbar
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Code Example */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-lg">💻 Exemple de Code</CardTitle>
          <CardDescription>
            Comment utiliser le RBAC dans vos composants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            <code>{`'use client'

import { useUser, useHasRole } from '@/lib/contexts/user-context'
import { Button } from '@/components/ui/button'

export function MyComponent() {
  const user = useUser()
  const isAdmin = useHasRole('ROLE_ADMIN')

  if (!user) {
    return <p>Veuillez vous connecter</p>
  }

  return (
    <div>
      <h1>Bonjour, {user.name || user.email}!</h1>
      
      {isAdmin && (
        <Button variant="destructive">
          Action Admin Seulement
        </Button>
      )}
    </div>
  )
}`}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Test Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🧪 Comment Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">1. Avec votre compte actuel</p>
            <p className="text-muted-foreground">
              Vous voyez le contenu selon vos rôles actuels (affichés ci-dessus)
            </p>
          </div>

          <div>
            <p className="font-medium mb-2">2. Modifier les rôles dans la BDD</p>
            <p className="text-muted-foreground">
              Connectez-vous à PostgreSQL et modifiez le champ <code className="text-xs bg-muted px-1 py-0.5 rounded">roles</code> de votre utilisateur pour tester différents scénarios
            </p>
          </div>

          <div>
            <p className="font-medium mb-2">3. Créer différents utilisateurs</p>
            <p className="text-muted-foreground">
              Créez plusieurs comptes avec différents rôles et testez en vous connectant avec chacun
            </p>
          </div>

          <div className="pt-4 border-t">
            <p className="font-medium text-blue-600">💡 Astuce</p>
            <p className="text-muted-foreground mt-1">
              Ouvrez le composant <code className="text-xs bg-muted px-1 py-0.5 rounded">AuthDebugButton</code> (coin inférieur droit) pour voir vos rôles en temps réel
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

