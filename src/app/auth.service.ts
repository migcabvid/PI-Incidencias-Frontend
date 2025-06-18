
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

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
  private rolesSubject = new BehaviorSubject<string[]>([]);
  private activeRoleSubject = new BehaviorSubject<string | null>(null);
  private dniSubject = new BehaviorSubject<string | null>(null);

  roles$ = this.rolesSubject.asObservable();
  activeRole$ = this.activeRoleSubject.asObservable();
  dniProfesor$ = this.dniSubject.asObservable();

  private readonly STORAGE_ROLES = 'roles';
  private readonly STORAGE_ACTIVE = 'activeRole';
  private readonly STORAGE_DNI = 'dniProfesor';

  constructor(private http: HttpClient) {
  // Cargar estado desde localStorage
  const savedRoles = localStorage.getItem(this.STORAGE_ROLES);
  const savedActive = localStorage.getItem(this.STORAGE_ACTIVE);
  const savedDni = localStorage.getItem(this.STORAGE_DNI);

  if (savedRoles) {
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

  // Solo intento recargar sesión si había un activeRole guardado
   if (savedActive) {
     this.checkSession().subscribe({
       next: resp => {
         if (resp) {
           // refrescar siempre roles y dni
           this.rolesSubject.next(resp.roles);
           this.dniSubject.next(resp.dniProfesor);
           localStorage.setItem(this.STORAGE_ROLES, JSON.stringify(resp.roles));
           localStorage.setItem(this.STORAGE_DNI, resp.dniProfesor);

           // solo asignar activeRole si no venía de localStorage
           if (!savedActive) {
             this.activeRoleSubject.next(resp.activeRole);
             localStorage.setItem(this.STORAGE_ACTIVE, resp.activeRole);
           }
         }
       },
       error: () => {
         // aquí puedes loguear errores de red si quieres
       }
     });
   }
}

  /**
   * Realiza login. En caso de recibir 401/403 u otro error HTTP,
   * lo captura internamente y emite null, evitando que la rama error
   * de subscribe se dispare en el componente.
   */
  login(req: LoginRequest): Observable<LoginResponse | null> {
    return this.http.post<LoginResponse>(
      'http://localhost:8080/auth/login',
      req,
      { withCredentials: true }
    ).pipe(
      tap(resp => {
        // Solo si la respuesta es exitosa
        this.rolesSubject.next(resp.roles);
        this.activeRoleSubject.next(resp.activeRole);
        this.dniSubject.next(resp.dniProfesor);

        localStorage.setItem(this.STORAGE_ROLES, JSON.stringify(resp.roles));
        localStorage.setItem(this.STORAGE_ACTIVE, resp.activeRole);
        localStorage.setItem(this.STORAGE_DNI, resp.dniProfesor);
      }),
      catchError(() => {
        // Suprimir error y devolver null
        return of(null);
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
        localStorage.removeItem(this.STORAGE_DNI);
      }),
      catchError(() => {
        // Suprimir error de logout
        return of(undefined as void);
      })
    );
  }

  checkSession(): Observable<LoginResponse | null> {
   return this.http.get<LoginResponse>(
     'http://localhost:8080/auth/session',
     { withCredentials: true }
   ).pipe(
     catchError((err: HttpErrorResponse) => {
       if (err.status === 401) {
         // sesión caducada → devolvemos null sin error en consola
         return of(null);
       }
       // cualquier otro error lo propagamos
       return throwError(err);
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
