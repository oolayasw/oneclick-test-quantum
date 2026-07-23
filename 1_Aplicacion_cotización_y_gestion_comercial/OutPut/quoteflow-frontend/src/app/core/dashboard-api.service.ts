import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiBaseService } from './api-base.service';
import { DashboardMetrics } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiBaseService);

  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.api.baseUrl}/dashboard`, {
      headers: this.api.createHeaders()
    });
  }
}