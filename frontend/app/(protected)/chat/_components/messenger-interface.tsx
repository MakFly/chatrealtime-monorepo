"use client"

import { useState, useRef, useEffect } from "react"
import { ConversationView } from "./conversation-view"
import { ChatInput } from "./chat-input"
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import {
  CURRENT_USER,
  MOCK_CONTACTS,
  MOCK_CONVERSATIONS,
  type Contact,
  type ConversationMessage,
} from "@/lib/mock-data"

export function MessengerInterface() {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Record<string, ConversationMessage[]>>(MOCK_CONVERSATIONS)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || null
  const currentMessages = selectedContactId ? conversations[selectedContactId] || [] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [currentMessages])

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!selectedContactId) return

    const fileAttachments = files?.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
    }))

    const newMessage: ConversationMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedContactId,
      senderId: CURRENT_USER.id,
      content,
      timestamp: new Date(),
      status: "sent",
      files: fileAttachments,
    }

    setConversations((prev) => ({
      ...prev,
      [selectedContactId]: [...(prev[selectedContactId] || []), newMessage],
    }))

    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === selectedContactId
          ? {
              ...contact,
              lastMessage: content.length > 40 ? content.slice(0, 40) + "..." : content,
              lastMessageTime: new Date(),
            }
          : contact,
      ),
    )

    // Update message status
    setTimeout(() => {
      setConversations((prev) => ({
        ...prev,
        [selectedContactId]: prev[selectedContactId].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg,
        ),
      }))
    }, 500)

    setTimeout(() => {
      setConversations((prev) => ({
        ...prev,
        [selectedContactId]: prev[selectedContactId].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg,
        ),
      }))
    }, 1500)

    // Simulate user response
    setIsTyping(true)
    setTimeout(
      () => {
        const responses = [
          "C'est noté !",
          "Merci pour l'info",
          "D'accord, je regarde ça",
          "Super, merci !",
          "Parfait",
          "OK !",
          "Génial !",
          "Je suis d'accord",
          "Bonne idée",
        ]
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]

        const responseMessage: ConversationMessage = {
          id: `msg-${Date.now()}-response`,
          conversationId: selectedContactId,
          senderId: selectedContactId,
          content: randomResponse,
          timestamp: new Date(),
          status: "read",
        }

        setConversations((prev) => ({
          ...prev,
          [selectedContactId]: [...(prev[selectedContactId] || []), responseMessage],
        }))

        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === selectedContactId
              ? {
                  ...contact,
                  lastMessage: randomResponse,
                  lastMessageTime: new Date(),
                  unreadCount: contact.unreadCount + 1,
                }
              : contact,
          ),
        )

        setIsTyping(false)
      },
      1500 + Math.random() * 2000,
    )
  }

  const handleSelectContact = (contactId: string) => {
    setSelectedContactId(contactId)
    setContacts((prev) => prev.map((contact) => (contact.id === contactId ? { ...contact, unreadCount: 0 } : contact)))
  }

  return (
    <SidebarProvider>
      <AppSidebar activeContactId={selectedContactId} onContactSelect={handleSelectContact} />

      <SidebarInset>
        <div className="flex h-screen flex-col">
          {selectedContact ? (
            <>
              <ConversationView
                contact={selectedContact}
                messages={currentMessages}
                currentUser={CURRENT_USER}
                messagesEndRef={messagesEndRef}
              />
              <div className="shrink-0 border-t border-border bg-background">
                <ChatInput onSendMessage={handleSendMessage} />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-1 items-center justify-center bg-background">
              <div className="text-center">
                <h2 className="text-2xl font-medium text-muted-foreground">Sélectionnez une conversation</h2>
                <p className="mt-2 text-sm text-muted-foreground">Choisissez un contact pour commencer à discuter</p>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
