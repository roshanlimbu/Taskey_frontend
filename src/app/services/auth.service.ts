import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

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
  // TODO: Create a GitHub OAuth App at https://github.com/settings/developers
  // and replace this with your actual Client ID
  private readonly GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
  private readonly REDIRECT_URI = 'http://localhost:4200/auth/callback';
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private router: Router) {
    // Check for token in URL on callback from GitHub
    this.checkTokenInURL();
  }

  private checkTokenInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      this.setToken(token);
      // Clear the token from the URL to avoid security issues
      window.history.replaceState({}, document.title, window.location.pathname);
      this.router.navigate(['/dashboard']);
    }
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  saveUserData(userData: any) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  getUserData(): any {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  }

  isAuthenticated(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    // If offline and we have user data cached, consider authenticated
    if (!navigator.onLine && this.getUserData()) {
      return of(true);
    }

    return this.http.get<any>(`${this.API_URL}/auth/verify`).pipe(
      map(response => true),
      catchError(() => of(false))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/']);
  }

  loginWithGithub(): Promise<void> {
    if (this.GITHUB_CLIENT_ID === 'YOUR_GITHUB_CLIENT_ID') {
      console.error('GitHub OAuth is not configured. Please create a GitHub OAuth App and replace GITHUB_CLIENT_ID with your actual Client ID.');
      alert('GitHub OAuth is not configured. Please check the console for instructions.');
      return Promise.reject('GitHub OAuth not configured');
    }
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${this.GITHUB_CLIENT_ID}&redirect_uri=${this.REDIRECT_URI}&scope=user:email`;
    window.location.href = githubAuthUrl;
    return Promise.resolve();
  }

  handleGithubCallback(code: string): Observable<GithubAuthResponse> {
    return this.http.post<GithubAuthResponse>(`${this.API_URL}/auth/github`, { code }).pipe(
      tap(response => {
        // Store the token in localStorage or a secure storage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }
}
