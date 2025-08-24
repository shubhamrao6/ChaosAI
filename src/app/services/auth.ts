import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Fake user database
  private users: User[] = [
    { id: '1', email: 'admin@chaosai.com', username: 'admin' },
    { id: '2', email: 'hacker@chaosai.com', username: 'hacker' }
  ];

  constructor() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('chaosai_user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    // Simulate API call delay
    return new Observable(observer => {
      setTimeout(() => {
        // Fake authentication - accept any email/password combination
        const user = this.users.find(u => u.email === credentials.email) || {
          id: Date.now().toString(),
          email: credentials.email,
          username: credentials.email.split('@')[0]
        };

        localStorage.setItem('chaosai_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        observer.next(user);
        observer.complete();
      }, 1000);
    });
  }

  signup(credentials: SignupCredentials): Observable<User> {
    // Simulate API call delay
    return new Observable(observer => {
      setTimeout(() => {
        // Check if user already exists
        const existingUser = this.users.find(u => u.email === credentials.email);
        if (existingUser) {
          observer.error({ message: 'User already exists' });
          return;
        }

        const newUser: User = {
          id: Date.now().toString(),
          email: credentials.email,
          username: credentials.username
        };

        this.users.push(newUser);
        localStorage.setItem('chaosai_user', JSON.stringify(newUser));
        this.currentUserSubject.next(newUser);
        observer.next(newUser);
        observer.complete();
      }, 1000);
    });
  }

  logout(): void {
    localStorage.removeItem('chaosai_user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}