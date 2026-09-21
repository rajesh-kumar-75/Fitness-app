import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiChatMessage, AiChatResponse, AiSuggestionCategory } from '../models/ai.model';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ai`;

  // Signals for global reactive state
  readonly isWidgetOpen = signal<boolean>(false);
  readonly isTyping = signal<boolean>(false);
  readonly unreadCount = signal<number>(0);

  // Initial welcome message
  readonly messages = signal<AiChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `👋 **Welcome to FitPlatform AI Coach!**\n\nI am your intelligent fitness & wellness advisor. I can help you with:\n\n- 🏋️ **Workout Routines & Splits** (5-Day Hypertrophy, 4-Day Upper/Lower, 3-Day Full Body)\n- 🧘 **Yoga & Flexibility** (Asanas, Posture, Decompression)\n- 🥗 **Nutrition & Macro Tracking** (Calorie targets, Protein requirements)\n- 💡 **Technique Mastery** (Squat, Deadlift, Bench Press mechanics)\n- 🇮🇳 **తెలుగులో సహాయం** (తెలుగులో కూడా నన్ను ఏదైనా అడగవచ్చు!)\n\nChoose a prompt below or type your question to get started!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        'Generate a 5-day workout split',
        'Recommend top yoga poses',
        'Calculate my calories and macros',
        'నాకు బరువు తగ్గడానికి డైట్ ప్లాన్ చెప్పండి'
      ],
    },
  ]);

  /**
   * Send a chat message to the AI Assistant API
   */
  sendMessage(message: string, history: Array<{ role: 'user' | 'assistant'; text: string }> = [], userContext?: any): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.baseUrl}/chat`, {
      message,
      history,
      userContext,
    });
  }

  /**
   * Retrieve dynamic categorized prompt suggestions
   */
  getSuggestions(): Observable<{ success: boolean; data: AiSuggestionCategory[] }> {
    return this.http.get<{ success: boolean; data: AiSuggestionCategory[] }>(`${this.baseUrl}/suggestions`);
  }

  /**
   * Append a message to conversation history
   */
  addMessage(message: AiChatMessage): void {
    this.messages.update((msgs) => [...msgs, message]);
    if (!this.isWidgetOpen() && message.sender === 'assistant') {
      this.unreadCount.update((c) => c + 1);
    }
  }

  /**
   * Clear chat history and restore welcome message
   */
  clearChat(): void {
    this.messages.set([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `✨ Chat history cleared! How can I help you power through your fitness journey today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Generate a 5-day workout split',
          'Recommend top yoga poses',
          'High protein meal ideas',
          'యోగా ఆసనాలు ఏవి మంచివి?'
        ],
      },
    ]);
  }

  toggleWidget(): void {
    this.isWidgetOpen.update((open) => {
      const next = !open;
      if (next) {
        this.unreadCount.set(0);
      }
      return next;
    });
  }

  openWidget(): void {
    this.isWidgetOpen.set(true);
    this.unreadCount.set(0);
  }

  closeWidget(): void {
    this.isWidgetOpen.set(false);
  }
}
