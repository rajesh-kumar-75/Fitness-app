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

    const isAuthed = authService.isAuthenticated() || !!authService.getToken();
    const userRole = (authService.userRole() || 'USER').toUpperCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (isAuthed && (normalizedAllowed.length === 0 || normalizedAllowed.includes(userRole))) {
      return true;
    }

    // Unauthorized role access: redirect to general dashboard
    return router.createUrlTree(['/dashboard']);
  };
};
