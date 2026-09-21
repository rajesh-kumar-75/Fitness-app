import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import {
  Message,
  Conversation,
  TypingEvent,
  PresenceEvent,
  MessagesReadEvent,
} from '../models/chat.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = `${environment.apiUrl}/chat`;
  private readonly socketUrl = environment.apiUrl.replace('/api/v1', '');

  private socket: Socket | null = null;

  // Reactive State Signals
  readonly unreadTotal = signal<number>(0);
  readonly onlineUsers = signal<Set<string>>(new Set());
  readonly typingMap = signal<Map<string, string>>(new Map()); // conversationId -> userName

  // Subject streams for incoming events
  private readonly messageReceivedSubject = new Subject<Message>();
  readonly messageReceived$ = this.messageReceivedSubject.asObservable();

  private readonly messagesReadSubject = new Subject<MessagesReadEvent>();
  readonly messagesRead$ = this.messagesReadSubject.asObservable();

  constructor() {
    // If authenticated on startup, initialize connection
    if (this.authService.isAuthenticated()) {
      this.initSocket();
    }
  }

  /**
   * Initialize Socket.IO connection with authentication token.
   */
  initSocket(): void {
    const token = this.authService.token();
    if (!token) return;

    if (this.socket && this.socket.connected) {
      return;
    }

    this.socket = io(this.socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('[ChatService] Socket.IO connected with id:', this.socket?.id);
      this.refreshUnreadTotal();
    });

    // Initial presence payload from server
    this.socket.on('initial_presence', (data: { onlineUserIds: string[] }) => {
      this.onlineUsers.set(new Set(data.onlineUserIds || []));
    });

    // User presence updates (online/offline)
    this.socket.on('user_presence', (event: PresenceEvent) => {
      const current = new Set(this.onlineUsers());
      if (event.status === 'online') {
        current.add(event.userId);
      } else {
        current.delete(event.userId);
      }
      this.onlineUsers.set(current);
    });

    // Incoming real-time message
    this.socket.on('new_message', (message: Message) => {
      this.messageReceivedSubject.next(message);
      this.refreshUnreadTotal();
    });

    // Real-time notifications
    this.socket.on('new_notification', () => {
      this.refreshUnreadTotal();
    });

    // Typing indicators
    this.socket.on('user_typing', (event: TypingEvent) => {
      const current = new Map(this.typingMap());
      if (event.isTyping) {
        current.set(event.conversationId, event.userName);
      } else {
        current.delete(event.conversationId);
      }
      this.typingMap.set(current);
    });

    // Read receipts
    this.socket.on('messages_read', (event: MessagesReadEvent) => {
      this.messagesReadSubject.next(event);
      this.refreshUnreadTotal();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[ChatService] Socket disconnected:', reason);
    });
  }

  /**
   * Disconnect Socket.IO cleanly (e.g. on logout).
   */
  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.onlineUsers.set(new Set());
      this.typingMap.set(new Map());
      this.unreadTotal.set(0);
    }
  }

  /**
   * Join a specific conversation room.
   */
  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_conversation', { conversationId });
    }
  }

  /**
   * Leave a specific conversation room.
   */
  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_conversation', { conversationId });
    }
  }

  /**
   * Send a real-time message via socket with REST fallback.
   */
  sendMessage(conversationId: string, content: string): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        this.socket.emit(
          'send_message',
          { conversationId, content },
          (response: { success?: boolean; message?: Message; error?: string }) => {
            if (response.success && response.message) {
              resolve(response.message);
            } else {
              // Fallback to REST API if socket callback returned error
              this.sendMessageRest(conversationId, content).subscribe({
                next: (res) => resolve(res.data.message),
                error: (err) => reject(err),
              });
            }
          }
        );
      } else {
        // Fallback to REST API if socket offline
        this.sendMessageRest(conversationId, content).subscribe({
          next: (res) => resolve(res.data.message),
          error: (err) => reject(err),
        });
      }
    });
  }

  /**
   * Emit typing indicator start or stop.
   */
  sendTyping(conversationId: string, recipientId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;
    const eventName = isTyping ? 'typing_start' : 'typing_stop';
    this.socket.emit(eventName, { conversationId, recipientId });
  }

  /**
   * Mark conversation messages as read via socket and REST.
   */
  markAsRead(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_as_read', { conversationId });
    }
    this.markConversationReadRest(conversationId).subscribe();
  }

  /**
   * Check if a user is online using the reactive signal.
   */
  isOnline(userId: string): boolean {
    return this.onlineUsers().has(userId);
  }

  // --- REST API Endpoints ---

  getConversations(): Observable<{ success: boolean; data: { conversations: Conversation[] } }> {
    return this.http.get<{ success: boolean; data: { conversations: Conversation[] } }>(
      `${this.baseUrl}/conversations`
    );
  }

  getOrCreateConversation(partnerId: string): Observable<{
    success: boolean;
    data: { conversation: Conversation };
  }> {
    return this.http.post<{ success: boolean; data: { conversation: Conversation } }>(
      `${this.baseUrl}/conversations`,
      { partnerId }
    );
  }

  getMessages(conversationId: string): Observable<{
    success: boolean;
    data: { messages: Message[]; total: number };
  }> {
    return this.http.get<{ success: boolean; data: { messages: Message[]; total: number } }>(
      `${this.baseUrl}/conversations/${conversationId}/messages`
    );
  }

  sendMessageRest(
    conversationId: string,
    content: string
  ): Observable<{ success: boolean; data: { message: Message } }> {
    return this.http.post<{ success: boolean; data: { message: Message } }>(
      `${this.baseUrl}/conversations/${conversationId}/messages`,
      { content }
    );
  }

  markConversationReadRest(
    conversationId: string
  ): Observable<{ success: boolean; data: { modifiedCount: number; readAt: string } }> {
    return this.http.patch<{ success: boolean; data: { modifiedCount: number; readAt: string } }>(
      `${this.baseUrl}/conversations/${conversationId}/read`,
      {}
    );
  }

  getUnreadCount(): Observable<{ success: boolean; data: { totalUnread: number } }> {
    return this.http.get<{ success: boolean; data: { totalUnread: number } }>(
      `${this.baseUrl}/unread-count`
    );
  }

  refreshUnreadTotal(): void {
    this.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadTotal.set(res.data.totalUnread || 0);
      },
    });
  }
}
