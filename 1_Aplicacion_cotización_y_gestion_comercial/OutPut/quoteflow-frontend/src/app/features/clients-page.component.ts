import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ClientsApiService } from '../core/clients-api.service';
import { Client, ClientDetail } from '../core/models';
import { formatCurrency } from '../core/formatters';

type ClientForm = Omit<Client, 'id' | 'totalQuoted'>;

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Vista dedicada</p>
          <h2>Gestion de clientes</h2>
        </div>
      </header>

      @if (message()) {
        <div class="message success">{{ message() }}</div>
      }
      @if (error()) {
        <div class="message error">{{ error() }}</div>
      }

      <section class="grid two">
        <article class="card">
          <h3>{{ editingId() ? 'Editar cliente' : 'Nuevo cliente' }}</h3>
          <form class="grid" (ngSubmit)="save()">
            <label>Identificacion<input [(ngModel)]="form.identification" name="identification" required /></label>
            <label>Razon social<input [(ngModel)]="form.businessName" name="businessName" required /></label>
            <label>Contacto<input [(ngModel)]="form.contact" name="contact" required /></label>
            <label>Correo<input [(ngModel)]="form.email" name="email" type="email" required /></label>
            <label>Telefono<input [(ngModel)]="form.phone" name="phone" required /></label>
            <label>Direccion<input [(ngModel)]="form.address" name="address" required /></label>
            <label>Condicion tributaria<input [(ngModel)]="form.taxCondition" name="taxCondition" required /></label>
            <label>Estado
              <select [(ngModel)]="form.status" name="status">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
            <div class="inline-actions">
              <button type="submit">{{ editingId() ? 'Actualizar' : 'Crear cliente' }}</button>
              <button class="secondary" type="button" (click)="resetForm()">Limpiar</button>
            </div>
          </form>
        </article>

        <article class="card">
          <h3>Detalle e historial</h3>
          @if (selectedDetail(); as detail) {
            <div class="grid">
              <div>
                <strong>{{ detail.client.businessName }}</strong>
                <p>{{ detail.client.contact }} · {{ detail.client.email }}</p>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Cotizacion</th><th>Estado</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    @for (quote of detail.quoteHistory; track quote.id) {
                      <tr>
                        <td>{{ quote.number }}</td>
                        <td>{{ quote.status }}</td>
                        <td>{{ currency(quote.total) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          } @else {
            <p class="empty-state">Selecciona un cliente para ver su historial de cotizaciones.</p>
          }
        </article>
      </section>

      <section class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th>Total cotizado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (client of clients(); track client.id) {
              <tr>
                <td>{{ client.businessName }}<br /><small>{{ client.identification }}</small></td>
                <td>{{ client.contact }}<br /><small>{{ client.email }}</small></td>
                <td><span class="tag" [class.ok]="client.status === 'activo'">{{ client.status }}</span></td>
                <td>{{ currency(client.totalQuoted) }}</td>
                <td>
                  <div class="inline-actions">
                    <button class="ghost" type="button" (click)="inspect(client.id)">Ver</button>
                    <button class="ghost" type="button" (click)="edit(client)">Editar</button>
                    <button class="secondary" type="button" (click)="remove(client.id)">Eliminar</button>
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
export class ClientsPageComponent implements OnInit {
  private readonly clientsApi = inject(ClientsApiService);

  protected readonly clients = signal<Client[]>([]);
  protected readonly selectedDetail = signal<ClientDetail | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly message = signal('');
  protected readonly error = signal('');

  protected form: ClientForm = this.createEmptyForm();

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.clientsApi.getAll().subscribe({
      next: (clients) => this.clients.set(clients),
      error: () => this.error.set('No fue posible cargar los clientes.')
    });
  }

  protected inspect(id: number): void {
    this.clientsApi.getDetail(id).subscribe({
      next: (detail) => this.selectedDetail.set(detail),
      error: () => this.error.set('No fue posible cargar el historial del cliente.')
    });
  }

  protected edit(client: Client): void {
    this.editingId.set(client.id);
    this.form = {
      identification: client.identification,
      businessName: client.businessName,
      contact: client.contact,
      email: client.email,
      phone: client.phone,
      address: client.address,
      taxCondition: client.taxCondition,
      status: client.status
    };
  }

  protected save(): void {
    const request = this.editingId()
      ? this.clientsApi.update(this.editingId()!, this.form)
      : this.clientsApi.create(this.form);

    request.subscribe({
      next: () => {
        this.message.set(this.editingId() ? 'Cliente actualizado.' : 'Cliente creado.');
        this.error.set('');
        this.resetForm();
        this.load();
      },
      error: (response) => this.error.set(response.error?.error ?? 'No fue posible guardar el cliente.')
    });
  }

  protected remove(id: number): void {
    this.clientsApi.delete(id).subscribe({
      next: () => {
        this.message.set('Cliente eliminado.');
        this.load();
      },
      error: () => this.error.set('No fue posible eliminar el cliente.')
    });
  }

  protected resetForm(): void {
    this.form = this.createEmptyForm();
    this.editingId.set(null);
  }

  protected currency(value: number): string {
    return formatCurrency(value);
  }

  private createEmptyForm(): ClientForm {
    return {
      identification: '',
      businessName: '',
      contact: '',
      email: '',
      phone: '',
      address: '',
      taxCondition: '',
      status: 'activo'
    };
  }
}