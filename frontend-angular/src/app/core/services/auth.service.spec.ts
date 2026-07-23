import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify(); // no stray/unflushed requests — catches leaked HTTP calls in tests
    localStorage.clear();
  });

  it('starts unauthenticated when storage is empty', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token).toBeNull();
  });

  it('login() POSTs credentials and stores the session', () => {
    service.login({ username: 'ops', password: 'x' }).subscribe();

    const req = http.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'jwt-abc', username: 'ops', expiresAt: new Date().toISOString() });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token).toBe('jwt-abc');
    expect(service.username()).toBe('ops');
    expect(localStorage.getItem('shiptrack.token')).toBe('jwt-abc');
  });

  it('logout() clears state and storage', () => {
    service.login({ username: 'ops', password: 'x' }).subscribe();
    http.expectOne(`${environment.apiBaseUrl}/api/auth/login`)
      .flush({ token: 'jwt-abc', username: 'ops', expiresAt: new Date().toISOString() });

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token).toBeNull();
    expect(localStorage.getItem('shiptrack.token')).toBeNull();
  });
});
