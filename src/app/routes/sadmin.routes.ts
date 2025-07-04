import { Routes } from '@angular/router';

export const routes: Routes = [
  //   {
  //     path: 'dashboard',
  //     loadComponent: () =>
  //       import(
  //         '../pages/super-admin-dashboard/super-admin-dashboard.component'
  //       ).then((m) => m.SuperAdminDashboardComponent),
  //   },
  {
    path: 'company/:id',
    loadComponent: () =>
      import('../pages/company-details/company-details.component').then(
        (m) => m.CompanyDetailsComponent
      ),
  },
];
