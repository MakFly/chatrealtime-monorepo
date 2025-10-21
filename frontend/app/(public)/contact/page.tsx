import { Mail, MapPin, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
            Contactez-nous
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Vous avez des questions ? Nous serions ravis de vous entendre. Envoyez-nous un
            message et nous vous répondrons dès que possible.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
              <CardDescription>
                Remplissez le formulaire ci-dessous et nous vous répondrons dans les 24 heures.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Nom</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Jean Dupont"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jean@exemple.com"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="subject">Sujet</FieldLabel>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Comment pouvons-nous vous aider ?"
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="message">Message</FieldLabel>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Parlez-nous de votre question..."
                      required
                    />
                  </Field>

                  <Field>
                    <Button type="submit" className="w-full">
                      Envoyer le message
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Mail className="size-10 text-primary mb-2" />
                <CardTitle>E-mail</CardTitle>
                <CardDescription>
                  Envoyez-nous un e-mail à tout moment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="mailto:support@chatrealtime.com"
                  className="text-primary hover:underline"
                >
                  support@chatrealtime.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Phone className="size-10 text-primary mb-2" />
                <CardTitle>Téléphone</CardTitle>
                <CardDescription>
                  Du lundi au vendredi de 8h à 17h (heure de Paris)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="tel:+33155123456"
                  className="text-primary hover:underline"
                >
                  +33 1 55 12 34 56
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="size-10 text-primary mb-2" />
                <CardTitle>Bureau</CardTitle>
                <CardDescription>
                  Venez nous dire bonjour à notre siège
                </CardDescription>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-muted-foreground">
                  123 Rue du Chat
                  <br />
                  75001 Paris
                  <br />
                  France
                </address>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
