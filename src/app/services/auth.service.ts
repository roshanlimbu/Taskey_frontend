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
      this.handleGithubCallback();
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
          this.handleGithubCallback();
        }
      });
  }

  private handleGithubCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      this.http
        .get(`${this.API_URL}/auth/github/callback`, {
          params: { code, state },
          withCredentials: true,
        })
        .pipe(
          tap((response: any) => {
            this.handleAuthSuccess(response);
            // Clear URL parameters
            this.router.navigate(['/'], {
              replaceUrl: true,
            });
          }),
          catchError((error) => {
            console.error('GitHub callback error:', error);
            this.isHandlingCallback = false;
            this.handleAuthError(error);
            return throwError(() => error);
          })
        )
        .subscribe();
    }
  }

  private handleAuthSuccess(response: any): void {
    this.isAuthenticatedSubject.next(true);
    this.userSubject.next(response.user);
    localStorage.setItem('token', response.token);
    this.isHandlingCallback = false;
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
    return this.http
      .get(`${this.API_URL}/user`, {
        headers: this.getAuthHeaders(),
        withCredentials: true,
      })
      .pipe(
        tap((user) => {
          this.isAuthenticatedSubject.next(true);
          this.userSubject.next(user);
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
