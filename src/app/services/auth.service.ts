import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/user';
  private tokenKey = 'github_token';

  constructor(private http: HttpClient) {}
  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }
    return this.http
      .get<any>(this.apiUrl, {
        withCredentials: true,
      })
      .pipe(
        map((response) => response.authenticated === true),
        catchError((error) => of(false)),
      );
  }
  logout() {
    localStorage.removeItem(this.tokenKey);
  }
}
