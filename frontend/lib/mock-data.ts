export interface User {
    id: string
    name: string
    avatar?: string
    status: "online" | "offline" | "away"
    lastSeen?: Date
  }
  
  export interface Contact extends User {
    unreadCount: number
    lastMessage?: string
    lastMessageTime?: Date
  }
  
  export const CURRENT_USER: User = {
    id: "current-user",
    name: "Vous",
    status: "online",
  }
  
  export const MOCK_CONTACTS: Contact[] = [
    {
      id: "user-1",
      name: "Sophie Martin",
      status: "online",
      unreadCount: 2,
      lastMessage: "Tu as vu le dernier projet ?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 2),
    },
    {
      id: "user-2",
      name: "Thomas Dubois",
      status: "away",
      unreadCount: 0,
      lastMessage: "Parfait, merci !",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "user-3",
      name: "Marie Lefebvre",
      status: "offline",
      unreadCount: 1,
      lastMessage: "On se voit demain ?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      lastSeen: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "user-4",
      name: "Lucas Bernard",
      status: "online",
      unreadCount: 0,
      lastMessage: "Super idée !",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      id: "user-5",
      name: "Emma Petit",
      status: "offline",
      unreadCount: 0,
      lastMessage: "À bientôt",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
  ]
  
  export interface ConversationMessage {
    id: string
    conversationId: string
    senderId: string
    content: string
    timestamp: Date
    status: "sent" | "delivered" | "read"
    files?: Array<{ name: string; url: string; type: string }>
  }
  
  export const MOCK_CONVERSATIONS: Record<string, ConversationMessage[]> = {
    "user-1": [
      {
        id: "msg-1-1",
        conversationId: "user-1",
        senderId: "user-1",
        content: "Salut ! Comment ça va ?",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        status: "read",
      },
      {
        id: "msg-1-2",
        conversationId: "user-1",
        senderId: "current-user",
        content: "Très bien merci ! Et toi ?",
        timestamp: new Date(Date.now() - 1000 * 60 * 8),
        status: "read",
      },
      {
        id: "msg-1-3",
        conversationId: "user-1",
        senderId: "user-1",
        content: "Super ! Tu as vu le dernier projet ?",
        timestamp: new Date(Date.now() - 1000 * 60 * 2),
        status: "delivered",
      },
    ],
    "user-2": [
      {
        id: "msg-2-1",
        conversationId: "user-2",
        senderId: "current-user",
        content: "Merci pour ton aide hier !",
        timestamp: new Date(Date.now() - 1000 * 60 * 35),
        status: "read",
      },
      {
        id: "msg-2-2",
        conversationId: "user-2",
        senderId: "user-2",
        content: "Parfait, merci !",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        status: "read",
      },
    ],
    "user-3": [
      {
        id: "msg-3-1",
        conversationId: "user-3",
        senderId: "user-3",
        content: "On se voit demain ?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        status: "delivered",
      },
    ],
    "user-4": [
      {
        id: "msg-4-1",
        conversationId: "user-4",
        senderId: "current-user",
        content: "J'ai une idée pour le nouveau design",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5.5),
        status: "read",
      },
      {
        id: "msg-4-2",
        conversationId: "user-4",
        senderId: "user-4",
        content: "Super idée !",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        status: "read",
      },
    ],
    "user-5": [
      {
        id: "msg-5-1",
        conversationId: "user-5",
        senderId: "user-5",
        content: "Merci pour tout !",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24.5),
        status: "read",
      },
      {
        id: "msg-5-2",
        conversationId: "user-5",
        senderId: "current-user",
        content: "À bientôt",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        status: "read",
      },
    ],
  }
  