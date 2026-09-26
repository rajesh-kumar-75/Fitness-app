import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import {
  User,
  UserRole,
  AuthResponse,
  UserProfileResponse,
  LoginPayload,
  RegisterPayload,
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'fitness_auth_token';
const USER_KEY = 'fitness_auth_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  // Reactive State Signals
  readonly token = signal<string | null>(this.loadStoredToken());
  readonly currentUser = signal<User | null>(this.loadStoredUser());

  // Computed state
  readonly isAuthenticated = computed(() => !!this.token() || !!this.loadStoredToken());
  readonly userRole = computed<UserRole | null>(() => {
    const role = this.currentUser()?.role;
    if (!role) {
      // Default to USER if authenticated but profile not yet populated
      return this.token() ? 'USER' : null;
    }
    const upper = (role as string).toUpperCase();
    if (upper === 'TRAINER') return 'TRAINER';
    if (upper === 'ADMIN') return 'ADMIN';
    return 'USER';
  });
  readonly isTrainer = computed(() => this.userRole() === 'TRAINER');
  readonly isAdmin = computed(() => this.userRole() === 'ADMIN');

  constructor() {
    // If token exists, silently refresh user profile without kicking user out on transient errors
    const token = this.getToken();
    if (token) {
      this.fetchCurrentUser().subscribe({
        next: (res) => {
          if (res?.data?.user) {
            this.currentUser.set(res.data.user);
          }
        },
        error: (err) => {
          // Only log out if backend explicitly rejected the token with 401
          if (err && (err.status === 401 || err.rawError?.status === 401)) {
            console.warn('[AuthService] Token expired or invalid on startup validation. Logging out.');
            this.logout();
          } else {
            console.warn('[AuthService] Could not refresh profile from server on startup. Retaining stored session.');
          }
        },
      });
    }
  }

  /**
   * Register a new user and set authentication state.
   */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, payload).pipe(
      tap((response) => {
        this.setSession(response.data.token, response.data.user);
      })
    );
  }

  /**
   * Log in user and set authentication state.
   */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((response) => {
        this.setSession(response.data.token, response.data.user);
      })
    );
  }

  /**
   * Fetch current authenticated user's profile.
   */
  fetchCurrentUser(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.baseUrl}/me`).pipe(
      tap((response) => {
        if (response?.data?.user) {
          this.currentUser.set(response.data.user);
          this.saveToStorage(USER_KEY, JSON.stringify(response.data.user));
        }
      })
    );
  }

  /**
   * Log out user, clear storage and signals, redirect to /login.
   */
  logout(): void {
    // Call backend logout asynchronously (fire and forget)
    const token = this.getToken();
    if (token) {
      this.http.post(`${this.baseUrl}/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    }

    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Get raw token value for interceptors and guards.
   */
  getToken(): string | null {
    const current = this.token();
    if (current) return current;
    const stored = this.loadStoredToken();
    if (stored) {
      this.token.set(stored);
      return stored;
    }
    return null;
  }

  private setSession(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    this.saveToStorage(TOKEN_KEY, token);
    this.saveToStorage(USER_KEY, JSON.stringify(user));
  }

  private clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.removeFromStorage(TOKEN_KEY);
    this.removeFromStorage(USER_KEY);
  }

  private loadStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return (
        localStorage.getItem(TOKEN_KEY) ||
        sessionStorage.getItem(TOKEN_KEY) ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken')
      );
    } catch {
      return null;
    }
  }

  private loadStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw =
        localStorage.getItem(USER_KEY) ||
        sessionStorage.getItem(USER_KEY) ||
        localStorage.getItem('user') ||
        sessionStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    } catch {
      // Ignore storage errors in restricted iframe/private mode
    }
  }

  private removeFromStorage(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      if (key === TOKEN_KEY) {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
      }
      if (key === USER_KEY) {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    } catch {
      // Ignore storage errors
    }
  }
}
