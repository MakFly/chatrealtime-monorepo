import { Check, MessageSquare, Lock, Zap, Users, Bell, Search, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: MessageSquare,
    title: 'Messagerie en temps réel',
    description: 'Envoyez et recevez des messages instantanément avec la technologie WebSocket',
    features: [
      'Livraison instantanée des messages',
      'Indicateurs de frappe',
      'Accusés de réception',
      'Historique des messages'
    ]
  },
  {
    icon: Lock,
    title: 'Sécurité de niveau entreprise',
    description: 'Sécurité de niveau bancaire avec authentification JWT et chiffrement',
    features: [
      'Cookies HTTP-only',
      'Rafraîchissement automatique des tokens',
      'Contrôle d\'accès basé sur les rôles',
      'Intégration Google OAuth'
    ]
  },
  {
    icon: Zap,
    title: 'Performance éclair',
    description: 'Optimisé pour la vitesse avec une architecture moderne',
    features: [
      'Rendu côté serveur',
      'Fractionnement automatique du code',
      'Optimisation des images',
      'Mise en cache Edge'
    ]
  },
  {
    icon: Users,
    title: 'Collaboration d\'équipe',
    description: 'Travaillez ensemble efficacement avec de puissantes fonctionnalités d\'équipe',
    features: [
      'Salons privés et publics',
      'Mentions d\'utilisateurs',
      'Partage de fichiers',
      'Gestion d\'équipe'
    ]
  },
  {
    icon: Bell,
    title: 'Notifications intelligentes',
    description: 'Restez informé sans être submergé',
    features: [
      'Notifications de bureau',
      'Résumés par e-mail',
      'Règles de notification personnalisées',
      'Mode Ne pas déranger'
    ]
  },
  {
    icon: Search,
    title: 'Recherche puissante',
    description: 'Trouvez n\'importe quoi instantanément avec une recherche avancée',
    features: [
      'Recherche plein texte',
      'Filtrer par date/utilisateur',
      'Recherche dans les salons',
      'Recherches sauvegardées'
    ]
  },
  {
    icon: Smartphone,
    title: 'Compatible mobile',
    description: 'Design entièrement responsive qui fonctionne sur tous les appareils',
    features: [
      'Progressive Web App',
      'Optimisé pour le tactile',
      'Support hors ligne',
      'Expérience native'
    ]
  }
]

export default function FeaturesPage() {
  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">Fonctionnalités</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
            Tout ce dont vous avez besoin pour
            <br />
            la communication en temps réel
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Des fonctionnalités puissantes construites avec une technologie moderne pour
            améliorer la productivité et la collaboration de votre équipe.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="relative">
                <CardHeader>
                  <Icon className="size-10 text-primary mb-2" />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.features.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="size-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
          <p className="text-muted-foreground mb-6">
            Créez votre compte aujourd'hui et commencez à discuter en quelques minutes.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              S'inscrire gratuitement
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Voir les tarifs
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
