// src/main.ts
import 'bootstrap/dist/js/bootstrap.bundle.min.js';  // <-- Importa Bootstrap JS (incluye Popper)

import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter }        from '@angular/router';
import { importProvidersFrom }  from '@angular/core';
import { FormsModule }          from '@angular/forms';
import {
  HttpClientModule,
  HTTP_INTERCEPTORS
} from '@angular/common/http';

import { AppComponent }    from './app/app.component';
import { routes }          from './app/routes';
import { AuthInterceptor } from './app/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    importProvidersFrom(FormsModule, HttpClientModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
}).catch(err => console.error(err));
