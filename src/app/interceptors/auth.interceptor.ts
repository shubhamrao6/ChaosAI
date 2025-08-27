import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { ApiService } from '../services/api';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private apiService: ApiService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add auth header if token exists and request is not for auth endpoints
    const token = this.apiService.getAccessToken();
    const isAuthRequest = this.isAuthRequest(request.url);
    
    if (token && !isAuthRequest) {
      request = this.addTokenHeader(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRequest) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Add authorization header to request
   */
  private addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  /**
   * Check if request is for authentication endpoints
   */
  private isAuthRequest(url: string): boolean {
    return url.includes('/auth/login') || 
           url.includes('/auth/signup') || 
           url.includes('/auth/refresh') ||
           url.includes('/health');
  }

  /**
   * Handle 401 errors by attempting token refresh
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.apiService.getRefreshToken();
      if (refreshToken) {
        return this.apiService.refreshToken().pipe(
          switchMap(() => {
            this.isRefreshing = false;
            const newToken = this.apiService.getAccessToken();
            this.refreshTokenSubject.next(newToken);
            
            if (newToken) {
              return next.handle(this.addTokenHeader(request, newToken));
            }
            return throwError(() => new Error('Token refresh failed'));
          }),
          catchError(error => {
            this.isRefreshing = false;
            // Clear tokens and redirect to login will be handled by auth service
            return throwError(() => error);
          })
        );
      }
    }

    // If already refreshing, wait for the refresh to complete
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next.handle(this.addTokenHeader(request, token)))
    );
  }
}