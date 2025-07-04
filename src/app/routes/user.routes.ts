import { Routes } from '@angular/router';
import { UserDashboardComponent } from '../pages/user-dashboard/user-dashboard.component';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: UserDashboardComponent,
  },

  {
    path: 'company-form',
    loadComponent: () =>
      import('../pages/company-form/company-form.component').then(
        (m) => m.CompanyFormComponent
      ),
  },

  {
    path: 'wait-verification',
    loadComponent: () =>
      import('../pages/ask-verification/ask-verification.component').then(
        (m) => m.AskVerificationComponent
      ),
  },
];
