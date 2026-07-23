import { Injectable, computed, signal } from '@angular/core';

import { SessionUser } from './models';

const STORAGE_KEY = 'quoteflow.session';

interface StoredSession {
  token: string;
  user: SessionUser;
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly storedSession = signal<StoredSession | null>(this.readSession());

  readonly session = computed(() => this.storedSession()?.user ?? null);
  readonly token = computed(() => this.storedSession()?.token ?? null);

  isAuthenticated(): boolean {
    return !!this.storedSession();
  }

  hasAnyRole(roles: string[]): boolean {
    const current = this.session();
    return !!current && roles.includes(current.role);
  }

  setSession(token: string, user: SessionUser): void {
    const session = { token, user };
    this.storedSession.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  logout(): void {
    this.storedSession.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private readSession(): StoredSession | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as StoredSession;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}