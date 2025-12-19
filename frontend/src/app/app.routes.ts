import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './components/layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Settings } from './pages/settings/settings';
import { Services } from './pages/services/services';
import { authGuard } from './auth.guard';

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
            { path: '', component: Dashboard },
            { path: 'services', component: Services },
            { path: 'settings', component: Settings }
        ]
    },
    { path: '**', redirectTo: '' }
];
