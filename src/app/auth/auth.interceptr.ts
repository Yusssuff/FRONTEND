import {
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';

import { AuthService } from './auth.serv';


export const authInterceptor: HttpInterceptorFn =
  (req, next) => {

    const authService =
      inject(AuthService);

    const token =
      authService.getToken();


    // No token → send request normally
    if (!token) {

      return next(req);

    }


    // Add JWT token
    const authRequest =
      req.clone({

        setHeaders: {

          Authorization:
            `Bearer ${token}`

        }

      });


    return next(authRequest);

  };
