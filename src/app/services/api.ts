import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { getApiConfig } from '../config/api.config';

// API Response interfaces
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export interface LoginResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface SignupResponse {
  message: string;
  userId: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly config = getApiConfig();
  private readonly baseUrl = this.config.BASE_URL;
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load saved token on service initialization
    const savedToken = localStorage.getItem('chaosai_access_token');
    if (savedToken) {
      this.tokenSubject.next(savedToken);
    }
  }

  /**
   * Health check endpoint - no authentication required
   */
  healthCheck(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}${this.config.ENDPOINTS.HEALTH}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * User registration endpoint
   */
  signup(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.baseUrl}${this.config.ENDPOINTS.AUTH.SIGNUP}`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * User login endpoint
   */
  login(credentials: {
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}${this.config.ENDPOINTS.AUTH.LOGIN}`, credentials)
      .pipe(
        tap(response => {
          // Save tokens to localStorage and update token subject
          this.saveTokens(response);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Refresh token endpoint
   */
  refreshToken(): Observable<TokenRefreshResponse> {
    const refreshToken = localStorage.getItem('chaosai_refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<TokenRefreshResponse>(`${this.baseUrl}${this.config.ENDPOINTS.AUTH.REFRESH}`, {
      refreshToken
    }).pipe(
      tap(response => {
        // Update access token
        localStorage.setItem('chaosai_access_token', response.accessToken);
        localStorage.setItem('chaosai_id_token', response.idToken);
        this.tokenSubject.next(response.accessToken);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Logout endpoint
   */
  logout(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.baseUrl}${this.config.ENDPOINTS.AUTH.LOGOUT}`, {}, { headers })
      .pipe(
        tap(() => {
          // Clear all stored tokens
          this.clearTokens();
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('chaosai_access_token');
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('chaosai_refresh_token');
  }

  /**
   * Get current ID token
   */
  getIdToken(): string | null {
    return localStorage.getItem('chaosai_id_token');
  }

  /**
   * Check if user has valid tokens
   */
  hasValidTokens(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }

  /**
   * Get authorization headers for authenticated requests
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Save authentication tokens to localStorage
   */
  private saveTokens(loginResponse: LoginResponse): void {
    localStorage.setItem('chaosai_access_token', loginResponse.accessToken);
    localStorage.setItem('chaosai_id_token', loginResponse.idToken);
    localStorage.setItem('chaosai_refresh_token', loginResponse.refreshToken);
    localStorage.setItem('chaosai_user', JSON.stringify(loginResponse.user));
    
    // Update token subject
    this.tokenSubject.next(loginResponse.accessToken);
  }

  /**
   * Clear all authentication tokens
   */
  private clearTokens(): void {
    localStorage.removeItem('chaosai_access_token');
    localStorage.removeItem('chaosai_id_token');
    localStorage.removeItem('chaosai_refresh_token');
    localStorage.removeItem('chaosai_user');
    
    // Update token subject
    this.tokenSubject.next(null);
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Invalid credentials or session expired';
        this.clearTokens(); // Clear tokens on 401
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Bad request';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}