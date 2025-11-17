import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { LogOut, Home } from "lucide-react"
import { logoutAction } from "@/lib/actions/auth"
import { NotificationsPopover } from "@/components/notifications-popover"
import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <NotificationsPopover />
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </Link>
          </Button>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit" className="hidden sm:flex">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
