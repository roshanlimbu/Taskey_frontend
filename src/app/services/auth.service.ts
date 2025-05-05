import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import {
  catchError,
  map,
  Observable,
  throwError,
  BehaviorSubject,
  of,
} from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { tap, shareReplay, filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface GithubAuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    github_id: string;
    created_at: string;
    updated_at: string;
    is_super_admin: number;
  };
  authenticated: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly GITHUB_CLIENT_ID = environment.githubClientId;
  private readonly REDIRECT_URI = environment.redirectUri;
  private readonly API_URL = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean | null>(null);
  private userSubject = new BehaviorSubject<any>(null);
  private isHandlingCallback = false;
  private authStatusCheck: Observable<any> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {
    const token = localStorage.getItem('token');
    if (token) {
      this.checkAuthStatus().subscribe({
        next: () => this.isAuthenticatedSubject.next(true),
        error: (err) => {
          console.error('Initial check auth status failed:', err);
          this.isAuthenticatedSubject.next(false);
          this.router.navigate(['/login']);
        },
      });
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('Using token in headers:', token); // Debug token
    return new HttpHeaders({
      Authorization: `Bearer ${token || 'github-auth-dummy'}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  }

  handleGithubCallback(code: string, state: string): Observable<any> {
    const url = `${this.API_URL}/auth/github/callback`;
    const params = { code, state };
    console.log('Making request to:', url, 'with params:', params);
    return this.http
      .get(url, {
        params,
        withCredentials: true,
      })
      .pipe(
        tap((response: any) => {
          console.log('Callback response:', response);
          this.handleAuthSuccess(response);
        }),
        catchError((error) => {
          console.error('GitHub callback error:', error);
          this.isHandlingCallback = false;
          this.handleAuthError(error);
          return throwError(() => error);
        })
      );
  }

  private handleAuthSuccess(
    response: GithubAuthResponse & { token?: string }
  ): void {
    if ((response.authenticated && response.user) || response.token) {
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      this.isAuthenticatedSubject.next(true);
      this.userSubject.next(response.user);
      this.isHandlingCallback = false;
      this.authStatusCheck = null;

      setTimeout(() => {
        this.ngZone.run(() => {
          console.log(
            'Navigating based on is_super_admin:',
            response.user.is_super_admin
          );
          if (response.user.is_super_admin === 1) {
            this.router.navigateByUrl('/dashboard');
          } else {
            this.router.navigateByUrl('/');
          }
        });
      }, 1000); // Increased to 300ms for better state propagation
    } else {
      this.handleAuthError(new Error('Invalid response'));
    }
  }

  public handleAuthError(error: any): void {
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    localStorage.removeItem('token');
    this.authStatusCheck = null;

    let errorMessage = 'Authentication failed';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    }

    this.ngZone.run(() => {
      this.router.navigate(['/error'], {
        queryParams: { message: errorMessage },
      });
    });
  }

  loginWithGithub(): void {
    this.http
      .get(`${this.API_URL}/auth/github/authorize`, { withCredentials: true })
      .pipe(
        catchError((error) => {
          console.error('GitHub redirect error:', error);
          this.handleAuthError(error);
          return throwError(() => error);
        })
      )
      .subscribe((response: any) => {
        if (response.url) {
          window.location.href = response.url;
        }
      });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    this.authStatusCheck = null;
    this.router.navigate(['/login']);
  }

  checkAuthStatus(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.isAuthenticatedSubject.next(false);
      this.userSubject.next(null);
      this.authStatusCheck = null;
      return throwError(() => new Error('No token found'));
    }

    if (this.authStatusCheck) {
      return this.authStatusCheck;
    }

    this.authStatusCheck = this.http
      .get(`${this.API_URL}/user`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap((response: any) => {
          console.log('checkAuthStatus response:', response);
          this.isAuthenticatedSubject.next(true);
          this.userSubject.next(response.user || response);
        }),
        catchError((error) => {
          console.error('checkAuthStatus error:', error);
          this.isAuthenticatedSubject.next(false);
          this.userSubject.next(null);
          localStorage.removeItem('token');
          this.authStatusCheck = null;
          return throwError(() => error);
        }),
        shareReplay(1)
      );

    return this.authStatusCheck;
  }

  isAuthenticated(): Observable<boolean | null> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getUser(): Observable<any> {
    return this.userSubject.asObservable();
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isAuthenticatedSubject.next(true);
    this.authStatusCheck = null;
  }
}
