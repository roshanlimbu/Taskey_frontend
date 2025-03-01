import { Routes } from '@angular/router';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AuthCallbackComponent,
  },
  {
    path: 'dashboard',
    component: DashboardPageComponent,
    // canActivate: [AuthGuard], // Add the guard here
  },
  {
    path: "*",
    component: AuthCallbackComponent

  }
];
