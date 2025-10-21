"use client"

import * as React from "react"
import { Search, Settings, MoreHorizontal } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MOCK_CONTACTS, CURRENT_USER } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeContactId: string | null
  onContactSelect: (contactId: string) => void
}

function truncateMessage(message: string, maxLength = 40): string {
  if (message.length <= maxLength) return message
  return message.slice(0, maxLength) + "..."
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}j`
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function AppSidebar({ activeContactId, onContactSelect, ...props }: AppSidebarProps) {
  const [searchQuery, setSearchQuery] = React.useState("")

  const filteredContacts = React.useMemo(() => {
    return MOCK_CONTACTS.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={CURRENT_USER.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {CURRENT_USER.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold truncate">{CURRENT_USER.name}</span>
                <span className="text-xs text-muted-foreground">
                  {CURRENT_USER.status === "online" ? "En ligne" : "Hors ligne"}
                </span>
              </div>
              <SidebarMenuButton size="sm" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </SidebarGroupLabel>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold">Messages</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredContacts.map((contact) => (
                <SidebarMenuItem key={contact.id}>
                  <SidebarMenuButton
                    onClick={() => onContactSelect(contact.id)}
                    className={cn("h-auto py-3 px-3 hover:bg-accent", activeContactId === contact.id && "bg-accent")}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        {contact.status === "online" && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                        {contact.status === "away" && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold truncate">{contact.name}</span>
                          {contact.lastMessageTime && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTime(contact.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {contact.lastMessage ? truncateMessage(contact.lastMessage) : "Aucun message"}
                          </p>
                          {contact.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs shrink-0">
                              {contact.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
