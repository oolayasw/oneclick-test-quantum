import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthStateService } from '../core/auth-state.service';
import { CatalogApiService } from '../core/catalog-api.service';
import { ClientsApiService } from '../core/clients-api.service';
import { formatCurrency, statusTone } from '../core/formatters';
import { Client, CreateQuoteRequest, PriceList, Product, Quote } from '../core/models';
import { QuotesApiService } from '../core/quotes-api.service';

interface QuoteForm {
  clientId: number | null;
  currency: string;
  validUntil: string;
  priceListId: number | null;
  discount: number;
  paymentTerms: string;
  deliveryTime: string;
  notes: string;
  sendForApproval: boolean;
  items: Array<{ productId: number; quantity: number; discount: number }>;
}

@Component({
  selector: 'app-quotes-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Vista dedicada</p>
          <h2>Cotizaciones</h2>
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
          <h3>Nueva cotizacion</h3>
          <form class="grid" (ngSubmit)="save()">
            <label>Cliente
              <select [(ngModel)]="form.clientId" name="clientId" required>
                <option [ngValue]="null">Selecciona un cliente</option>
                @for (client of clients(); track client.id) {
                  <option [ngValue]="client.id">{{ client.businessName }}</option>
                }
              </select>
            </label>
            <label>Vigencia<input [(ngModel)]="form.validUntil" name="validUntil" type="date" required /></label>
            <label>Lista de precios
              <select [(ngModel)]="form.priceListId" name="priceListId">
                <option [ngValue]="null">Sin lista</option>
                @for (list of priceLists(); track list.id) {
                  <option [ngValue]="list.id">{{ list.name }}</option>
                }
              </select>
            </label>
            <label>Descuento general %<input [(ngModel)]="form.discount" name="discount" type="number" min="0" /></label>
            <label>Condiciones de pago<input [(ngModel)]="form.paymentTerms" name="paymentTerms" required /></label>
            <label>Tiempo de entrega<input [(ngModel)]="form.deliveryTime" name="deliveryTime" required /></label>
            <label>Observaciones<textarea [(ngModel)]="form.notes" name="notes"></textarea></label>

            <div class="card quote-builder">
              <div class="inline-actions builder-row">
                <select [(ngModel)]="selectedProductId" name="selectedProductId">
                  <option [ngValue]="null">Producto o servicio</option>
                  @for (product of products(); track product.id) {
                    <option [ngValue]="product.id">{{ product.name }}</option>
                  }
                </select>
                <input [(ngModel)]="selectedQuantity" name="selectedQuantity" type="number" min="1" placeholder="Cantidad" />
                <input [(ngModel)]="selectedDiscount" name="selectedDiscount" type="number" min="0" placeholder="Desc.%" />
                <button type="button" class="secondary" (click)="addItem()">Agregar item</button>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>Item</th><th>Cantidad</th><th>Desc.</th><th>Subtotal</th><th></th></tr>
                  </thead>
                  <tbody>
                    @for (item of form.items; track item.productId + '-' + item.quantity + '-' + item.discount) {
                      <tr>
                        <td>{{ productName(item.productId) }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.discount }}%</td>
                        <td>{{ currency(itemSubtotal(item)) }}</td>
                        <td><button type="button" class="ghost" (click)="removeItem(item.productId)">Quitar</button></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <label class="inline-actions">
              <input [(ngModel)]="form.sendForApproval" name="sendForApproval" type="checkbox" />
              Enviar a aprobacion al guardar
            </label>

            <div class="inline-actions">
              <button type="submit">Guardar cotizacion</button>
              <button type="button" class="secondary" (click)="reset()">Limpiar</button>
            </div>
          </form>
        </article>

        <article class="card">
          <h3>Resumen</h3>
          <div class="grid">
            <div><strong>Subtotal</strong><p>{{ currency(summary().subtotal) }}</p></div>
            <div><strong>Impuestos</strong><p>{{ currency(summary().taxes) }}</p></div>
            <div><strong>Total</strong><p>{{ currency(summary().total) }}</p></div>
          </div>
        </article>
      </section>

      <section class="card table-wrap">
        <table>
          <thead>
            <tr><th>Numero</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Historial</th></tr>
          </thead>
          <tbody>
            @for (quote of quotes(); track quote.id) {
              <tr>
                <td>{{ quote.number }}</td>
                <td>{{ quote.client }}</td>
                <td><span class="tag" [class.warn]="tone(quote.status) === 'warn'" [class.ok]="tone(quote.status) === 'ok'" [class.info]="tone(quote.status) === 'info'">{{ quote.status }}</span></td>
                <td>{{ currency(quote.total) }}</td>
                <td>{{ quote.statusHistory.length }} eventos</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </section>
  `,
  styles: `
    .quote-builder { padding: 1rem; }
    .builder-row > * { flex: 1 1 180px; }
  `
})
export class QuotesPageComponent implements OnInit {
  private readonly quotesApi = inject(QuotesApiService);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly catalogApi = inject(CatalogApiService);
  private readonly authState = inject(AuthStateService);

  protected readonly clients = signal<Client[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly priceLists = signal<PriceList[]>([]);
  protected readonly quotes = signal<Quote[]>([]);
  protected readonly message = signal('');
  protected readonly error = signal('');

  protected form: QuoteForm = this.createEmptyForm();
  protected selectedProductId: number | null = null;
  protected selectedQuantity = 1;
  protected selectedDiscount = 0;

  protected readonly summary = computed(() => {
    const subtotal = this.form.items.reduce((acc, item) => acc + this.itemSubtotal(item), 0);
    const taxes = this.form.items.reduce((acc, item) => {
      const product = this.products().find(entry => entry.id === item.productId);
      return acc + this.itemSubtotal(item) * ((product?.tax ?? 0) / 100);
    }, 0);
    const discountAmount = subtotal * ((this.form.discount ?? 0) / 100);
    return {
      subtotal,
      taxes,
      total: subtotal - discountAmount + taxes
    };
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.clientsApi.getAll().subscribe({ next: (clients) => this.clients.set(clients) });
    this.catalogApi.getProducts().subscribe({ next: (products) => this.products.set(products) });
    this.catalogApi.getPriceLists().subscribe({ next: (lists) => this.priceLists.set(lists) });
    this.quotesApi.getAll().subscribe({
      next: (quotes) => this.quotes.set(quotes),
      error: () => this.error.set('No fue posible cargar las cotizaciones.')
    });
  }

  protected addItem(): void {
    if (!this.selectedProductId || this.selectedQuantity <= 0) {
      this.error.set('Selecciona un producto y una cantidad valida.');
      return;
    }

    this.form.items = [
      ...this.form.items,
      {
        productId: this.selectedProductId,
        quantity: this.selectedQuantity,
        discount: this.selectedDiscount
      }
    ];

    this.selectedProductId = null;
    this.selectedQuantity = 1;
    this.selectedDiscount = 0;
    this.error.set('');
  }

  protected removeItem(productId: number): void {
    this.form.items = this.form.items.filter(item => item.productId !== productId);
  }

  protected save(): void {
    const payload: CreateQuoteRequest = {
      clientId: Number(this.form.clientId),
      currency: this.form.currency,
      validUntil: this.form.validUntil,
      priceListId: this.form.priceListId,
      discount: Number(this.form.discount),
      paymentTerms: this.form.paymentTerms,
      deliveryTime: this.form.deliveryTime,
      notes: this.form.notes,
      sendForApproval: this.form.sendForApproval,
      items: this.form.items
    };

    this.quotesApi.create(payload).subscribe({
      next: () => {
        this.message.set('Cotizacion creada correctamente.');
        this.error.set('');
        this.reset();
        this.load();
      },
      error: (response) => this.error.set(response.error?.error ?? 'No fue posible crear la cotizacion.')
    });
  }

  protected reset(): void {
    this.form = this.createEmptyForm();
  }

  protected productName(productId: number): string {
    return this.products().find(item => item.id === productId)?.name ?? 'Producto';
  }

  protected itemSubtotal(item: { productId: number; quantity: number; discount: number }): number {
    const product = this.products().find(entry => entry.id === item.productId);
    if (!product) {
      return 0;
    }

    const gross = product.price * item.quantity;
    return gross - gross * (item.discount / 100);
  }

  protected currency(value: number): string {
    return formatCurrency(value);
  }

  protected tone(status: string): string {
    return statusTone(status);
  }

  private createEmptyForm(): QuoteForm {
    return {
      clientId: null,
      currency: 'COP',
      validUntil: '',
      priceListId: null,
      discount: 0,
      paymentTerms: '30 dias',
      deliveryTime: '15 dias habiles',
      notes: '',
      sendForApproval: false,
      items: []
    };
  }
}