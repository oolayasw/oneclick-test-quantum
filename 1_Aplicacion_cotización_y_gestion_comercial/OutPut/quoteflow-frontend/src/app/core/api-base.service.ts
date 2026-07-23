import { HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class ApiBaseService {
  private readonly authState = inject(AuthStateService);

  readonly baseUrl = 'http://localhost:3000/api';

  createHeaders(): HttpHeaders {
    const token = this.authState.token();
    return token ? new HttpHeaders({ Authorization: token }) : new HttpHeaders();
  }
}