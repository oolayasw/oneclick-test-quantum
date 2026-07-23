import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiBaseService } from './api-base.service';
import { PriceList, Product } from './models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiBaseService);

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api.baseUrl}/productos`, { headers: this.api.createHeaders() });
  }

  createProduct(payload: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(`${this.api.baseUrl}/productos`, payload, { headers: this.api.createHeaders() });
  }

  getPriceLists(): Observable<PriceList[]> {
    return this.http.get<PriceList[]>(`${this.api.baseUrl}/listas-precios`, { headers: this.api.createHeaders() });
  }
}