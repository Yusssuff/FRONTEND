import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  inject
} from '@angular/core';

import {
  AuthService
} from './auth.serv';


export const authGuard: CanActivateFn = () => {

  const authService =
    inject(AuthService);

  const router =
    inject(Router);


  /*
   * Only allow the Products page when a JWT exists
   * in the browser.
   */

  if (authService.isLoggedIn()) {

    return true;

  }


  /*
   * No valid browser session.
   *
   * Always return to login.
   */

  return router.createUrlTree(
    ['/']
  );

};
