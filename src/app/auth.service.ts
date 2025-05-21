import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private rolesSubject = new BehaviorSubject<string[]>([]);
  private activeRoleSubject = new BehaviorSubject<string | null>(null);

  /** Streams para suscribirse en el navbar, etc. */
  roles$ = this.rolesSubject.asObservable();
  activeRole$ = this.activeRoleSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Llama a POST /auth/login y guarda roles y rol activo */
  login(req: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        'http://localhost:8080/auth/login',
        req,
        { withCredentials: true }
      )
      .pipe(
        tap(resp => {
          this.rolesSubject.next(resp.roles);
          this.activeRoleSubject.next(resp.activeRole);
        })
      );
  }

  /** Cierra sesión en backend y limpia estado */
  logout(): Observable<void> {
    return this.http
      .post<void>(
        'http://localhost:8080/auth/logout',
        {},
        { withCredentials: true }
      )
      .pipe(
        tap(() => {
          this.rolesSubject.next([]);
          this.activeRoleSubject.next(null);
        })
      );
  }

  /** Comprueba si la sesión sigue activa (GET /auth/session) */
  checkSession(): Observable<void> {
    return this.http.get<void>(
      'http://localhost:8080/auth/session',
      { withCredentials: true }
    );
  }

  /** Permite cambiar el rol activo en la UI (no en el backend) */
  setActiveRole(rol: string) {
    this.activeRoleSubject.next(rol);
  }
  /**
   * Indica si hay sesión (rol activo distinto de null)
   */
  public get loggedIn(): boolean {
    return this.activeRoleSubject.getValue() !== null;
  }
}
