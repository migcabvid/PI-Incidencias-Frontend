import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
  rol: string;
}

export interface LoginResponse {
  message: string;
  roles: string[];
  activeRole: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private rolesSubject = new BehaviorSubject<string[]>([]);
  private activeRoleSubject = new BehaviorSubject<string | null>(null);

  roles$       = this.rolesSubject.asObservable();
  activeRole$  = this.activeRoleSubject.asObservable();

  constructor(private http: HttpClient) {
    // Intentamos recargar sesión al iniciar la app
    this.checkSession().subscribe({
      next: resp => {
        // Si hay sesión, actualizamos subjects
        this.rolesSubject.next(resp.roles);
        this.activeRoleSubject.next(resp.activeRole);
        // Y persistimos (opcional)
        localStorage.setItem('roles', JSON.stringify(resp.roles));
        localStorage.setItem('activeRole', resp.activeRole);
      },
      error: () => {
        // Si no hay sesión, restauramos fallback de localStorage
        const savedRoles = localStorage.getItem('roles');
        const savedActive = localStorage.getItem('activeRole');
        if (savedRoles) this.rolesSubject.next(JSON.parse(savedRoles));
        if (savedActive) this.activeRoleSubject.next(savedActive);
      }
    });
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      'http://localhost:8080/auth/login', req, { withCredentials: true }
    ).pipe(
      tap(resp => {
        this.rolesSubject.next(resp.roles);
        this.activeRoleSubject.next(resp.activeRole);
        localStorage.setItem('roles', JSON.stringify(resp.roles));
        localStorage.setItem('activeRole', resp.activeRole);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      'http://localhost:8080/auth/logout', {}, { withCredentials: true }
    ).pipe(
      tap(() => {
        this.rolesSubject.next([]);
        this.activeRoleSubject.next(null);
        localStorage.removeItem('roles');
        localStorage.removeItem('activeRole');
      })
    );
  }

  /** Ahora devuelve el DTO con roles y activeRole */
  checkSession(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(
      'http://localhost:8080/auth/session', { withCredentials: true }
    ).pipe(
      catchError(_ => {
        // Convertimos el error en throw para el subscribe del constructor
        throw _;
      })
    );
  }

  setActiveRole(rol: string) {
    this.activeRoleSubject.next(rol);
    localStorage.setItem('activeRole', rol);
  }

  get loggedIn(): boolean {
    return this.activeRoleSubject.getValue() !== null;
  }
}
