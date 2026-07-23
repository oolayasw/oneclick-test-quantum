import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthStateService } from '../core/auth-state.service';
import { formatCurrency, statusTone } from '../core/formatters';
import { Quote } from '../core/models';
import { QuotesApiService } from '../core/quotes-api.service';

@Component({
  selector: 'app-approvals-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Vista dedicada</p>
          <h2>Bandeja de aprobaciones</h2>
        </div>
      </header>

      @if (message()) {
        <div class="message success">{{ message() }}</div>
      }
      @if (error()) {
        <div class="message error">{{ error() }}</div>
      }

      <section class="card table-wrap">
        <table>
          <thead>
            <tr><th>Cotizacion</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Comentario</th><th></th></tr>
          </thead>
          <tbody>
            @for (quote of pendingQuotes(); track quote.id) {
              <tr>
                <td>{{ quote.number }}</td>
                <td>{{ quote.client }}</td>
                <td><span class="tag" [class.warn]="tone(quote.status) === 'warn'" [class.ok]="tone(quote.status) === 'ok'" [class.info]="tone(quote.status) === 'info'">{{ quote.status }}</span></td>
                <td>{{ currency(quote.total) }}</td>
                <td><input [(ngModel)]="comments[quote.id]" [name]="'comment-' + quote.id" placeholder="Comentario" /></td>
                <td>
                  <div class="inline-actions">
                    <button type="button" (click)="changeStatus(quote, 'Aprobada')">Aprobar</button>
                    <button class="secondary" type="button" (click)="changeStatus(quote, 'Rechazada')">Rechazar</button>
                    <button class="ghost" type="button" (click)="changeStatus(quote, 'Requiere ajustes')">Ajustes</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </section>
  `
})
export class ApprovalsPageComponent implements OnInit {
  private readonly quotesApi = inject(QuotesApiService);
  private readonly authState = inject(AuthStateService);

  protected readonly pendingQuotes = signal<Quote[]>([]);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected comments: Record<number, string> = {};

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.quotesApi.getAll().subscribe({
      next: (quotes) => this.pendingQuotes.set(quotes.filter(item => item.status === 'Pendiente de aprobacion')),
      error: () => this.error.set('No fue posible cargar las aprobaciones pendientes.')
    });
  }

  protected changeStatus(quote: Quote, status: string): void {
    const comment = this.comments[quote.id] ?? '';
    const userName = this.authState.session()?.name ?? 'Supervisor Demo';

    if (status === 'Rechazada' && !comment.trim()) {
      this.error.set('Debes ingresar un comentario para rechazar una cotizacion.');
      return;
    }

    this.quotesApi.updateStatus(quote.id, status, comment, userName).subscribe({
      next: () => {
        this.message.set(`Cotizacion ${quote.number} actualizada a ${status}.`);
        this.error.set('');
        this.comments[quote.id] = '';
        this.load();
      },
      error: () => this.error.set('No fue posible actualizar el estado de la cotizacion.')
    });
  }

  protected currency(value: number): string {
    return formatCurrency(value);
  }

  protected tone(status: string): string {
    return statusTone(status);
  }
}