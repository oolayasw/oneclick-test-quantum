import { Routes } from '@angular/router';

import { authGuard, roleGuard } from './core/auth.guards';
import { ApprovalsPageComponent } from './features/approvals-page.component';
import { CatalogPageComponent } from './features/catalog-page.component';
import { ClientsPageComponent } from './features/clients-page.component';
import { DashboardPageComponent } from './features/dashboard-page.component';
import { LoginPageComponent } from './features/login-page.component';
import { QuotesPageComponent } from './features/quotes-page.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'dashboard', component: DashboardPageComponent, canActivate: [authGuard] },
	{ path: 'clientes', component: ClientsPageComponent, canActivate: [authGuard] },
	{ path: 'catalogo', component: CatalogPageComponent, canActivate: [authGuard] },
	{ path: 'cotizaciones', component: QuotesPageComponent, canActivate: [authGuard] },
	{ path: 'aprobaciones', component: ApprovalsPageComponent, canActivate: [authGuard, roleGuard(['supervisor', 'admin'])] },
	{ path: '**', redirectTo: 'login' }
];
