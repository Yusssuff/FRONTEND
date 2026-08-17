import {
  Injectable,
  Inject,
  PLATFORM_ID,
} from '@angular/core';

import {
  isPlatformBrowser,
} from '@angular/common';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
  tap,
} from 'rxjs';

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
  providedIn: 'root',
})
export class AuthService {

  private readonly apiUrl =
    'http://localhost:5113/api/Account';

  private readonly tokenKey =
    'jwt_token';

  private readonly expirationKey =
    'token_expiration';

  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,

    @Inject(PLATFORM_ID)
    platformId: object,
  ) {
    this.isBrowser =
      isPlatformBrowser(platformId);
  }

  // =========================================================
  // LOGIN
  // =========================================================

  login(
    credentials: LoginRequest,
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        this.apiUrl,
        credentials,
      )
      .pipe(

        tap((response) => {

          if (!this.isBrowser) {
            return;
          }

          if (
            response &&
            response.token
          ) {

            localStorage.setItem(
              this.tokenKey,
              response.token,
            );

            localStorage.setItem(
              this.expirationKey,
              response.expiration,
            );
          }

        }),
      );
  }

  // =========================================================
  // REGISTER
  // =========================================================

  register(
    user: RegisterRequest,
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/Register`,
      user,
    );
  }

  // =========================================================
  // GET TOKEN
  // =========================================================

  getToken(): string | null {

    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(
      this.tokenKey,
    );
  }

  // =========================================================
  // GET ROLE
  // =========================================================

  getRole(): string | null {

    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {

      const parts = token.split('.');

      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        this.decodeBase64Url(parts[1]),
      );

      /*
       * ASP.NET Core can store the role under:
       *
       * role
       *
       * roles
       *
       * http://schemas.microsoft.com/ws/2008/06/identity/claims/role
       */

      const roleClaim =
        payload[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ] ??
        payload['role'] ??
        payload['roles'];

      if (Array.isArray(roleClaim)) {
        return roleClaim[0] ?? null;
      }

      if (typeof roleClaim === 'string') {
        return roleClaim;
      }

      return null;

    } catch {
      return null;
    }
  }

  // =========================================================
  // BASE64 URL DECODE
  // =========================================================

  private decodeBase64Url(
    value: string,
  ): string {

    let base64 = value
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    while (base64.length % 4) {
      base64 += '=';
    }

    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(
          (char) =>
            '%' +
            (
              '00' +
              char.charCodeAt(0)
                .toString(16)
            ).slice(-2),
        )
        .join(''),
    );
  }

  // =========================================================
  // IS ADMIN
  // =========================================================

  isAdmin(): boolean {

    const role = this.getRole();

    return role?.toLowerCase() === 'admin';
  }

  // =========================================================
  // IS USER
  // =========================================================

  isUser(): boolean {

    const role = this.getRole();

    return role?.toLowerCase() === 'user';
  }

  // =========================================================
  // CHECK LOGIN
  // =========================================================

  isLoggedIn(): boolean {

    if (!this.isBrowser) {
      return false;
    }

    const token = this.getToken();

    if (!token) {
      return false;
    }

    const expiration =
      localStorage.getItem(
        this.expirationKey,
      );

    if (expiration) {

      const expirationTime =
        new Date(expiration).getTime();

      if (
        !Number.isNaN(expirationTime) &&
        expirationTime <= Date.now()
      ) {

        this.logout();

        return false;
      }
    }

    return true;
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {

    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(
      this.tokenKey,
    );

    localStorage.removeItem(
      this.expirationKey,
    );
  }
}
