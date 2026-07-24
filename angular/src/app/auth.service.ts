import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  access: string;
  refresh: string;
  user: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  //  private apiUrl = 'https://dbl.iihs.in/api/auth';
  private apiUrl = 'http://127.0.0.1:8000/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserFromStorage();
  }

  public getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh/`, {
      refresh: this.getRefreshToken()
    }, { headers: this.getAuthHeaders() }).pipe(
      tap((tokens: any) => {
        this.storeTokens(tokens);
      }),
      catchError((error) => {
        this.logout();
        return throwError(error);
      })
    );
  }

  get currentUser$(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  private loadUserFromStorage(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  signup(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup/`, userData).pipe(
      tap(response => {
        this.storeAuthData(response);
        this.router.navigate(['/login']);
      })
    );
  }

  login(credentials: { Username: string, Password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(response => {
        this.storeAuthData(response);
        //this.router.navigate(['/home']);
      })
    );
  }

  private storeAuthData(response: AuthResponse): void {
    localStorage.setItem('access_token', response.access);
    localStorage.setItem('refresh_token', response.refresh);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private storeTokens(tokens: any): void {
    localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/profile/`, profileData, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }
}