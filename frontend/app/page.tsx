import { MessageCircle, Shield, Zap, Users, Lock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Chat Realtime</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Next.js 15 + Symfony 7.3 + Real-time Chat
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Chat Real Time Exemple
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Application de chat en temps réel avec authentification sécurisée,
            gestion des tokens de rafraîchissement et architecture moderne.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/login">Essayer la démo</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="#features">En savoir plus</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Real-time Chat */}
            <Card className="text-center">
              <CardHeader>
                <MessageCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Chat en Temps Réel</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Communication instantanée avec WebSocket.
                  Messages échangés en temps réel entre utilisateurs.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Authentication */}
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Authentification Sécurisée</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Système d&apos;authentification JWT robuste avec
                  gestion des sessions et protection des routes.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Refresh Token */}
            <Card className="text-center">
              <CardHeader>
                <RefreshCw className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Tokens de Rafraîchissement</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Gestion automatique du rafraîchissement des tokens
                  pour maintenir les sessions utilisateur actives.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Modern Stack */}
            <Card className="text-center">
              <CardHeader>
                <Zap className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Stack Moderne</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Next.js 15, React 19, Symfony 7.3, TypeScript,
                  Tailwind CSS et shadcn/ui.
                </CardDescription>
              </CardContent>
            </Card>

            {/* User Management */}
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Gestion Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Système complet de gestion des utilisateurs avec
                  profils, rôles et permissions.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="text-center">
              <CardHeader>
                <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Sécurité Renforcée</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Protection CSRF, validation des entrées,
                  sanitisation et sécurisation des données.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technical Details */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Détails Techniques</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Frontend (Next.js 15)</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• App Router avec Server Components</li>
                <li>• Middleware d&apos;authentification</li>
                <li>• Gestion des cookies sécurisés</li>
                <li>• Interface moderne avec shadcn/ui</li>
                <li>• TypeScript strict</li>
                <li>• Tailwind CSS 4</li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-6">Backend (Symfony 7.3)</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• API Platform REST</li>
                <li>• Authentification JWT (Lexik)</li>
                <li>• Google OAuth integration</li>
                <li>• Test-Driven Development</li>
                <li>• Architecture DDD</li>
                <li>• Sécurité renforcée</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Prêt à commencer ?</h2>
          <p className="text-xl mb-8 opacity-90">
            Découvrez une application de chat moderne avec les meilleures pratiques de développement.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
            <Link href="/login">Accéder à l&apos;application</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Chat Realtime. Built with Next.js 15 & Symfony 7.3</p>
        </div>
      </footer>
    </div>
  )
}
