import { Injectable, signal, computed } from '@angular/core';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'fitplatform_selected_lang';

  readonly languages: SupportedLanguage[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh-CN', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' }
  ];

  // Reactive state
  readonly currentLang = signal<string>('en');
  readonly isTranslating = signal<boolean>(false);
  readonly isLoaded = signal<boolean>(false);

  readonly currentLanguage = computed(() => {
    const code = this.currentLang();
    return this.languages.find(l => l.code === code) || this.languages[0];
  });

  constructor() {
    this.init();
  }

  /**
   * Initializes the Google Translate client engine and restores saved language.
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Load saved language preference
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && this.languages.some(l => l.code === saved)) {
      this.currentLang.set(saved);
      this.setCookie(saved);
    }

    // Define global callback if not defined
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        try {
          if (window.google?.translate?.TranslateElement) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: this.languages.map(l => l.code).join(','),
                autoDisplay: false,
                layout: window.google.translate.TranslateElement.InlineLayout?.HORIZONTAL
              },
              'google_translate_element'
            );
            this.isLoaded.set(true);

            // Apply saved language once ready
            const current = this.currentLang();
            if (current && current !== 'en') {
              setTimeout(() => this.triggerGoogleTranslate(current), 500);
            }
          }
        } catch (e) {
          console.warn('[TranslationService] Init warning:', e);
        }
      };
    }

    // Inject script if not already present
    this.injectTranslateScript();
  }

  /**
   * Sets target language and applies dynamic full-page translation.
   */
  setLanguage(langCode: string): void {
    if (!this.languages.some(l => l.code === langCode)) return;

    this.isTranslating.set(true);
    this.currentLang.set(langCode);
    localStorage.setItem(this.STORAGE_KEY, langCode);

    if (langCode === 'en') {
      this.resetToOriginal();
      return;
    }

    this.setCookie(langCode);
    this.triggerGoogleTranslate(langCode);

    // Apply RTL if needed
    const target = this.languages.find(l => l.code === langCode);
    if (target?.direction === 'rtl') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }

    setTimeout(() => {
      this.isTranslating.set(false);
    }, 800);
  }

  /**
   * Restores the application text to original English.
   */
  resetToOriginal(): void {
    this.currentLang.set('en');
    localStorage.setItem(this.STORAGE_KEY, 'en');
    document.documentElement.setAttribute('dir', 'ltr');

    this.clearCookie();

    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = 'en';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Reload iframe/container
      this.triggerGoogleTranslate('en');
    }

    setTimeout(() => {
      this.isTranslating.set(false);
    }, 400);
  }

  private triggerGoogleTranslate(langCode: string): void {
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Retry in a moment if combo is still loading
      setTimeout(() => {
        const retrySelect = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        if (retrySelect) {
          retrySelect.value = langCode;
          retrySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 600);
    }
  }

  private setCookie(langCode: string): void {
    const cookieVal = `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (window.location.hostname) {
      document.cookie = `googtrans=${cookieVal}; domain=${window.location.hostname}; path=/;`;
    }
  }

  private clearCookie(): void {
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    if (window.location.hostname) {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
    }
  }

  private injectTranslateScript(): void {
    if (document.getElementById('google-translate-script')) return;

    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}
