// MALA PRACTICA: Sin AuthGuard en ninguna ruta protegida
// Cualquier usuario no autenticado puede navegar a /dashboard directamente
// Sin CanActivate, sin lazy loading, sin preloading strategy
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClientesComponent } from './clientes/clientes.component';
import { CatalogoComponent } from './catalogo/catalogo.component';
import { CotizacionComponent } from './cotizacion/cotizacion.component';
import { AprobacionComponent } from './aprobacion/aprobacion.component';

// MALA PRACTICA: Sin guards en rutas privadas
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent }, // Sin AuthGuard
  { path: 'clientes', component: ClientesComponent },   // Sin AuthGuard
  { path: 'catalogo', component: CatalogoComponent },   // Sin AuthGuard
  { path: 'cotizaciones', component: CotizacionComponent }, // Sin AuthGuard
  { path: 'aprobaciones', component: AprobacionComponent }, // Sin RolGuard
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // MALA PRACTICA: Sin preloading, sin scrollPositionRestoration
    useHash: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
