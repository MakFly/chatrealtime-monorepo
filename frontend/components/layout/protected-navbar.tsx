'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  MessageCircle,
  LogOut,
  User as UserIcon,
  Settings,
  Home,
  MessageSquare,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/lib/hooks/use-current-user'
import { logoutAction } from '@/lib/actions/auth'
import { MessageBadgeButton } from '@/components/layout/message-badge-button'

const navItems = [
  { href: '/', label: 'Accueil', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/marketplace', label: 'Marketplace', icon: Store },
]

export function ProtectedNavbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { data: user, isLoading } = useCurrentUser()

  const handleLogout = async () => {
    await logoutAction()
  }

  const getUserInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Bubble background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />

      {/* Glassmorphism navbar */}
      <div className="relative backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm">
        <div className="w-full px-4 sm:px-6">
          <div className="flex h-16 items-center">
            {/* Logo - Left */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="group flex items-center gap-3 font-bold text-lg transition-all duration-300 hover:scale-105"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg group-hover:bg-primary/30 transition-all duration-300" />
                  <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex size-10 items-center justify-center rounded-full shadow-lg ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                    <MessageCircle className="size-5" />
                  </div>
                </div>
                <span className="hidden sm:block bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
                  Chat Realtime
                </span>
              </Link>
            </div>

            {/* Navigation - Centered */}
            <nav className="hidden md:flex items-center justify-center flex-1">
              <div className="flex items-center gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 group flex items-center gap-2',
                        'hover:bg-primary/10 hover:scale-105 active:scale-95',
                        isActive(item.href)
                          ? 'text-primary bg-primary/10 shadow-sm'
                          : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      <Icon className="size-4" />
                      <span className="relative z-10">{item.label}</span>
                      {isActive(item.href) && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full border border-primary/20" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* User Section - Right */}
            <div className="flex-shrink-0 flex justify-end">
              <div className="hidden md:flex items-center gap-3">
                {/* Message Badge Button */}
                <MessageBadgeButton />

                {isLoading ? (
                  // Loading skeleton
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                ) : user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-11 w-11 rounded-full transition-all duration-300 hover:scale-110 hover:bg-primary/10 group"
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                          {user.picture && (
                            <AvatarImage
                              src={user.picture}
                              alt={user.name || user.email}
                            />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold">
                            {getUserInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 p-2 bg-background/95 backdrop-blur-xl border-border/50 shadow-xl"
                    >
                      <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
                        <p className="text-sm font-medium text-foreground">
                          {user.name || 'Utilisateur'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.email}
                        </p>
                      </div>
                      <DropdownMenuSeparator className="my-2" />
                      <div className="grid grid-cols-1 gap-1">
                        <DropdownMenuItem asChild>
                          <Link
                            href="/profile"
                            className="cursor-pointer rounded-md px-3 py-2 hover:bg-primary/10 transition-colors"
                          >
                            <UserIcon className="mr-3 h-4 w-4" />
                            Mon Profil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/settings"
                            className="cursor-pointer rounded-md px-3 py-2 hover:bg-primary/10 transition-colors"
                          >
                            <Settings className="mr-3 h-4 w-4" />
                            Paramètres
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer rounded-md px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>

            {/* Mobile Menu - Right */}
            <div className="flex items-center gap-2 justify-end md:hidden">
              {/* Message Badge Button (Mobile) */}
              <MessageBadgeButton />

              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[400px] bg-background/95 backdrop-blur-xl border-border/50"
                >
                  <nav className="flex flex-col gap-4 mt-8">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'text-sm font-medium transition-all duration-300 px-4 py-2 rounded-full flex items-center gap-2',
                            'hover:bg-primary/10 hover:scale-105 active:scale-95',
                            isActive(item.href)
                              ? 'text-primary bg-primary/10'
                              : 'text-muted-foreground hover:text-primary'
                          )}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      )
                    })}
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/50">
                      {isLoading ? (
                        // Mobile loading skeleton
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-10 w-full rounded-full" />
                          <Skeleton className="h-10 w-full rounded-full" />
                        </div>
                      ) : user ? (
                        <>
                          <div className="px-4 py-3 text-sm rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
                            <p className="font-medium">{user.name || 'Utilisateur'}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {user.email}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            asChild
                            onClick={() => setIsOpen(false)}
                            className="rounded-full hover:bg-primary/10 transition-all duration-300"
                          >
                            <Link href="/profile">
                              <UserIcon className="mr-2 h-4 w-4" />
                              Mon Profil
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            asChild
                            onClick={() => setIsOpen(false)}
                            className="rounded-full hover:bg-primary/10 transition-all duration-300"
                          >
                            <Link href="/settings">
                              <Settings className="mr-2 h-4 w-4" />
                              Paramètres
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsOpen(false)
                              handleLogout()
                            }}
                            className="text-destructive rounded-full hover:bg-destructive/10 transition-all duration-300"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Déconnexion
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
