'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Zap } from 'lucide-react'

export default function DevLoginPage() {
  const [email, setEmail] = useState('user@test.com')
  const [password, setPassword] = useState('password123')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/dev/quick-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)

      // Redirect to home page after 1 second with full page reload
      // Full reload ensures Server Components fetch user and hydrate Context
      // Token expiration sera lu depuis la métadonnée de cookie par AuthProvider
      setTimeout(() => {
        window.location.href = '/'
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              This page is only available in development mode.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-12 space-y-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Badge variant="outline" className="mb-4">
            <Zap className="size-3 mr-1" />
            Development Only
          </Badge>
          <h1 className="text-3xl font-bold mb-2">Quick Login for Testing</h1>
          <p className="text-muted-foreground">
            Login with 20-second access token expiration to test automatic refresh
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Login</CardTitle>
            <CardDescription>
              Les identifiants sont pré-remplis. Le access_token expirera dans 20 secondes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive rounded-md mb-4">
                    <AlertCircle className="size-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Échec de connexion</p>
                      <p className="text-sm text-destructive/90">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500 rounded-md mb-4">
                    <Zap className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600">Succès !</p>
                      <p className="text-sm text-green-600/90">
                        Connexion réussie. Redirection vers la page d'accueil...
                      </p>
                    </div>
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@example.com"
                    required
                    disabled={isLoading || success}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    disabled={isLoading || success}
                  />
                </Field>

                <Field>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || success}
                  >
                    {isLoading ? 'Connexion...' : success ? 'Redirection...' : 'Quick Login (token 20s)'}
                  </Button>
                </Field>
              </FieldGroup>
            </form>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Comment ça fonctionne :</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Credentials : <code className="text-xs bg-background px-1 py-0.5 rounded">user@example.com / password123</code></li>
                <li>• Connexion via l'API Symfony</li>
                <li>• Cookie access_token avec expiration de 20 secondes</li>
                <li>• Refresh token reste à 7 jours</li>
                <li>• Parfait pour tester le rafraîchissement automatique</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-lg">Instructions de test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Cliquez sur "Quick Login" (identifiants pré-remplis)</p>
            <p>2. Observez le compte à rebours du composant AuthDebug en temps réel</p>
            <p>3. Naviguez vers différentes routes après connexion (À propos, Fonctionnalités, etc.)</p>
            <p>4. Quand l'access_token expire (20s), l'app devrait le rafraîchir automatiquement</p>
            <p>5. Vérifiez la console navigateur pour les logs de rafraîchissement</p>
            <p className="font-semibold text-blue-600 pt-2">
              💡 Astuce : Ouvrez DevTools → Onglet Network pour voir la requête de rafraîchissement automatique
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
