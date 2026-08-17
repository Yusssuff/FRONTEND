import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  AuthService
} from './auth.serv';

@Component({
  selector: 'app-auth',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './auth.html',

  styleUrl: './auth.css'
})
export class Auth
  implements OnInit {

  // =========================================================
  // LOGIN
  // =========================================================

  name: string = '';

  password: string = '';

  // =========================================================
  // REGISTER
  // =========================================================

  registerName: string = '';

  registerEmail: string = '';

  registerPhone: string = '';

  registerPassword: string = '';

  // =========================================================
  // UI
  // =========================================================

  isRegisterMode: boolean = false;

  loading: boolean = false;

  errorMessage: string = '';

  successMessage: string = '';

  constructor(
    private authService: AuthService,

    private router: Router,

    @Inject(PLATFORM_ID)
    private platformId: Object
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    /*
     * Do not access localStorage during SSR.
     */

    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {

      return;

    }

    /*
     * If the user already has a valid JWT,
     * go directly to products.
     */

    if (
      this.authService.isLoggedIn()
    ) {

      this.router.navigate(
        ['/products'],
        {
          replaceUrl: true
        }
      );

    }

  }

  // =========================================================
  // OPEN REGISTER
  // =========================================================

  openRegister(): void {

    this.isRegisterMode = true;

    this.errorMessage = '';

    this.successMessage = '';

  }

  // =========================================================
  // OPEN LOGIN
  // =========================================================

  openLogin(): void {

    this.isRegisterMode = false;

    this.errorMessage = '';

    this.successMessage = '';

  }

  // =========================================================
  // CLOSE REGISTER
  // =========================================================

  closeRegister(): void {

    this.isRegisterMode = false;

    this.errorMessage = '';

    this.successMessage = '';

  }

  // =========================================================
  // LOGIN
  // =========================================================

  login(): void {

    this.errorMessage = '';

    this.successMessage = '';

    if (
      !this.name.trim() ||
      !this.password
    ) {

      this.errorMessage =
        'Please enter your username and password.';

      return;

    }

    this.loading = true;

    this.authService
      .login({

        name:
          this.name.trim(),

        password:
          this.password

      })
      .subscribe({

        next: () => {

          this.loading = false;

          this.router.navigate(
            ['/products'],
            {
              replaceUrl: true
            }
          );

        },

        error: (
          error
        ) => {

          this.loading = false;

          if (
            error.status === 401
          ) {

            this.errorMessage =
              'Invalid username or password.';

          }
          else if (
            error.status === 400
          ) {

            this.errorMessage =
              'Invalid login information.';

          }
          else {

            this.errorMessage =
              'Unable to login. Please make sure the backend server is running.';

          }

        }

      });

  }

  // =========================================================
  // REGISTER
  // =========================================================

  register(): void {

    this.errorMessage = '';

    this.successMessage = '';

    if (
      !this.registerName.trim() ||
      !this.registerEmail.trim() ||
      !this.registerPhone.trim() ||
      !this.registerPassword
    ) {

      this.errorMessage =
        'Please fill in all fields.';

      return;

    }

    if (
      this.registerPassword.length < 6
    ) {

      this.errorMessage =
        'Password must be at least 6 characters.';

      return;

    }

    this.loading = true;

    const username =
      this.registerName.trim();

    const password =
      this.registerPassword;

    this.authService
      .register({

        name:
          username,

        email:
          this.registerEmail.trim(),

        phone:
          this.registerPhone.trim(),

        password

      })
      .subscribe({

        next: () => {

          /*
           * Register endpoint does not
           * return JWT.
           *
           * Login automatically.
           */

          this.authService
            .login({

              name:
                username,

              password

            })
            .subscribe({

              next: () => {

                this.loading = false;

                this.router.navigate(
                  ['/products'],
                  {
                    replaceUrl: true
                  }
                );

              },

              error: () => {

                this.loading = false;

                this.isRegisterMode =
                  false;

                this.errorMessage =
                  'Account created successfully, but automatic login failed. Please login manually.';

              }

            });

        },

        error: (
          error
        ) => {

          this.loading = false;

          if (
            error.status === 400
          ) {

            if (
              error.error?.errors
            ) {

              const errors =
                error.error.errors;

              const messages:
                string[] = [];

              Object.keys(
                errors
              ).forEach(
                key => {

                  const fieldErrors =
                    errors[key];

                  if (
                    Array.isArray(
                      fieldErrors
                    )
                  ) {

                    messages.push(
                      ...fieldErrors
                    );

                  }

                }
              );

              this.errorMessage =
                messages.length > 0
                  ? messages.join(' ')
                  : 'Registration information is invalid.';

            }
            else if (
              typeof error.error ===
              'string'
            ) {

              this.errorMessage =
                error.error;

            }
            else {

              this.errorMessage =
                'Registration failed. Please check your information.';

            }

          }
          else if (
            error.status === 409
          ) {

            this.errorMessage =
              'This username or email is already registered.';

          }
          else {

            this.errorMessage =
              'Unable to register. Please make sure the backend server is running.';

          }

        }

      });

  }

}
