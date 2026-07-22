// ================================================================
// app.module.ts - MALA PRACTICA: Todo en el modulo raiz sin lazy loading
// Viola el principio de separacion de modulos
// Sin feature modules, sin lazy loading, sin optimizacion de bundles
// ================================================================
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ClientesComponent } from './clientes/clientes.component';
import { CatalogoComponent } from './catalogo/catalogo.component';
import { CotizacionComponent } from './cotizacion/cotizacion.component';
import { AprobacionComponent } from './aprobacion/aprobacion.component';

// MALA PRACTICA: Un solo NgModule para toda la aplicacion
// Todos los componentes declarados en AppModule -> bundle enorme
// Sin HttpInterceptors para manejo centralizado de errores/auth
// Sin Guards de autenticacion en las rutas
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    ClientesComponent,
    CatalogoComponent,
    CotizacionComponent,
    AprobacionComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
    // MALA PRACTICA: Sin BrowserAnimationsModule para transiciones
  ],
  providers: [
    // MALA PRACTICA: Sin HTTP_INTERCEPTORS para token injection
    // Sin ErrorHandler global
    // Sin guardas de autenticacion
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
