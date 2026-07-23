import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthApiService } from '../core/auth-api.service';
import { AuthStateService } from '../core/auth-state.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="login-shell card">
      <div class="login-copy">
        <p class="eyebrow">Acceso seguro</p>
        <h2>QuoteFlow modernizado</h2>
        <p>
          Cada funcionalidad vive en una vista dedicada: autenticacion, dashboard, clientes, catalogo,
          cotizaciones y aprobaciones.
        </p>
        <div class="demo-list">
          <button class="ghost" type="button" (click)="useDemo('asesor')">Demo asesor</button>
          <button class="ghost" type="button" (click)="useDemo('supervisor')">Demo supervisor</button>
          <button class="ghost" type="button" (click)="useDemo('admin')">Demo admin</button>
        </div>
      </div>

      <form class="login-form" (ngSubmit)="login()">
        <label>
          Correo
          <input [(ngModel)]="email" name="email" type="email" required />
        </label>

        <label>
          Contrasena
          <input [(ngModel)]="password" name="password" type="password" required />
        </label>

        @if (error()) {
          <div class="message error">{{ error() }}</div>
        }

        <button type="submit" [disabled]="loading()">{{ loading() ? 'Ingresando...' : 'Ingresar' }}</button>
      </form>
    </section>
  `,
  styles: `
    .login-shell {
      width: min(960px, 100%);
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 1.5rem;
      padding: 1.5rem;
    }
    .login-copy h2 { margin: 0.25rem 0 0.75rem; font-size: 2.4rem; }
    .demo-list { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
    .login-form { display: grid; gap: 1rem; align-content: center; }
    label { display: grid; gap: 0.45rem; font-weight: 600; }
    @media (max-width: 920px) {
      .login-shell { grid-template-columns: 1fr; }
    }
  `
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApiService);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  protected email = 'asesor@quoteflow.com';
  protected password = '1234';
  protected readonly error = signal('');
  protected readonly loading = signal(false);

  protected login(): void {
    this.loading.set(true);
    this.error.set('');

    this.authApi.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authState.setSession(response.token, response.user);
        this.loading.set(false);
        void this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No fue posible iniciar sesion con las credenciales ingresadas.');
      }
    });
  }

  protected useDemo(role: 'asesor' | 'supervisor' | 'admin'): void {
    const emailByRole = {
      asesor: 'asesor@quoteflow.com',
      supervisor: 'supervisor@quoteflow.com',
      admin: 'admin@quoteflow.com'
    };

    this.email = emailByRole[role];
    this.password = '1234';
  }
}