import {
  Injectable,
  Inject,
  PLATFORM_ID
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
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
  providedIn: 'root'
})
export class AuthService {


  private readonly apiUrl =
    'http://localhost:5113/api/Account';


  private readonly tokenKey =
    'jwt_token';


  private readonly expirationKey =
    'token_expiration';


  constructor(

    private http: HttpClient,

    @Inject(PLATFORM_ID)
    private platformId: Object

  ) {}


  // =========================================================
  // BROWSER CHECK
  // =========================================================

  private isBrowser(): boolean {

    return isPlatformBrowser(
      this.platformId
    );

  }


  // =========================================================
  // LOGIN
  // =========================================================

  login(
    credentials: LoginRequest
  ): Observable<LoginResponse> {

    return this.http
      .post<LoginResponse>(
        this.apiUrl,
        credentials
      )
      .pipe(

        tap(response => {

          if (!this.isBrowser()) {
            return;
          }


          localStorage.setItem(
            this.tokenKey,
            response.token
          );


          localStorage.setItem(
            this.expirationKey,
            response.expiration
          );

        })

      );

  }


  // =========================================================
  // REGISTER
  // =========================================================

  register(
    user: RegisterRequest
  ): Observable<string> {

    return this.http.post(
      `${this.apiUrl}/Register`,
      user,
      {
        responseType: 'text'
      }
    );

  }


  // =========================================================
  // GET TOKEN
  // =========================================================

  getToken(): string | null {

    if (!this.isBrowser()) {

      return null;

    }


    return localStorage.getItem(
      this.tokenKey
    );

  }


  // =========================================================
  // CHECK LOGIN
  // =========================================================

  isLoggedIn(): boolean {

    if (!this.isBrowser()) {

      return false;

    }


    const token =
      localStorage.getItem(
        this.tokenKey
      );


    if (!token) {

      return false;

    }


    const expiration =
      localStorage.getItem(
        this.expirationKey
      );


    // Check token expiration

    if (expiration) {

      const expirationTime =
        new Date(expiration).getTime();


      if (
        Date.now() >= expirationTime
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

    if (!this.isBrowser()) {

      return;

    }


    localStorage.removeItem(
      this.tokenKey
    );


    localStorage.removeItem(
      this.expirationKey
    );

  }

}
