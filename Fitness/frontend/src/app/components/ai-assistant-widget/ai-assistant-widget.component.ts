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
import { Router } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';
import { AiChatMessage } from '../../core/models/ai.model';

@Component({
  selector: 'app-ai-assistant-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-assistant-widget.component.html',
  styleUrl: './ai-assistant-widget.component.scss',
})
export class AiAssistantWidgetComponent implements OnInit, AfterViewChecked {
  readonly aiService = inject(AiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  readonly inputText = signal<string>('');
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    // Initial setup if needed
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  toggle(): void {
    this.aiService.toggleWidget();
    if (this.aiService.isWidgetOpen()) {
      this.shouldScrollToBottom = true;
    }
  }

  close(): void {
    this.aiService.closeWidget();
  }

  clearChat(): void {
    this.aiService.clearChat();
  }

  openFullScreen(): void {
    this.aiService.closeWidget();
    this.router.navigate(['/ai-coach']);
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

    // 2. Set loading state
    this.aiService.isTyping.set(true);

    // 3. Prepare history
    const historyPayload = this.aiService
      .messages()
      .slice(-6)
      .map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        text: m.text,
      }));

    // Optional user context
    const currentUser = this.authService.currentUser();
    const userContext = currentUser
      ? {
          name: currentUser.name,
          email: currentUser.email,
        }
      : {};

    // 4. Send to Backend
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
      error: (err) => {
        this.aiService.isTyping.set(false);
        const errorMsg: AiChatMessage = {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Connection issue**: Could not reach FitPlatform AI server. Please verify your network and backend connection.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: ['Try again', 'Recommend yoga poses', 'Calculate my macros'],
        };
        this.aiService.addMessage(errorMsg);
        this.shouldScrollToBottom = true;
      },
    });
  }

  /**
   * Basic markdown line formatter for bold and bullet points
   */
  formatMessage(text: string): string {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points: lines starting with "- " or "* "
    formatted = formatted.replace(/(?:^|\n)[-*]\s+(.+)/g, '<li class="ai-bullet">$1</li>');
    formatted = formatted.replace(/(<li.*<\/li>)/gs, '<ul class="ai-list">$1</ul>');

    // Line breaks
    formatted = formatted.replace(/\n\n/g, '<p class="ai-para"></p>');
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
  }
}
