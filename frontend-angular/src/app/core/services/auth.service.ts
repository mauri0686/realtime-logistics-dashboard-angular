import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'shiptrack.token';
const USER_KEY = 'shiptrack.user';

/**
 * Holds auth state with signals (synchronous, no subscription to leak) and talks to the API.
 * The token is the single source of truth the interceptor and guard read from.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  // Private writable signals; expose read-only views so state can only change through this service.
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly _username = signal<string | null>(localStorage.getItem(USER_KEY));

  readonly username = this._username.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  /** Read directly by the functional interceptor (no subscription needed). */
  get token(): string | null {
    return this._token();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/api/auth/login`, credentials)
      .pipe(tap((res) => this.setSession(res)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._token.set(null);
    this._username.set(null);
  }

  private setSession(res: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, res.username);
    this._token.set(res.token);
    this._username.set(res.username);
  }
}
