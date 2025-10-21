"use client"

import { useState, useRef, useEffect } from "react"
import { ChatHeader } from "./chat-header"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  responseTime?: number
  files?: Array<{ name: string; url: string; type: string }>
}

export interface ChatSettings {
  model: string
  webSearchEnabled: boolean
  tokensRemaining: number
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [settings, setSettings] = useState<ChatSettings>({
    model: "GPT-5",
    webSearchEnabled: false,
    tokensRemaining: 50000,
  })
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (content: string, files?: File[]) => {
    const startTime = Date.now()

    const fileAttachments = files?.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }))

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      files: fileAttachments,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsTyping(true)

    const estimatedTokens = Math.ceil(content.length / 4)
    setSettings((prev) => ({
      ...prev,
      tokensRemaining: Math.max(0, prev.tokensRemaining - estimatedTokens),
    }))

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])
    setIsTyping(false)
    setIsStreaming(true)

    abortControllerRef.current = new AbortController()
    const currentController = abortControllerRef.current

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: currentController.signal,
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'appel API")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("Pas de reader disponible")
      }

      let accumulatedContent = ""

      try {
        while (true) {
          if (currentController.signal.aborted) {
            console.log("[v0] Signal d'arrêt détecté, sortie de la boucle")
            break
          }

          const { done, value } = await reader.read()

          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") {
                const responseTime = Date.now() - startTime
                setMessages((prev) => prev.map((m) => (m.id === assistantMessageId ? { ...m, responseTime } : m)))
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulatedContent += parsed.content
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessageId ? { ...m, content: accumulatedContent } : m)),
                  )
                }
              } catch (e) {
                // Ignorer les erreurs de parsing
              }
            }
          }
        }
      } finally {
        reader.cancel().catch(() => {})
      }

      const responseTokens = Math.ceil(accumulatedContent.length / 4)
      setSettings((prev) => ({
        ...prev,
        tokensRemaining: Math.max(0, prev.tokensRemaining - responseTokens),
      }))
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Streaming arrêté par l'utilisateur")
      } else {
        console.error("[v0] Erreur lors du streaming:", error)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, content: "Erreur lors de la génération de la réponse." } : m,
          ),
        )
      }
    } finally {
      const responseTime = Date.now() - startTime
      setMessages((prev) => prev.map((m) => (m.id === assistantMessageId ? { ...m, responseTime } : m)))
      setIsStreaming(false)
      if (abortControllerRef.current === currentController) {
        abortControllerRef.current = null
      }
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setSettings((prev) => ({
      ...prev,
      tokensRemaining: 50000,
    }))
  }

  const handleStopStreaming = () => {
    console.log("[v0] Arrêt du streaming demandé")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      console.log("[v0] AbortController.abort() appelé")
    } else {
      console.log("[v0] Aucun AbortController actif")
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader settings={settings} onSettingsChange={setSettings} onNewChat={handleNewChat} />
      <ChatMessages messages={messages} isTyping={isTyping} messagesEndRef={messagesEndRef} />
      <ChatInput onSendMessage={handleSendMessage} isStreaming={isStreaming} onStopStreaming={handleStopStreaming} />
    </div>
  )
}
