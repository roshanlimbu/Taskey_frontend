import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: 'login-callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent,
      ),
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./components/error/error.component').then(
        (m) => m.ErrorComponent,
      ),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard-page/dashboard-page.component').then(
        (m) => m.DashboardPageComponent,
      ),
  },

  {
    path: 'admin',
    loadChildren: () =>
      import('./routes/project-admin.routes').then((m) => m.routes),
  },
  {
    path: 'user',
    loadChildren: () => import('./routes/user.routes').then((m) => m.routes),
  },

  {
    path: 'project/:id',
    loadComponent: () =>
      import('./components/project/project.component').then(
        (m) => m.ProjectComponent,
      ),
  },
  {
    path: 'profile',
    loadChildren: () => import('./routes/profile.routes').then((m) => m.routes),
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
