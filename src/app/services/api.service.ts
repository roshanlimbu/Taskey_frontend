import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export interface customHttpError {
  reason: string;
  error_type: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseURL: string;
  public baseURL_wo: string;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
  ) {
    const currentURL = window.location.hostname;
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      this.baseURL_wo = 'http://localhost:8000';
    } else {
      this.baseURL_wo = `https://api.${window.location.hostname}`;
    }
    this.baseURL = `${this.baseURL_wo}/api`;
  }

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn(
        `[${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })}] No token available for request`,
      );
    }
    return { headers };
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http
      .get<T>(`${this.baseURL}/${endpoint}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Generic POST request
  post<T>(endpoint: string, data?: any): Observable<T> {
    return this.http
      .post<T>(`${this.baseURL}/${endpoint}`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Generic PUT request
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .put<T>(`${this.baseURL}/${endpoint}`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  fullGet<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${endpoint}`).pipe(catchError(this.handleError));
  }

  fullPost<T>(endpoint: string, data: any): Observable<T> {
    return this.http
      .post<T>(`${endpoint}`, data, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Generic DELETE request
  delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseURL}/${endpoint}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    const customError: customHttpError = {
      reason: 'An error occurred',
      error_type: 'Unknown Error',
    };

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      customError.reason = `Client-side Error: ${error.error.message}`;
      customError.error_type = 'Client Error';
    } else {
      // Server-side error
      console.log(error.status, 'error status');

      switch (error.status) {
        case 0:
          customError.error_type = 'connection_refused';
          customError.reason = 'The server is not responding.';
          break;
        case 404:
          customError.error_type = 'url_not_found';
          customError.reason = 'The requested resource could not be found.';
          break;
        case 401:
          customError.error_type = 'not_authenticated';
          customError.reason =
            'Authentication is required to access this resource.';
          break;
        case 403:
          customError.error_type = 'access_denied';
          customError.reason =
            'You do not have permission to access this resource.';
          break;
        case 500:
          customError.error_type = 'internal_server_error';
          customError.reason =
            'The server encountered an unexpected condition.';
          break;
        case 419:
          customError.error_type = 'csrf_token_mismatch';
          customError.reason = 'CSRF token mismatch. Please refresh the page.';
          console.log('Navigating to login due to CSRF token mismatch');
          this.router.navigate(['/login']);
          break;

        case 504:
          customError.error_type = 'gateway_timeout';
          customError.reason = 'The server took too long to respond.';
          break;

        // Add more cases as needed
        default:
          customError.error_type = 'unknown_error';
          customError.reason = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    console.error(
      `Error Type: ${customError.error_type}\nReason: ${customError.reason}`,
    );
    return throwError(() => customError);
  }
}
