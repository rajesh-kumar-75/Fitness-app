import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor to attach JWT token and handle 401/403 errors.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

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
        // Only trigger logout if it wasn't a login attempt
        const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');
        if (!isAuthEndpoint) {
          authService.logout();
        }
        errorMessage = error.error?.message || 'Unauthorized: Please log in again.';
      } else if (error.status === 403) {
        errorMessage = error.error?.message || 'Forbidden: You do not have permission to access this resource.';
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
