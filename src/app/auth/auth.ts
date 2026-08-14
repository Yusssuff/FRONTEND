import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AuthService,
  LoginRequest,
  RegisterRequest
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
export class Auth {

  // ============================
  // MODAL STATE
  // ============================

  showRegister = false;

  // ============================
  // LOGIN
  // ============================

  loginName = '';
  loginPassword = '';

  loginLoading = false;
  loginError = '';

  // ============================
  // REGISTER
  // ============================

  registerName = '';
  registerEmail = '';
  registerPhone = '';
  registerPassword = '';

  registerLoading = false;
  registerError = '';
  registerSuccess = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // ============================
  // OPEN REGISTER
  // ============================

  openRegister(): void {

    this.showRegister = true;

    this.loginError = '';
    this.registerError = '';
    this.registerSuccess = '';
  }

  // ============================
  // BACK TO LOGIN
  // ============================

  openLogin(): void {

    this.showRegister = false;

    this.loginError = '';
    this.registerError = '';
    this.registerSuccess = '';
  }

  // ============================
  // LOGIN
  // ============================

  login(): void {

    this.loginError = '';

    if (!this.loginName.trim() || !this.loginPassword) {

      this.loginError =
        'Please enter your username and password.';

      return;
    }

    this.loginLoading = true;

    const credentials: LoginRequest = {
      name: this.loginName.trim(),
      password: this.loginPassword
    };

    this.authService.login(credentials).subscribe({

      next: () => {

        this.loginLoading = false;

        // Do NOT print credentials or token
        this.router.navigate(['/products']);

      },

      error: (error) => {

        this.loginLoading = false;

        if (error.status === 401) {

          this.loginError =
            'Invalid username or password.';

        } else if (error.status === 400) {

          this.loginError =
            'Invalid login information.';

        } else {

          this.loginError =
            'Unable to connect to the server. Please try again.';
        }

      }

    });
  }

  // ============================
  // REGISTER
  // ============================

  register(): void {

    this.registerError = '';
    this.registerSuccess = '';

    if (
      !this.registerName.trim() ||
      !this.registerEmail.trim() ||
      !this.registerPhone.trim() ||
      !this.registerPassword
    ) {

      this.registerError =
        'Please fill in all fields.';

      return;
    }

    if (this.registerPassword.length < 6) {

      this.registerError =
        'Password must contain at least 6 characters.';

      return;
    }

    this.registerLoading = true;

    const user: RegisterRequest = {

      name: this.registerName.trim(),

      email: this.registerEmail.trim(),

      phone: this.registerPhone.trim(),

      password: this.registerPassword

    };

    this.authService.register(user).subscribe({

      next: () => {

        this.registerLoading = false;

        this.registerSuccess =
          'Account created successfully. You can now login.';

        // Clear registration form
        this.registerName = '';
        this.registerEmail = '';
        this.registerPhone = '';
        this.registerPassword = '';

      },

      error: (error) => {

        this.registerLoading = false;

        if (error.status === 400) {

          this.registerError =
            this.getRegisterError(error);

        } else {

          this.registerError =
            'Unable to create your account. Please try again.';
        }

      }

    });
  }

  // ============================
  // HANDLE BACKEND REGISTER ERRORS
  // ============================

  private getRegisterError(error: any): string {

    if (error?.error?.errors) {

      const errors = error.error.errors;

      const messages: string[] = [];

      for (const key of Object.keys(errors)) {

        const value = errors[key];

        if (Array.isArray(value)) {

          messages.push(...value);

        }

      }

      if (messages.length > 0) {

        return messages.join(' ');
      }
    }

    if (typeof error?.error === 'string') {

      return error.error;
    }

    return 'Registration failed. Please check your information.';
  }

}
