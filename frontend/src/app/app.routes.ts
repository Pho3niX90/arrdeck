import {Routes} from '@angular/router';
import {Login} from './pages/login/login';
import {Layout} from './components/layout/layout';
import {authGuard} from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'services',
        loadComponent: () => import('./pages/services/services').then(m => m.Services)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./pages/calendar/calendar').then(m => m.Calendar)
      },
      {
        path: 'stats',
        loadComponent: () => import('./pages/stats/stats').then(m => m.StatsPageComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings').then(m => m.Settings)
      }
    ]
  },
  {path: '**', redirectTo: ''}
];
