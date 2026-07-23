import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const run = (url: string) =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => localStorage.clear());

  it('redirects anonymous users to /login preserving returnUrl', () => {
    const result = run('/dashboard');

    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(tree.queryParams['returnUrl']).toBe('/dashboard');
    expect(tree.root.children['primary'].segments.map((s) => s.path)).toEqual(['login']);
  });

  it('allows authenticated users through', () => {
    localStorage.setItem('shiptrack.token', 'jwt-abc');
    // AuthService reads storage at construction time — instantiate after seeding it.
    TestBed.inject(AuthService);

    expect(run('/dashboard')).toBeTrue();
  });
});
