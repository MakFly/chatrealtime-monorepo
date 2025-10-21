import { Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const plans = [
  {
    name: 'Gratuit',
    price: '0€',
    description: 'Parfait pour commencer',
    popular: false,
    features: [
      'Jusqu\'à 10 membres d\'équipe',
      '100 messages par mois',
      'Fonctionnalités de chat de base',
      'Support par e-mail',
      '1 Go de stockage de fichiers',
      'Accès à la communauté'
    ]
  },
  {
    name: 'Pro',
    price: '12€',
    description: 'Pour les équipes en croissance',
    popular: true,
    features: [
      'Jusqu\'à 50 membres d\'équipe',
      'Messages illimités',
      'Fonctionnalités avancées',
      'Support prioritaire',
      '100 Go de stockage',
      'Intégrations personnalisées',
      'Analyses d\'équipe',
      'Appels vidéo'
    ]
  },
  {
    name: 'Entreprise',
    price: 'Sur mesure',
    description: 'Pour les grandes organisations',
    popular: false,
    features: [
      'Membres d\'équipe illimités',
      'Messages illimités',
      'Fonctionnalités entreprise',
      'Support dédié 24/7',
      'Stockage illimité',
      'Intégrations personnalisées',
      'Sécurité avancée',
      'Garantie SLA',
      'Déploiement sur site',
      'Formation personnalisée'
    ]
  }
]

export default function PricingPage() {
  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4" variant="outline">Tarifs</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
            Tarifs simples et transparents
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan qui correspond aux besoins de votre équipe. Tous les plans incluent un essai gratuit de 14 jours.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? 'border-primary shadow-lg' : ''}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium rounded-t-lg">
                  Le plus populaire
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Sur mesure' && (
                    <span className="text-muted-foreground">/mois</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="size-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <a href={plan.price === 'Sur mesure' ? '/contact' : '/register'}>
                    {plan.price === 'Sur mesure' ? 'Contacter les ventes' : 'Commencer'}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Puis-je changer de plan plus tard ?</h3>
              <p className="text-muted-foreground">
                Oui, vous pouvez améliorer ou réduire votre plan à tout moment. Les modifications
                seront reflétées dans votre prochain cycle de facturation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quels moyens de paiement acceptez-vous ?</h3>
              <p className="text-muted-foreground">
                Nous acceptons toutes les cartes de crédit majeures, PayPal et les virements
                bancaires pour les plans Entreprise.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Y a-t-il un essai gratuit ?</h3>
              <p className="text-muted-foreground">
                Oui, tous les plans payants incluent un essai gratuit de 14 jours. Aucune carte
                de crédit requise.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Puis-je annuler à tout moment ?</h3>
              <p className="text-muted-foreground">
                Absolument. Il n'y a pas de contrat à long terme. Vous pouvez annuler votre
                abonnement à tout moment depuis les paramètres de votre compte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
