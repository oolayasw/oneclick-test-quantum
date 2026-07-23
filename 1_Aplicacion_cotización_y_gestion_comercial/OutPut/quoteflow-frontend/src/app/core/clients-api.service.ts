import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiBaseService } from './api-base.service';
import { Client, ClientDetail } from './models';

@Injectable({ providedIn: 'root' })
export class ClientsApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiBaseService);

  getAll(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.api.baseUrl}/clientes`, { headers: this.api.createHeaders() });
  }

  getDetail(id: number): Observable<ClientDetail> {
    return this.http.get<ClientDetail>(`${this.api.baseUrl}/clientes/${id}`, { headers: this.api.createHeaders() });
  }

  create(payload: Omit<Client, 'id' | 'totalQuoted'>): Observable<Client> {
    return this.http.post<Client>(`${this.api.baseUrl}/clientes`, payload, { headers: this.api.createHeaders() });
  }

  update(id: number, payload: Omit<Client, 'id' | 'totalQuoted'>): Observable<Client> {
    return this.http.put<Client>(`${this.api.baseUrl}/clientes/${id}`, payload, { headers: this.api.createHeaders() });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api.baseUrl}/clientes/${id}`, { headers: this.api.createHeaders() });
  }
}