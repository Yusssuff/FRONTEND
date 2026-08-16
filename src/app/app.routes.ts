import { Routes } from '@angular/router';

import { Auth } from './auth/auth';
import { Products } from './products/products';

import { authGuard } from './auth/auth.guard';


export const routes: Routes = [



  {
    path: '',
    component: Auth
  },


  {
    path: 'products',
    component: Products,
    canActivate: [authGuard]
  },



  {
    path: '**',
    redirectTo: ''
  }

];
