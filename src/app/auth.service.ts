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

  private readonly STORAGE_ROLES   = 'roles';
  private readonly STORAGE_ACTIVE  = 'activeRole';
  private readonly STORAGE_DNI     = 'dniProfesor';  // ← nueva constante

  constructor(private http: HttpClient) {
    // 0) Cargar desde localStorage si existe
    const savedRoles  = localStorage.getItem(this.STORAGE_ROLES);
    const savedActive = localStorage.getItem(this.STORAGE_ACTIVE);
    const savedDni    = localStorage.getItem(this.STORAGE_DNI); // cargar dni si estaba guardado

    if (savedRoles)  {
      try {
        this.rolesSubject.next(JSON.parse(savedRoles));
      } catch {
        localStorage.removeItem(this.STORAGE_ROLES);
      }
    }
    if (savedActive) {
      this.activeRoleSubject.next(savedActive);
    }
    if (savedDni) {
      this.dniSubject.next(savedDni);
    }

    // 1) Intentar recargar sesión desde el servidor
    this.checkSession().subscribe({
      next: resp => {
        // Actualizamos roles y dni siempre
        this.rolesSubject.next(resp.roles);
        this.dniSubject.next(resp.dniProfesor);
        localStorage.setItem(this.STORAGE_ROLES, JSON.stringify(resp.roles));
        localStorage.setItem(this.STORAGE_DNI, resp.dniProfesor);  // persistir dni de sesión

        // Solo actualizamos activeRole si no había uno guardado
        if (!savedActive) {
          this.activeRoleSubject.next(resp.activeRole);
          localStorage.setItem(this.STORAGE_ACTIVE, resp.activeRole);
        } else {
          // Si ya había activeRole en storage, opcionalmente podrías validar que esté en resp.roles.
          // Quedamos con el valor guardado en storage si cumple. (No se modifica aquí.)
        }
      },
      error: () => {
        // Si no hay sesión válida, podría limpiar también dni/roles/activeRole:
        // this.rolesSubject.next([]);
        // this.activeRoleSubject.next(null);
        // this.dniSubject.next(null);
        // localStorage.removeItem(this.STORAGE_ROLES);
        // localStorage.removeItem(this.STORAGE_ACTIVE);
        // localStorage.removeItem(this.STORAGE_DNI);
        // Por ahora, se mantiene lo que había en localStorage.
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
        localStorage.setItem(this.STORAGE_DNI, resp.dniProfesor);  // persistir dni al hacer login
      })
      // Podrías añadir catchError aquí si quisieras manejar errores de login de forma centralizada
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
        localStorage.removeItem(this.STORAGE_DNI);  // eliminar dni al hacer logout
      })
    );
  }

  checkSession(): Observable<LoginResponse> {
    return this.http.get<LoginResponse>(
      'http://localhost:8080/auth/session',
      { withCredentials: true }
    ).pipe(
      catchError(err => {
        // Podrías limpiar estado aquí si deseas forzar logout en sesión inválida.
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

  get activeRole(): string | null {
    return this.activeRoleSubject.getValue();
  }
}
