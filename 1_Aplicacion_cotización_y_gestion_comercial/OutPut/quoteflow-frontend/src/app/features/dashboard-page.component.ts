import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { DashboardApiService } from '../core/dashboard-api.service';
import { DashboardMetrics } from '../core/models';
import { formatCurrency, statusTone } from '../core/formatters';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Vista operativa</p>
          <h2>Dashboard comercial</h2>
        </div>
        <button class="secondary" type="button" (click)="load()">Actualizar</button>
      </header>

      @if (error()) {
        <div class="message error">{{ error() }}</div>
      }

      @if (metrics(); as data) {
        <section class="grid three">
          <article class="card metric">
            <span>Cotizaciones</span>
            <strong>{{ data.totalQuotes }}</strong>
          </article>
          <article class="card metric">
            <span>Valor cotizado</span>
            <strong>{{ currency(data.totalQuotedValue) }}</strong>
          </article>
          <article class="card metric">
            <span>Tasa de conversion</span>
            <strong>{{ data.conversionRate }}%</strong>
          </article>
        </section>

        <section class="card">
          <div class="page-header">
            <div>
              <h3>Actividad reciente</h3>
              <p>Seguimiento a las ultimas cotizaciones registradas.</p>
            </div>
            <span class="tag warn">Pendientes {{ data.pendingApprovals }}</span>
          </div>

          <div class="grid">
            @for (item of data.recentActivity; track item.title) {
              <article class="activity-row">
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.detail }}</p>
                </div>
                <span class="tag" [class.warn]="tone(item.status) === 'warn'" [class.ok]="tone(item.status) === 'ok'" [class.info]="tone(item.status) === 'info'">
                  {{ item.status }}
                </span>
              </article>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: `
    .metric span { color: #64748b; }
    .metric strong { display: block; margin-top: 0.5rem; font-size: 1.8rem; }
    .activity-row { display: flex; justify-content: space-between; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #e6edf5; }
    .activity-row:last-child { border-bottom: 0; }
    .activity-row p { margin: 0.35rem 0 0; color: #64748b; }
  `
})
export class DashboardPageComponent implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);

  protected readonly metrics = signal<DashboardMetrics | null>(null);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.dashboardApi.getMetrics().subscribe({
      next: (result) => {
        this.metrics.set(result);
        this.error.set('');
      },
      error: () => this.error.set('No fue posible cargar el dashboard.')
    });
  }

  protected currency(value: number): string {
    return formatCurrency(value);
  }

  protected tone(status: string): string {
    return statusTone(status);
  }
}