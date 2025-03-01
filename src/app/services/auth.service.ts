import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  checkAuthStatus(): void {
    if (!this.isAuthenticated()) {
      this.currentUserSubject.next(null);
      return;
    }

    this.getUserProfile().subscribe();
  }

  getUserProfile(): Observable<User | null> {
    return this.http.get<User>(`${this.apiUrl}/user`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
        }),
        catchError(error => {
          console.error('Error fetching user profile', error);
          this.logout();
          return of(null);
        })
      );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.checkAuthStatus();
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.currentUserSubject.next(null);
  }

  validateToken(): Observable<boolean> {
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/validate-token`)
      .pipe(
        map(response => true),
        catchError(() => {
          this.logout();
          return of(false);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  loginWithGitHub(): void {
    window.location.href = 'http://localhost:8000/auth/github';
  }
}
