import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiBaseService } from './api-base.service';
import { CreateQuoteRequest, Quote } from './models';

@Injectable({ providedIn: 'root' })
export class QuotesApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiBaseService);

  getAll(): Observable<Quote[]> {
    return this.http.get<Quote[]>(`${this.api.baseUrl}/cotizaciones`, { headers: this.api.createHeaders() });
  }

  create(payload: CreateQuoteRequest): Observable<Quote> {
    return this.http.post<Quote>(`${this.api.baseUrl}/cotizaciones`, payload, { headers: this.api.createHeaders() });
  }

  updateStatus(id: number, status: string, comment: string, userName: string): Observable<Quote> {
    return this.http.put<Quote>(`${this.api.baseUrl}/cotizaciones/${id}/estado`, {
      status,
      comment,
      userName
    }, { headers: this.api.createHeaders() });
  }
}