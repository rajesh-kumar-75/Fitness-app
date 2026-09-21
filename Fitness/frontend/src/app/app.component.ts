import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { ChatService } from './core/services/chat.service';
import { AiAssistantWidgetComponent } from './components/ai-assistant-widget/ai-assistant-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AiAssistantWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly chatService = inject(ChatService);

  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentUser = this.authService.currentUser;
  readonly userRole = this.authService.userRole;
  readonly unreadMessagesCount = this.chatService.unreadTotal;
  readonly isLandingPage = signal<boolean>(false);
  readonly isAuthOrLanding = signal<boolean>(false);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects.split('?')[0].split('#')[0];
        const isLanding = url === '/' || url === '';
        const isAuth = url === '/login' || url === '/register';
        this.isLandingPage.set(isLanding);
        this.isAuthOrLanding.set(isLanding || isAuth);
      });
  }

  onLogout(): void {
    this.chatService.disconnectSocket();
    this.authService.logout();
  }
}
