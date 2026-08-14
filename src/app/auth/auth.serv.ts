import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  name: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiration: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:5113/api/Account';

  private readonly tokenKey = 'jwt_token';

  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor(
    private http: HttpClient
  ) {}

  // LOGIN

  login(credentials: LoginRequest): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      this.apiUrl,
      credentials
    ).pipe(

      tap(response => {

        // localStorage is available only in the browser
        if (this.isBrowser) {

          localStorage.setItem(
            this.tokenKey,
            response.token
          );

          localStorage.setItem(
            'token_expiration',
            response.expiration
          );
        }

      })

    );
  }

  // REGISTER

  register(user: RegisterRequest): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/Register`,
      user
    );

  }

  // GET TOKEN


  getToken(): string | null {

    // SSR/server has no localStorage
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  // CHECK LOGIN

  isLoggedIn(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    return true;
  }

  // LOGOUT

  logout(): void {

    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('token_expiration');

  }

}
