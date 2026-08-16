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


  private readonly isBrowser: boolean;


  constructor(
    private http: HttpClient,

    @Inject(PLATFORM_ID)
    platformId: object
  ) {

    this.isBrowser =
      isPlatformBrowser(platformId);

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

          /*
           * NEVER log the response.
           *
           * The JWT must never be printed in the console.
           */

          if (!this.isBrowser) {

            return;

          }


          if (
            response &&
            response.token
          ) {

            localStorage.setItem(
              this.tokenKey,
              response.token
            );


            localStorage.setItem(
              this.expirationKey,
              response.expiration
            );

          }

        })

      );

  }


  // =========================================================
  // REGISTER
  // =========================================================

  register(
    user: RegisterRequest
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/Register`,
      user
    );

  }


  // =========================================================
  // GET TOKEN
  // =========================================================

  getToken(): string | null {

    /*
     * SSR has no localStorage.
     */

    if (!this.isBrowser) {

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

    /*
     * On the server there is no browser session.
     */

    if (!this.isBrowser) {

      return false;

    }


    const token =
      this.getToken();


    if (!token) {

      return false;

    }


    /*
     * Check expiration if available.
     */

    const expiration =
      localStorage.getItem(
        this.expirationKey
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

    /*
     * Never access localStorage during SSR.
     */

    if (!this.isBrowser) {

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
