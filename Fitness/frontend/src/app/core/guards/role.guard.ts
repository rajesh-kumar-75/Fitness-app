import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

/**
 * Higher-order guard function for Role-Based Route Access.
 * @param allowedRoles Array of UserRole permitted to access the route
 */
export const roleGuard = (...allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole();

    if (authService.isAuthenticated() && userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    // Unauthorized role access: redirect to general dashboard
    return router.createUrlTree(['/dashboard']);
  };
};
