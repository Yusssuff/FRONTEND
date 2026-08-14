import {
  ApplicationConfig
} from '@angular/core';

import {
  provideRouter
} from '@angular/router';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';

import {
  routes
} from './app.routes';

import {
  authInterceptor
} from './auth/auth.interceptr';


export const appConfig: ApplicationConfig = {

  providers: [

    // =========================
    // ROUTER
    // =========================

    provideRouter(routes),


    // =========================
    // HTTP CLIENT
    // =========================

    provideHttpClient(

      withFetch(),

      withInterceptors([
        authInterceptor
      ])

    )

  ]

};
