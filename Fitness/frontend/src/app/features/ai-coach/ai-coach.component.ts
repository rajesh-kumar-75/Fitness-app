import {
  Component,
  OnInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';
import { AiChatMessage, AiSuggestionCategory } from '../../core/models/ai.model';

@Component({
  selector: 'app-ai-coach',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ai-coach.component.html',
  styleUrl: './ai-coach.component.scss',
})
export class AiCoachComponent implements OnInit, AfterViewChecked {
  readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  readonly inputText = signal<string>('');
  readonly suggestionCategories = signal<AiSuggestionCategory[]>([]);
  readonly activeCategoryIndex = signal<number>(0);

  private shouldScrollToBottom = false;

  ngOnInit(): void {
    this.fetchSuggestions();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  fetchSuggestions(): void {
    this.aiService.getSuggestions().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.suggestionCategories.set(res.data);
        }
      },
      error: () => {},
    });
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  clearChat(): void {
    this.aiService.clearChat();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(presetPrompt?: string): void {
    const textToSend = (presetPrompt || this.inputText()).trim();
    if (!textToSend || this.aiService.isTyping()) {
      return;
    }

    // 1. Add user message
    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.aiService.addMessage(userMsg);
    this.inputText.set('');
    this.shouldScrollToBottom = true;

    // 2. Set loading
    this.aiService.isTyping.set(true);

    // 3. History
    const historyPayload = this.aiService
      .messages()
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        text: m.text,
      }));

    const currentUser = this.authService.currentUser();
    const userContext = currentUser
      ? {
          name: currentUser.name,
          email: currentUser.email,
        }
      : {};

    // 4. Call API
    this.aiService.sendMessage(textToSend, historyPayload, userContext).subscribe({
      next: (response) => {
        this.aiService.isTyping.set(false);
        const botMsg: AiChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: response.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: response.category,
          exercises: response.exercises,
          suggestions: response.suggestions,
        };
        this.aiService.addMessage(botMsg);
        this.shouldScrollToBottom = true;
      },
      error: () => {
        this.aiService.isTyping.set(false);
        const errorMsg: AiChatMessage = {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Connection issue**: Unable to communicate with FitPlatform AI. Please check your backend connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['Try again', 'Show workout splits', 'Yoga for back relief'],
        };
        this.aiService.addMessage(errorMsg);
        this.shouldScrollToBottom = true;
      },
    });
  }

  formatMessage(text: string): string {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(?:^|\n)[-*]\s+(.+)/g, '<li class="ai-bullet">$1</li>');
    formatted = formatted.replace(/(<li.*<\/li>)/gs, '<ul class="ai-list">$1</ul>');
    formatted = formatted.replace(/\n\n/g, '<p class="ai-para"></p>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }
}
