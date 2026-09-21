import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Functional HTTP interceptor to handle and normalize API errors.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.status === 0) {
        // A client-side or network error occurred
        errorMessage = 'Unable to connect to the backend server. Please verify Express is running on port 5000.';
      } else if (error.error && typeof error.error === 'object' && error.error.message) {
        // Backend returned standard ApiError format
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else {
        errorMessage = `Server returned code ${error.status}: ${error.statusText}`;
      }

      console.error(`[HTTP Error] [${req.method}] ${req.url} ->`, errorMessage, error);

      return throwError(() => ({
        status: error.status,
        message: errorMessage,
        rawError: error,
      }));
    })
  );
};
