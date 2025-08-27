import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService, LoginResponse, SignupResponse } from './api';

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string; // For backward compatibility
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenRefreshTimer: any;

  constructor(private apiService: ApiService) {
    // Check if user is already logged in
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private initializeAuth(): void {
    const savedUser = localStorage.getItem('chaosai_user');
    if (savedUser && this.apiService.hasValidTokens()) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        this.startTokenRefreshTimer();
      } catch (error) {
        console.error('Error parsing saved user:', error);
        this.clearAuthData();
      }
    }
  }

  /**
   * User login with API integration
   */
  login(credentials: LoginCredentials): Observable<User> {
    return this.apiService.login(credentials).pipe(
      map((response: LoginResponse) => {
        const user: User = {
          userId: response.user.userId,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          username: response.user.email.split('@')[0] // For backward compatibility
        };
        
        this.currentUserSubject.next(user);
        this.startTokenRefreshTimer();
        return user;
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * User signup with API integration
   */
  signup(credentials: SignupCredentials): Observable<SignupResponse> {
    return this.apiService.signup(credentials).pipe(
      catchError(error => {
        console.error('Signup error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * User logout with API integration
   */
  logout(): Observable<any> {
    return this.apiService.logout().pipe(
      map(() => {
        this.clearAuthData();
        return true;
      }),
      catchError(error => {
        // Even if API call fails, clear local data
        console.error('Logout error:', error);
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<any> {
    return this.apiService.refreshToken().pipe(
      map(() => {
        this.startTokenRefreshTimer();
        return true;
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null && this.apiService.hasValidTokens();
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.apiService.getAccessToken();
  }

  /**
   * Get ID token
   */
  getIdToken(): string | null {
    return this.apiService.getIdToken();
  }

  /**
   * Start automatic token refresh timer
   */
  private startTokenRefreshTimer(): void {
    // Clear existing timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Refresh token 5 minutes before expiry (assuming 1 hour expiry)
    const refreshInterval = 55 * 60 * 1000; // 55 minutes in milliseconds
    
    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        next: () => console.log('Token refreshed successfully'),
        error: (error) => console.error('Auto token refresh failed:', error)
      });
    }, refreshInterval);
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    this.currentUserSubject.next(null);
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }
}