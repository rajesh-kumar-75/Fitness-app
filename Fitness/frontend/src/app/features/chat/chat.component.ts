import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { TrainerService } from '../../core/services/trainer.service';
import { Conversation, Message } from '../../core/models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  private readonly chatService = inject(ChatService);
  private readonly authService = inject(AuthService);
  private readonly trainerService = inject(TrainerService);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  readonly conversations = signal<Conversation[]>([]);
  readonly selectedConversation = signal<Conversation | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly messageText = signal<string>('');
  readonly isLoading = signal<boolean>(true);
  readonly isLoadingMessages = signal<boolean>(false);
  readonly isSending = signal<boolean>(false);

  readonly currentUserId = computed(() => this.authService.currentUser()?._id || '');
  readonly userRole = computed(() => this.authService.userRole() || 'USER');

  readonly activeStreak = '42 DAYS';
  readonly nextGoal = 'Bench 100kg - 85% Completed';

  // Typing state
  private typingTimeout: any = null;
  readonly partnerTyping = computed(() => {
    const active = this.selectedConversation();
    if (!active) return '';
    return this.chatService.typingMap().get(active._id) || '';
  });

  // Partner online state
  readonly isPartnerOnline = computed(() => {
    const active = this.selectedConversation();
    if (!active?.partner?._id) return false;
    return this.chatService.isOnline(active.partner._id);
  });

  private readonly subs = new Subscription();

  ngOnInit(): void {
    this.chatService.initSocket();
    this.loadConversations();
    this.setupSocketSubscriptions();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    const active = this.selectedConversation();
    if (active) {
      this.chatService.leaveConversation(active._id);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  private setupSocketSubscriptions(): void {
    // 1. New message arrives
    this.subs.add(
      this.chatService.messageReceived$.subscribe((msg) => {
        const active = this.selectedConversation();
        if (active && msg.conversation === active._id) {
          this.messages.update((list) => [...list, msg]);
          this.scrollToBottom();
          this.chatService.markAsRead(active._id);
        }

        // Update last message in conversations list
        this.conversations.update((convs) =>
          convs.map((c) => {
            if (c._id === msg.conversation) {
              const isCurrent = active?._id === c._id;
              return {
                ...c,
                lastMessage: msg,
                lastMessageAt: msg.createdAt,
                unreadCount: isCurrent ? 0 : c.unreadCount + 1,
              };
            }
            return c;
          })
        );
      })
    );

    // 2. Read receipts update
    this.subs.add(
      this.chatService.messagesRead$.subscribe((event) => {
        const active = this.selectedConversation();
        if (active && active._id === event.conversationId) {
          this.messages.update((list) =>
            list.map((m) => {
              if (m.sender._id === this.currentUserId() && !m.isRead) {
                return { ...m, isRead: true, readAt: event.readAt };
              }
              return m;
            })
          );
        }
      })
    );
  }

  loadConversations(): void {
    this.isLoading.set(true);
    this.chatService.getConversations().subscribe({
      next: (res) => {
        const list = res.data.conversations || [];
        this.conversations.set(list);

        // If regular USER and no conversations yet, auto-connect with assigned trainer
        if (list.length === 0 && this.userRole() === 'USER') {
          this.autoInitUserTrainerChat();
        } else if (list.length > 0) {
          // Select first conversation or matching query param
          this.selectConversation(list[0]);
          this.isLoading.set(false);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private autoInitUserTrainerChat(): void {
    this.trainerService.getMyTrainer().subscribe({
      next: (res) => {
        const trainer = res.data.connection?.trainer as any;
        if (trainer?._id) {
          this.chatService.getOrCreateConversation(trainer._id).subscribe({
            next: (convRes) => {
              const newConv = convRes.data.conversation;
              this.conversations.set([newConv]);
              this.selectConversation(newConv);
              this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectConversation(conv: Conversation): void {
    const current = this.selectedConversation();
    if (current) {
      this.chatService.leaveConversation(current._id);
    }

    this.selectedConversation.set(conv);
    this.chatService.joinConversation(conv._id);
    this.isLoadingMessages.set(true);

    this.chatService.getMessages(conv._id).subscribe({
      next: (res) => {
        this.messages.set(res.data.messages || []);
        this.isLoadingMessages.set(false);
        this.scrollToBottom();

        // Mark as read
        if (conv.unreadCount > 0) {
          this.chatService.markAsRead(conv._id);
          this.conversations.update((list) =>
            list.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
          );
        }
      },
      error: () => {
        this.isLoadingMessages.set(false);
      },
    });
  }

  sendMessage(): void {
    const text = this.messageText().trim();
    const active = this.selectedConversation();
    if (!text || !active || this.isSending()) return;

    this.isSending.set(true);
    this.stopTypingNow();

    this.chatService
      .sendMessage(active._id, text)
      .then((msg) => {
        this.messageText.set('');
        this.isSending.set(false);
        // If not already in messages list, append
        if (!this.messages().some((m) => m._id === msg._id)) {
          this.messages.update((list) => [...list, msg]);
        }
        this.scrollToBottom();
      })
      .catch((err) => {
        console.error('Failed to send message:', err);
        this.isSending.set(false);
      });
  }

  onInputChange(): void {
    const active = this.selectedConversation();
    if (!active?.partner?._id) return;

    this.chatService.sendTyping(active._id, active.partner._id, true);

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTypingNow();
    }, 2000);
  }

  private stopTypingNow(): void {
    const active = this.selectedConversation();
    if (!active?.partner?._id) return;
    this.chatService.sendTyping(active._id, active.partner._id, false);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  isOnline(userId: string): boolean {
    return this.chatService.isOnline(userId);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }
}
