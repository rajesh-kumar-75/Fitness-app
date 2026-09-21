export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'TRAINER' | 'ADMIN';
  profileImage?: string;
  isOnline?: boolean;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: ChatUser;
  recipient: ChatUser;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  _id: string;
  partner: ChatUser;
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface PresenceEvent {
  userId: string;
  status: 'online' | 'offline';
  timestamp?: string;
}

export interface MessagesReadEvent {
  conversationId: string;
  readBy: string;
  readAt: string;
}
