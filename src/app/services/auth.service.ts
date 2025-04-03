import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/user';
  private tokenKey = 'github_token';
  private userKey = 'user_data';

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
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  saveUserData(userData: any) {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  getUserData(): any {
    const data = localStorage.getItem(this.userKey);
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

    return this.http
      .get<any>(this.apiUrl, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.authenticated === true) {
            // Save user data for offline use
            this.saveUserData(response);
            return true;
          }
          return false;
        }),
        catchError((error) => of(false)),
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/']);
  }

  loginWithGithub() {
    window.location.href = 'http://localhost:8000/auth/github';
  }
}
