// auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';              // <-- of()
import { tap, catchError, map } from 'rxjs/operators'; // <-- catchError, map

export interface LoginRequest {
  username: string;
  password: string;
  rol: string;
}

export interface LoginResponse {
  message: string;
  allRoles: string[];
  activeRole: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:8080/auth';
  private _loggedIn = false;

  constructor(private http: HttpClient) { }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, data, { withCredentials: true })
      .pipe(
        tap(() => this._loggedIn = true)
      );
  }

  logout(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => this._loggedIn = false)
      );
  }

  /** Nuevo método: comprueba en el servidor si la sesión sigue activa */
  checkSession(): Observable<boolean> {
    return this.http
      .get<void>(`${this.baseUrl}/session`, { withCredentials: true })
      .pipe(
        map(() => {
          this._loggedIn = true;
          return true;
        }),
        catchError(() => {
          this._loggedIn = false;
          return of(false);
        })
      );
  }

  /** Ya no usas este método solo: mejor leer checkSession() o este getter */
  isAuthenticated(): boolean {
    return this._loggedIn;
  }

  /** Opcional: alias más legible */
  get loggedIn(): boolean {
    return this._loggedIn;
  }
}
