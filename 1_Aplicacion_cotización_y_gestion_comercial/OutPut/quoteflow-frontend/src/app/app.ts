import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthStateService } from './core/auth-state.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  protected readonly session = this.authState.session;
  protected readonly isAuthenticated = computed(() => this.authState.isAuthenticated());
  protected readonly canApprove = computed(() => this.authState.hasAnyRole(['supervisor', 'admin']));

  protected logout(): void {
    this.authState.logout();
    void this.router.navigate(['/login']);
  }
}
