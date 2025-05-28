// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
  dniProfesor: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private rolesSubject      = new BehaviorSubject<string[]>([]);
  private activeRoleSubject = new BehaviorSubject<string | null>(null);
  private dniSubject        = new BehaviorSubject<string | null>(null);

  roles$       = this.rolesSubject.asObservable();
  activeRole$  = this.activeRoleSubject.asObservable();
  dniProfesor$ = this.dniSubject.asObservable();

  private readonly STORAGE_ROLES  = 'roles';
  private readonly STORAGE_ACTIVE = 'activeRole';

  constructor(private http: HttpClient) {
    // 0) Cargar desde localStorage si existe
    const savedRoles  = localStorage.getItem(this.STORAGE_ROLES);
    const savedActive = localStorage.getItem(this.STORAGE_ACTIVE);
    if (savedRoles)  this.rolesSubject.next(JSON.parse(savedRoles));
    if (savedActive) this.activeRoleSubject.next(savedActive);

    // 1) Intentar recargar sesión desde el servidor
    this.checkSession().subscribe({
      next: resp => {
        // Actualizamos roles y dni siempre
        this.rolesSubject.next(resp.roles);
        this.dniSubject.next(resp.dniProfesor);
        localStorage.setItem(this.STORAGE_ROLES, JSON.stringify(resp.roles));

        // Solo actualizamos activeRole si no había uno guardado
        if (!savedActive) {
          this.activeRoleSubject.next(resp.activeRole);
          localStorage.setItem(this.STORAGE_ACTIVE, resp.activeRole);
        }
      },
      error: () => {
        // Si no hay sesión, nos quedamos con lo de localStorage (si lo había)
      }
    });
  }

  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      'http://localhost:8080/auth/login',
      req,
      { withCredentials: true }
    ).pipe(
      tap(resp => {
        this.rolesSubject.next(resp.roles);
        this.activeRoleSubject.next(resp.activeRole);
        this.dniSubject.next(resp.dniProfesor);
        localStorage.setItem(this.STORAGE_ROLES, JSON.stringify(resp.roles));
        localStorage.setItem(this.STORAGE_ACTIVE, resp.activeRole);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      'http://localhost:8080/auth/logout',
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.rolesSubject.next([]);
        this.activeRoleSubject.next(null);
        this.dniSubject.next(null);
        localStorage.removeItem(this.STORAGE_ROLES);
        localStorage.removeItem(this.STORAGE_ACTIVE);
      })
    );
  }

  checkSession(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(
      'http://localhost:8080/auth/session',
      { withCredentials: true }
    ).pipe(
      catchError(err => {
        throw err;
      })
    );
  }

  setActiveRole(rol: string) {
    this.activeRoleSubject.next(rol);
    localStorage.setItem(this.STORAGE_ACTIVE, rol);
  }

  get loggedIn(): boolean {
    return this.activeRoleSubject.getValue() !== null;
  }

  get dniProfesor(): string | null {
    return this.dniSubject.getValue();
  }
}
