import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';

export const routes: Routes = [

  // ============================
  // LOGIN
  // ============================

  {
    path: '',
    loadComponent: () =>
      import('./auth/auth').then(m => m.Auth)
  },

  // ============================
  // PRODUCTS
  // ============================

  {
    path: 'products',

    canActivate: [
      authGuard
    ],

    loadComponent: () =>
      import('./products/products').then(m => m.Products)
  },

  // ============================
  // UNKNOWN ROUTES
  // ============================

  {
    path: '**',
    redirectTo: ''
  }

];
