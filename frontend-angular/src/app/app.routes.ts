import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Both feature routes are lazy (`loadComponent`) so each page ships as its own bundle and the
 * initial download stays minimal. The dashboard sits behind the functional auth guard.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
