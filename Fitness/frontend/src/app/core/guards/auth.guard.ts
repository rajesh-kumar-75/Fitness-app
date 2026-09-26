import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that ensures only authenticated users can access protected routes.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check reactive signal first, with storage fallback
  if (authService.isAuthenticated() || authService.getToken()) {
    return true;
  }

  // Redirect to /login with returnUrl query parameter
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
