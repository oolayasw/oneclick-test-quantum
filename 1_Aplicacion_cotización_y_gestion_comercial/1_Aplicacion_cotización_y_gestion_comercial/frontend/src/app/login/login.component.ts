// MALA PRACTICA: Logica de autenticacion y navegacion en el componente
// No hay un AuthService separado, no hay guards
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AppService } from '../services/app.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  // MALA PRACTICA: any en todo, valores iniciales hardcodeados para "facilidad"
  email: any = 'asesor@quoteflow.com';
  password: any = '1234';
  errorMsg: any = '';
  cargando: any = false;
  mostrarPassword: any = false;

  constructor(private svc: AppService, private router: Router) {
    // MALA PRACTICA: Redireccion en constructor sin usar guard
    if (svc.estaAutenticado()) {
      router.navigate(['/dashboard']);
    }
  }

  login(): void {
    if (!this.email || !this.password) {
      this.errorMsg = 'Ingrese usuario y contraseña';
      return;
    }

    this.cargando = true;
    this.errorMsg = '';

    // MALA PRACTICA: Logica de negocio directamente en el componente
    this.svc.login(this.email, this.password).subscribe(
      (data: any) => {
        this.svc.establecerSesion(data);
        this.cargando = false;
        // MALA PRACTICA: Retraso artificial sin necesidad
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 300);
      },
      (error: any) => {
        this.cargando = false;
        this.errorMsg = 'Usuario o contraseña incorrectos';
        console.log('Error login:', error);
      }
    );
  }

  // MALA PRACTICA: Setear credenciales hardcodeadas desde el template
  usarCuentaDemoAsesor(): void {
    this.email = 'asesor@quoteflow.com';
    this.password = '1234';
  }

  usarCuentaDemoSupervisor(): void {
    this.email = 'supervisor@quoteflow.com';
    this.password = '1234';
  }
}
