import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogApiService } from '../core/catalog-api.service';
import { PriceList, Product } from '../core/models';
import { formatCurrency } from '../core/formatters';

type ProductForm = Omit<Product, 'id'>;

@Component({
  selector: 'app-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="eyebrow">Vista dedicada</p>
          <h2>Catalogo y listas de precios</h2>
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
          <h3>Nuevo producto o servicio</h3>
          <form class="grid" (ngSubmit)="createProduct()">
            <label>Codigo<input [(ngModel)]="form.code" name="code" required /></label>
            <label>Nombre<input [(ngModel)]="form.name" name="name" required /></label>
            <label>Descripcion<textarea [(ngModel)]="form.description" name="description"></textarea></label>
            <label>Precio<input [(ngModel)]="form.price" name="price" type="number" min="1" required /></label>
            <label>Impuesto %<input [(ngModel)]="form.tax" name="tax" type="number" min="0" required /></label>
            <label>Tipo
              <select [(ngModel)]="form.type" name="type">
                <option value="Producto">Producto</option>
                <option value="Servicio">Servicio</option>
              </select>
            </label>
            <label>Estado
              <select [(ngModel)]="form.status" name="status">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
            <button type="submit">Agregar al catalogo</button>
          </form>
        </article>

        <article class="card table-wrap">
          <h3>Listas de precios</h3>
          <table>
            <thead>
              <tr><th>Lista</th><th>Segmento</th><th>Descuento max.</th></tr>
            </thead>
            <tbody>
              @for (list of priceLists(); track list.id) {
                <tr>
                  <td>{{ list.name }}</td>
                  <td>{{ list.segment }}</td>
                  <td>{{ list.maxDiscount }}%</td>
                </tr>
              }
            </tbody>
          </table>
        </article>
      </section>

      <section class="card table-wrap">
        <table>
          <thead>
            <tr><th>Codigo</th><th>Nombre</th><th>Tipo</th><th>Precio</th><th>Impuesto</th></tr>
          </thead>
          <tbody>
            @for (product of products(); track product.id) {
              <tr>
                <td>{{ product.code }}</td>
                <td>{{ product.name }}<br /><small>{{ product.description }}</small></td>
                <td>{{ product.type }}</td>
                <td>{{ currency(product.price) }}</td>
                <td>{{ product.tax }}%</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    </section>
  `
})
export class CatalogPageComponent implements OnInit {
  private readonly catalogApi = inject(CatalogApiService);

  protected readonly products = signal<Product[]>([]);
  protected readonly priceLists = signal<PriceList[]>([]);
  protected readonly message = signal('');
  protected readonly error = signal('');

  protected form: ProductForm = {
    code: '',
    name: '',
    description: '',
    price: 0,
    tax: 19,
    type: 'Producto',
    status: 'activo'
  };

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.catalogApi.getProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => this.error.set('No fue posible cargar el catalogo.')
    });

    this.catalogApi.getPriceLists().subscribe({
      next: (lists) => this.priceLists.set(lists),
      error: () => this.error.set('No fue posible cargar las listas de precios.')
    });
  }

  protected createProduct(): void {
    this.catalogApi.createProduct(this.form).subscribe({
      next: () => {
        this.message.set('Producto agregado al catalogo.');
        this.error.set('');
        this.form = { ...this.form, code: '', name: '', description: '', price: 0 };
        this.load();
      },
      error: (response) => this.error.set(response.error?.error ?? 'No fue posible crear el producto.')
    });
  }

  protected currency(value: number): string {
    return formatCurrency(value);
  }
}