import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { currentUser, refreshCurrentUser } from '../ts/data/auth';

export const authGuard: CanActivateFn = async (_route, state) => {
  const router = inject(Router);

  if (currentUser()) return true;

  const user = await refreshCurrentUser().catch(() => null);
  if (user) return true;

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};
