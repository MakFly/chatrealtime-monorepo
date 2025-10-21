import { MessageCircle, Zap, Shield, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AboutPage() {
  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
            À propos de Chat Realtime
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une application de chat en temps réel moderne, construite avec les technologies
            de pointe pour offrir des expériences de communication fluides.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Notre Mission</h2>
          <p className="text-lg text-muted-foreground mb-4">
            Chat Realtime a été conçu pour fournir aux développeurs et aux équipes une
            plateforme de messagerie en temps réel robuste et évolutive. Nous croyons en
            la communication ouverte, la confidentialité et la fourniture d'expériences
            utilisateur exceptionnelles.
          </p>
          <p className="text-lg text-muted-foreground">
            Notre plateforme est alimentée par Next.js 15, React 19 et Symfony 7.3,
            garantissant une architecture moderne avec une fiabilité de niveau entreprise.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <Card>
            <CardHeader>
              <MessageCircle className="size-10 text-primary mb-2" />
              <CardTitle>Messagerie en temps réel</CardTitle>
              <CardDescription>
                Livraison instantanée des messages avec la technologie WebSocket pour des conversations fluides
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="size-10 text-primary mb-2" />
              <CardTitle>Ultra rapide</CardTitle>
              <CardDescription>
                Conçu pour la performance avec Next.js 15 et Turbopack pour un chargement instantané des pages
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="size-10 text-primary mb-2" />
              <CardTitle>Sécurisé par défaut</CardTitle>
              <CardDescription>
                Authentification JWT avec cookies HTTP-only et rafraîchissement automatique des tokens
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="size-10 text-primary mb-2" />
              <CardTitle>Collaboration d'équipe</CardTitle>
              <CardDescription>
                Créez des salons, gérez les permissions et collaborez efficacement avec votre équipe
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 className="text-3xl font-bold mb-6">Stack Technologique</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frontend</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Next.js 15 avec App Router</li>
                  <li>• React 19 Server Components</li>
                  <li>• TypeScript 5 (mode strict)</li>
                  <li>• Tailwind CSS 4</li>
                  <li>• Composants shadcn/ui</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Backend</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Symfony 7.3 API Platform</li>
                  <li>• PostgreSQL 15</li>
                  <li>• Authentification JWT</li>
                  <li>• Serveur FrankenPHP</li>
                  <li>• Conteneurisation Docker</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
