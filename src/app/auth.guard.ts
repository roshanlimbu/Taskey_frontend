import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { of, catchError, switchMap } from 'rxjs';

export const authGuard = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  if (token) {
    // Always check backend if token exists
    return authService.checkAuthStatus().pipe(
      switchMap(() => of(true)),
      catchError(() => {
        router.navigate(['/login']);
        return of(false);
      })
    );
  } else {
    // No token, not authenticated
    router.navigate(['/login']);
    return of(false);
  }
};
