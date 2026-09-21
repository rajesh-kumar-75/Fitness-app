import { Exercise } from './exercise.model';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  category?: string;
  exercises?: Exercise[];
  suggestions?: string[];
}

export interface AiSuggestionCategory {
  category: string;
  icon: string;
  prompts: string[];
}

export interface AiChatResponse {
  success: boolean;
  provider?: string;
  reply: string;
  category?: string;
  exercises?: Exercise[];
  suggestions?: string[];
  timestamp?: string;
  message?: string;
}
