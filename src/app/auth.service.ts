import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
      .pipe(tap(() => this._loggedIn = true));
  }

  logout(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this._loggedIn = false));
  }

  isAuthenticated(): boolean {
    return this._loggedIn;
  }
}
