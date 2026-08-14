import { Routes } from '@angular/router';

import { Auth } from './auth/auth';
import { Products } from './products/products';

import { authGuard } from './auth/auth.guard';


export const routes: Routes = [

  // =========================
  // LOGIN / REGISTER
  // =========================

  {
    path: '',
    component: Auth
  },


  // =========================
  // PRODUCTS
  // =========================

  {
    path: 'products',
    component: Products,
    canActivate: [authGuard]
  },


  // =========================
  // UNKNOWN ROUTES
  // =========================

  {
    path: '**',
    redirectTo: ''
  }

];
