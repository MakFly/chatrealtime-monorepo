"use client"

import type React from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Phone, Video, MoreVertical, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ConversationMessage, Contact, User as UserType } from "@/lib/mock-data"

interface ConversationViewProps {
  contact: Contact | null
  messages: ConversationMessage[]
  currentUser: UserType
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function ConversationView({ contact, messages, currentUser, messagesEndRef }: ConversationViewProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status: ConversationMessage["status"]) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3" />
      case "delivered":
      case "read":
        return <CheckCheck className="h-3 w-3" />
    }
  }

  if (!contact) {
    return (
      <div className="flex h-full flex-1 items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-muted-foreground">Sélectionnez une conversation</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choisissez un contact pour commencer à discuter</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 flex items-center justify-between border-b border-border px-6 py-4 bg-background">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <span className="text-sm font-semibold">{getInitials(contact.name)}</span>
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-base">{contact.name}</h2>
            <p className="text-xs text-muted-foreground">
              {contact.status === "online"
                ? "En ligne"
                : contact.status === "away"
                  ? "Absent"
                  : contact.lastSeen
                    ? `Vu ${new Date(contact.lastSeen).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`
                    : "Hors ligne"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-4xl space-y-1">
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId === currentUser.id
            const prevMessage = index > 0 ? messages[index - 1] : null
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null

            const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId
            const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId

            return (
              <div
                key={message.id}
                className={cn("flex gap-2 items-end", {
                  "flex-row-reverse": isCurrentUser,
                  "mb-4": isLastInGroup,
                })}
              >
                {!isCurrentUser && (
                  <Avatar className={cn("h-8 w-8 shrink-0", !isLastInGroup && "opacity-0")}>
                    <AvatarFallback className="bg-muted">
                      <span className="text-xs font-medium">{getInitials(contact.name)}</span>
                    </AvatarFallback>
                  </Avatar>
                )}

                <div className={cn("flex flex-col max-w-[70%]", isCurrentUser ? "items-end" : "items-start")}>
                  {message.files && message.files.length > 0 && (
                    <div className="mb-1 flex flex-wrap gap-2">
                      {message.files.map((file, idx) => (
                        <div key={idx} className="rounded-2xl border border-border overflow-hidden">
                          {file.type.startsWith("image/") ? (
                            <img
                              src={file.url || "/placeholder.svg"}
                              alt={file.name}
                              className="max-h-64 max-w-sm object-cover"
                            />
                          ) : (
                            <div className="p-3 bg-muted/50">
                              <p className="text-sm truncate">{file.name}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 shadow-sm",
                      isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted",
                      isFirstInGroup && isCurrentUser && "rounded-tr-md",
                      isFirstInGroup && !isCurrentUser && "rounded-tl-md",
                      isLastInGroup && isCurrentUser && "rounded-br-md",
                      isLastInGroup && !isCurrentUser && "rounded-bl-md",
                    )}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words [word-break:break-word]">
                      {message.content}
                    </p>
                  </div>

                  {isLastInGroup && (
                    <div className="mt-1 flex items-center gap-1.5 px-2">
                      <span className="text-[11px] text-muted-foreground">{formatMessageTime(message.timestamp)}</span>
                      {isCurrentUser && (
                        <span className={cn("text-muted-foreground", message.status === "read" && "text-primary")}>
                          {getStatusIcon(message.status)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isCurrentUser && <div className="h-8 w-8 shrink-0" />}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
