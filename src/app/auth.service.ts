import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

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
  private _currentUser: string | null = null;
  private _allRoles: string[] = [];
  private _activeRole: string | null = null;

  constructor(private http: HttpClient) {
    const savedUser = sessionStorage.getItem('currentUser');
    const savedRoles = sessionStorage.getItem('allRoles');
    const savedActive = sessionStorage.getItem('activeRole');
    if (savedUser && savedRoles && savedActive) {
      this._currentUser = savedUser;
      this._allRoles    = JSON.parse(savedRoles);
      this._activeRole  = savedActive;
      this._loggedIn    = true;
    }
  }

  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, data, { withCredentials: true })
      .pipe(
        tap(resp => {
          this._loggedIn    = true;
          this._currentUser = data.username;
          this._allRoles    = resp.allRoles;
          this._activeRole  = resp.activeRole;
          sessionStorage.setItem('currentUser', data.username);
          sessionStorage.setItem('allRoles', JSON.stringify(resp.allRoles));
          sessionStorage.setItem('activeRole', resp.activeRole!);
        })
      );
  }

  logout(): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this._loggedIn    = false;
          this._currentUser = null;
          this._allRoles    = [];
          this._activeRole  = null;
          sessionStorage.clear();
        })
      );
  }

  /** Comprueba en el servidor si la sesión sigue activa */
  public checkSession(): Observable<boolean> {
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

  // getters
  get loggedIn(): boolean         { return this._loggedIn; }
  get currentUser(): string | null { return this._currentUser; }
  get allRoles(): string[]        { return this._allRoles; }
  get activeRole(): string | null  { return this._activeRole; }

  /** Cambia de rol sin volver a loguearse */
  changeRole(newRole: string) {
    if (this._allRoles.includes(newRole)) {
      this._activeRole = newRole;
      sessionStorage.setItem('activeRole', newRole);
    }
  }
}
