import {
  Inject,
  Injectable,
  PLATFORM_ID
} from '@angular/core';

import { isPlatformBrowser } from '@angular/common';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';


interface LoginResponse {

  token: string;

  expiration?: string;

}


interface JwtPayload {

  sub?: string;

  name?: string;

  role?: string | string[];

  exp?: number;

  [key: string]: any;

}


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl =
    'http://localhost:5113/api/Account';

  private readonly tokenKey =
    'jwt_token';


  constructor(
    private http: HttpClient,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {}


  // =========================================================
  // LOGIN
  // =========================================================

  login(data: {
    name: string;
    password: string;
  }): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        this.apiUrl,
        data
      )
      .pipe(

        tap(response => {

          if (
            response &&
            response.token
          ) {

            this.setToken(
              response.token
            );

          }

        })

      );

  }


  // =========================================================
  // REGISTER
  // =========================================================

  register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/Register`,
      data,
      {
        responseType: 'text'
      }
    );

  }


  // =========================================================
  // SAVE TOKEN
  // =========================================================

  private setToken(
    token: string
  ): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;

    }

    localStorage.setItem(
      this.tokenKey,
      token
    );

  }


  // =========================================================
  // GET TOKEN
  // =========================================================

  getToken(): string | null {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return null;

    }

    return localStorage.getItem(
      this.tokenKey
    );

  }


  // =========================================================
  // LOGOUT
  // =========================================================

  logout(): void {

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;

    }

    localStorage.removeItem(
      this.tokenKey
    );

  }


  // =========================================================
  // CHECK LOGIN
  // =========================================================

  isLoggedIn(): boolean {

    const token =
      this.getToken();

    if (!token) {

      return false;

    }

    const payload =
      this.decodeToken(token);

    if (!payload) {

      this.logout();

      return false;

    }


    // Check JWT expiration.

    if (
      payload.exp &&
      payload.exp * 1000 <= Date.now()
    ) {

      this.logout();

      return false;

    }

    return true;

  }


  // =========================================================
  // GET JWT PAYLOAD
  // =========================================================

  private decodeToken(
    token: string
  ): JwtPayload | null {

    try {

      const parts =
        token.split('.');

      if (
        parts.length !== 3
      ) {

        return null;

      }


      const base64Url =
        parts[1];

      const base64 =
        base64Url
          .replace(/-/g, '+')
          .replace(/_/g, '/');


      const jsonPayload =
        decodeURIComponent(

          atob(base64)
            .split('')
            .map(
              character =>
                '%' +
                (
                  '00' +
                  character
                    .charCodeAt(0)
                    .toString(16)
                ).slice(-2)
            )
            .join('')

        );


      return JSON.parse(
        jsonPayload
      );

    }
    catch {

      return null;

    }

  }


  // =========================================================
  // GET ROLE
  // =========================================================

  getRole(): string | null {

    const token =
      this.getToken();

    if (!token) {

      return null;

    }


    const payload =
      this.decodeToken(token);

    if (!payload) {

      return null;

    }


    const roleClaim =
      payload[
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
      ];


    const role =
      roleClaim ??
      payload.role;


    if (Array.isArray(role)) {

      return role.length > 0
        ? role[0]
        : null;

    }


    if (
      typeof role === 'string'
    ) {

      return role;

    }


    return null;

  }


  // =========================================================
  // IS ADMIN
  // =========================================================

  isAdmin(): boolean {

    return (
      this.getRole()?.toLowerCase()
      === 'admin'
    );

  }


  // =========================================================
  // IS USER
  // =========================================================

  isUser(): boolean {

    return (
      this.getRole()?.toLowerCase()
      === 'user'
    );

  }

}
