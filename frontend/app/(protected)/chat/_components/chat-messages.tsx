import type React from "react"
import type { Message } from "./chat-interface"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatMessagesProps {
  messages: Message[]
  isTyping: boolean
  messagesEndRef: React.RefObject<HTMLDivElement>
}

export function ChatMessages({ messages, isTyping, messagesEndRef }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="mb-8 text-2xl md:text-4xl font-medium text-balance px-4">Comment puis-je vous aider ?</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-2 md:px-4 py-4 md:py-8 space-y-4 md:space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
              message.role === "user" ? "flex-row-reverse" : "flex-row",
            )}
          >
            <Avatar className="h-6 w-6 md:h-8 md:w-8 shrink-0">
              {message.role === "assistant" ? (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-3 w-3 md:h-4 md:w-4" />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-muted">
                  <User className="h-3 w-3 md:h-4 md:w-4" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className={cn("flex-1 min-w-0 flex", message.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[90%] md:max-w-[70%] space-y-2",
                  message.role === "user" ? "flex flex-col items-end" : "",
                )}
              >
                {message.files && message.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {message.files.map((file, idx) => (
                      <div key={idx} className="rounded-lg border border-border p-2 bg-muted/50 max-w-xs">
                        {file.type.startsWith("image/") ? (
                          <img
                            src={file.url || "/placeholder.svg"}
                            alt={file.name}
                            className="rounded max-h-48 object-cover"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="truncate">{file.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-3 md:px-4 py-2 md:py-3 break-words overflow-wrap-anywhere",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-all">{message.content}</p>
                </div>

                {message.role === "assistant" && message.responseTime && (
                  <p className="text-xs text-muted-foreground px-2">
                    Réponse en {(message.responseTime / 1000).toFixed(2)}s
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2 md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Avatar className="h-6 w-6 md:h-8 md:w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-3 w-3 md:h-4 md:w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl px-3 md:px-4 py-2 md:py-3 bg-muted">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
