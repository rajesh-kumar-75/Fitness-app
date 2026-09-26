import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor to attach JWT token and handle 401/403 errors.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token =
    authService.getToken() ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('fitness_auth_token') ||
        sessionStorage.getItem('fitness_auth_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('token')
      : null);

  let modifiedReq = req;
  if (token) {
    modifiedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.status === 0) {
        errorMessage = 'Unable to connect to backend service. Please verify Express is running on port 5000.';
      } else if (error.status === 401) {
        const isAuthLoginOrRegister =
          req.url.includes('/auth/login') || req.url.includes('/auth/register');
        const isUserVerification = req.url.includes('/auth/me');
        const rawMsg = (error.error?.message || error.message || '').toLowerCase();
        const isExplicitTokenExpired =
          rawMsg.includes('token failed') ||
          rawMsg.includes('token expired') ||
          rawMsg.includes('jwt expired') ||
          rawMsg.includes('user no longer exists');

        // Only log out if it is an explicit auth verification failure (/auth/me) or confirmed expired token.
        // NEVER log out on feature APIs (e.g. nutrition, progress, trainers, chat) or missing resources!
        if (!isAuthLoginOrRegister && (isUserVerification || isExplicitTokenExpired)) {
          console.warn('[AuthInterceptor] Session expired or invalid on auth endpoint. Navigating to login.');
          authService.logout();
        }
        errorMessage = error.error?.message || 'Unauthorized: Please log in again.';
      } else if (error.status === 403) {
        errorMessage = error.error?.message || 'Forbidden: You do not have permission to access this resource.';
      } else if (error.status === 404) {
        errorMessage = error.error?.message || 'Requested resource not found.';
      } else if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Server error ${error.status}: ${error.statusText}`;
      }

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        rawError: error,
      }));
    })
  );
};
