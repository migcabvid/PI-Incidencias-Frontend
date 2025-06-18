import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Siempre enviamos las cookies de sesión
    const clonedReq = req.clone({ withCredentials: true });

    return next.handle(clonedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // Si es 401 en el endpoint de sesión, lo convertimos en un 200 con body null
        if (
          err.status === 401 &&
          req.method === 'GET' &&
          req.url.endsWith('/auth/session')
        ) {
          const fakeResponse = new HttpResponse({ status: 200, body: null });
          return of(fakeResponse);
        }
        // Para cualquier otro error, lo propagamos
        return throwError(err);
      })
    );
  }
}
