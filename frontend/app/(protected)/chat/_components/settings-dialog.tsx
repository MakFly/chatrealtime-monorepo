"use client"

import * as React from "react"
import { Settings, User as UserIcon, Bell, Moon, Sun, LogOut } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/lib/hooks/use-current-user"
import { logoutAction } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getUserInitials(name: string | null | undefined, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { data: currentUser } = useCurrentUser()
  const router = useRouter()
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("system")
  const [notifications, setNotifications] = React.useState(true)
  const [soundEnabled, setSoundEnabled] = React.useState(true)

  const handleLogout = async () => {
    try {
      await logoutAction()
      onOpenChange(false)
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres
          </DialogTitle>
          <DialogDescription>
            Gérez vos préférences et paramètres de compte
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">
              <UserIcon className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Sun className="h-4 w-4 mr-2" />
              Apparence
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="flex items-center gap-4 py-4">
              <Avatar className="h-20 w-20">
                {currentUser?.picture && (
                  <AvatarImage src={currentUser.picture} alt={currentUser.name || currentUser.email} />
                )}
                <AvatarFallback className="text-xl">
                  {currentUser && getUserInitials(currentUser.name, currentUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {currentUser?.name || "Utilisateur"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  placeholder="Votre nom"
                  defaultValue={currentUser?.name || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled
                  defaultValue={currentUser?.email || ""}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>

              {currentUser?.has_google_account && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Compte Google</div>
                    <div className="text-xs text-muted-foreground">
                      Connecté via Google OAuth
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-muted-foreground">Connecté</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="button" className="flex-1">
                  Enregistrer les modifications
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive">Zone de danger</h4>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Thème</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choisissez le thème de l'application
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 hover:bg-accent ${
                      theme === "light" ? "border-primary" : "border-muted"
                    }`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-medium">Clair</span>
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 hover:bg-accent ${
                      theme === "dark" ? "border-primary" : "border-muted"
                    }`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-medium">Sombre</span>
                  </button>

                  <button
                    onClick={() => setTheme("system")}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 hover:bg-accent ${
                      theme === "system" ? "border-primary" : "border-muted"
                    }`}
                  >
                    <Settings className="h-6 w-6" />
                    <span className="text-sm font-medium">Système</span>
                  </button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Affichage</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-mode">Mode compact</Label>
                    <p className="text-xs text-muted-foreground">
                      Réduire l'espacement entre les messages
                    </p>
                  </div>
                  <Switch id="compact-mode" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-timestamps">Afficher l'heure</Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher l'heure d'envoi des messages
                    </p>
                  </div>
                  <Switch id="show-timestamps" defaultChecked />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Notifications</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Gérez vos préférences de notifications
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications-enabled">Activer les notifications</Label>
                    <p className="text-xs text-muted-foreground">
                      Recevoir des notifications pour les nouveaux messages
                    </p>
                  </div>
                  <Switch
                    id="notifications-enabled"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-enabled">Sons</Label>
                    <p className="text-xs text-muted-foreground">
                      Jouer un son pour les nouveaux messages
                    </p>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                    disabled={!notifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="desktop-notifications">Notifications bureau</Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher les notifications sur le bureau
                    </p>
                  </div>
                  <Switch
                    id="desktop-notifications"
                    disabled={!notifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="message-preview">Aperçu des messages</Label>
                    <p className="text-xs text-muted-foreground">
                      Afficher un aperçu du contenu dans les notifications
                    </p>
                  </div>
                  <Switch
                    id="message-preview"
                    defaultChecked
                    disabled={!notifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="group-notifications">Notifications de groupe</Label>
                    <p className="text-xs text-muted-foreground">
                      Recevoir des notifications pour les conversations de groupe
                    </p>
                  </div>
                  <Switch
                    id="group-notifications"
                    defaultChecked
                    disabled={!notifications}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
