// MALA PRACTICA: Logica de navegacion y autenticacion en el componente raiz
// El AppComponent no deberia manejar logica de sesion
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from './services/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // MALA PRACTICA: Variable innecesaria con tipo any
  title: any = 'QuoteFlow';
  menuAbierto: any = false;

  // MALA PRACTICA: Logica de sesion en constructor del componente raiz
  constructor(public svc: AppService, private router: Router) {
    // MALA PRACTICA: Redireccion en constructor, deberia ser en un Guard
    if (!svc.estaAutenticado()) {
      router.navigate(['/login']);
    }
  }

  cerrarSesion(): void {
    this.svc.cerrarSesion();
    this.router.navigate(['/login']);
  }

  // MALA PRACTICA: Logica de rol en el componente raiz en vez de en un servicio/guard
  esSupervisorOAdmin(): any {
    return this.svc.usuarioActual &&
      (this.svc.usuarioActual.rol === 'supervisor' || this.svc.usuarioActual.rol === 'admin');
  }
}
