import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthStateService } from './auth-state.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  return authState.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export function roleGuard(roles: string[]): CanActivateFn {
  return (_route: ActivatedRouteSnapshot): boolean | UrlTree => {
    const authState = inject(AuthStateService);
    const router = inject(Router);
    return authState.hasAnyRole(roles) ? true : router.createUrlTree(['/dashboard']);
  };
}