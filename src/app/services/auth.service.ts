import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { tap, filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BehaviorSubject } from 'rxjs';

interface GithubAuthResponse {
  token: string;
  user: {
    id: number;
    login: string;
    avatar_url: string;
    email: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly GITHUB_CLIENT_ID = environment.githubClientId;
  private readonly REDIRECT_URI = environment.redirectUri;
  private readonly API_URL = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<any>(null);
  private isHandlingCallback = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.initializeAuth();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  }

  initializeAuth(): void {
    // Check if we're on the callback URL
    if (window.location.href.includes('code=') && !this.isHandlingCallback) {
      this.isHandlingCallback = true;
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      if (code && state) {
        this.handleGithubCallback(code, state).subscribe();
      }
    } else {
      // Check if user is already authenticated
      const token = localStorage.getItem('token');
      if (token) {
        this.checkAuthStatus().subscribe();
      }
    }

    // Listen for route changes
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (
          window.location.href.includes('code=') &&
          !this.isHandlingCallback
        ) {
          this.isHandlingCallback = true;
          const urlParams = new URLSearchParams(window.location.search);
          const code = urlParams.get('code');
          const state = urlParams.get('state');
          if (code && state) {
            this.handleGithubCallback(code, state).subscribe();
          }
        }
      });
  }

  handleGithubCallback(code: string, state: string): Observable<any> {
    return this.http
      .get(`${this.API_URL}/auth/github/callback`, {
        params: { code, state },
        withCredentials: true,
      })
      .pipe(
        tap((response: any) => {
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

  private handleAuthSuccess(response: any): void {
    if (response.token) {
      localStorage.setItem('token', response.token);
      this.isAuthenticatedSubject.next(true);
      this.userSubject.next(response.user);
      this.isHandlingCallback = false;

      // Add a small delay to ensure the guard picks up the new state
      setTimeout(() => {
        if (response.user && response.user.is_super_admin === 1) {
          console.log('User is super admin, redirecting to dashboard');
          this.router.navigate(['/dashboard']);
        } else {
          console.log('User is not super admin, redirecting to home');
          this.router.navigate(['/']);
        }
      }, 500); // 100ms delay
    } else {
      this.handleAuthError(new Error('No token received'));
    }
  }

  private handleAuthError(error: any): void {
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    localStorage.removeItem('token');

    let errorMessage = 'Authentication failed';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    }

    // Navigate to error page with message
    this.router.navigate(['/error'], {
      queryParams: { message: errorMessage },
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
    this.router.navigate(['/login']);
  }

  checkAuthStatus(): Observable<any> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.isAuthenticatedSubject.next(false);
      this.userSubject.next(null);
      return throwError(() => new Error('No token found'));
    }

    return this.http
      .get(`${this.API_URL}/user`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
        withCredentials: true,
      })
      .pipe(
        tap((response: any) => {
          this.isAuthenticatedSubject.next(true);
          this.userSubject.next(response.user);
        }),
        catchError((error) => {
          this.isAuthenticatedSubject.next(false);
          this.userSubject.next(null);
          localStorage.removeItem('token');
          return throwError(() => error);
        })
      );
  }

  isAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  getUser(): Observable<any> {
    return this.userSubject.asObservable();
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.isAuthenticatedSubject.next(true);
  }
}
