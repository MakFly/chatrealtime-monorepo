import { RoleBasedComponent } from '@/components/examples/role-based-component'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'

export default function ProfilePage() {
  return (
    <div className="container py-12 max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <Badge variant="outline" className="mb-2">
          <Shield className="size-3 mr-1" />
          Protected Route
        </Badge>
        <h1 className="text-4xl font-bold">Mon Profil</h1>
        <p className="text-muted-foreground">
          Cette page démontre le contrôle d&apos;accès basé sur les rôles (RBAC)
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="text-lg">💡 Comment ça fonctionne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            ✅ Les informations utilisateur viennent du{' '}
            <code className="bg-muted px-1 py-0.5 rounded">UserContext</code>
          </p>
          <p>
            ✅ L&apos;authentification est gérée par{' '}
            <code className="bg-muted px-1 py-0.5 rounded">AuthProvider</code>
          </p>
          <p>
            ✅ Les rôles sont vérifiés avec les hooks{' '}
            <code className="bg-muted px-1 py-0.5 rounded">useHasRole()</code> et{' '}
            <code className="bg-muted px-1 py-0.5 rounded">useHasAnyRole()</code>
          </p>
          <p>
            ✅ Le contenu s&apos;affiche dynamiquement selon vos permissions
          </p>
        </CardContent>
      </Card>

      {/* Role-Based Component Demo */}
      <RoleBasedComponent />

      {/* Technical Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📚 Architecture Technique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Flux de données :</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Server Component fetch user via <code className="text-xs bg-muted px-1 py-0.5 rounded">getCurrentUser()</code></li>
              <li>User injecté dans <code className="text-xs bg-muted px-1 py-0.5 rounded">AuthProvider</code> via <code className="text-xs bg-muted px-1 py-0.5 rounded">initialUser</code></li>
              <li>UserContext fournit les données partout</li>
              <li>Hooks <code className="text-xs bg-muted px-1 py-0.5 rounded">useUser()</code> et <code className="text-xs bg-muted px-1 py-0.5 rounded">useHasRole()</code> utilisables dans les Client Components</li>
            </ol>
          </div>

          <div>
            <p className="font-medium text-foreground mb-1">Rôles disponibles dans l&apos;API :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ROLE_USER</code> - Utilisateur standard</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ROLE_ADMIN</code> - Administrateur</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ROLE_MODERATOR</code> - Modérateur</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

