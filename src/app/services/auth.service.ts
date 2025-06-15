import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8000';
  private tokenKey = 'auth_token';
  private roleKey = 'user_role';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  loginWithGithub(): void {
    console.log('hello');
    window.location.href = 'http://localhost:8000/auth/github/redirect';
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  setRole(role: number): void {
    localStorage.setItem(this.roleKey, role.toString());
  }

  getRole(): number | null {
    const role = localStorage.getItem(this.roleKey);
    return role ? parseInt(role, 10) : null;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this.router.navigate(['/']);
  }
}
