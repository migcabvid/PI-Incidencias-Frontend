import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Incidencia {
  idIncidencia: string;
  fechaIncidencia: string;   // Formato yyyy-MM-dd
  tipoIncidencia: string;
  descripcion: string;
  dniProfesor: string;
  estado?: string;
  foto?: string;
  nombreProfesor?: string;
  dniCoordinador?: string;
  nombreCoordinador?: string;
  resolucion?: string;
}

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private apiUrl = `${environment.apiBaseUrl}/incidencias`;

  /** Stream que notifica altas, bajas o cambios de estado */
  private cambiosSubject = new Subject<void>();
  cambios$ = this.cambiosSubject.asObservable();

  constructor(private http: HttpClient) { }

  /** Obtener próximo ID */
  nextId(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/next-id`, { withCredentials: true });
  }

  /** Crear incidencia con foto */
  crearConFoto(formData: FormData): Observable<Incidencia> {
    return this.http.post<Incidencia>(
      this.apiUrl,
      formData,
      { withCredentials: true }
    );
  }

  /** Listar todas (DTO), pero en la pantalla de gestión usaremos listarEnProceso */
  listarTodas(): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(this.apiUrl, { withCredentials: true });
  }

  /** Listar incidencias de un profesor dado su DNI */
  listarPorProfesor(dniProfesor: string): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(
      `${this.apiUrl}/profesor/${dniProfesor}`,
      { withCredentials: true }
    );
  }

  /** Listar solo “En proceso” */
  listarEnProceso(): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(`${this.apiUrl}/en-proceso`, { withCredentials: true });
  }

  /** Actualizar (sin foto) */
  actualizar(inc: Incidencia): Observable<Incidencia> {
    return this.http.put<Incidencia>(
      `${this.apiUrl}/${inc.idIncidencia}/${inc.dniProfesor}`,
      inc,
      { withCredentials: true }
    );
  }

  /** Eliminar */
  eliminar(idIncidencia: string, dniProfesor: string) {
    return this.http.delete<void>(
      `${this.apiUrl}/${idIncidencia}/${dniProfesor}`,
      { withCredentials: true }
    ).pipe(
      tap(() => this.cambiosSubject.next())   // ← dispara la señal
    );
  }

  /** Resolver */
  resolverIncidencia(idIncidencia: string,
                     dniProfesor: string,
                     resolucion: string) {
    const params = new HttpParams().set('resolucion', resolucion);
    return this.http.put<Incidencia>(
      `${this.apiUrl}/${idIncidencia}/${dniProfesor}/resolver`,
      null,
      { params, withCredentials: true }
    ).pipe(
      tap(() => this.cambiosSubject.next())   // ← dispara la señal
    );
  }


  /** Filtrar solo “En proceso” por fechas */
  filtrarPorFechasEnProceso(desde?: string, hasta?: string): Observable<Incidencia[]> {
    let params = new HttpParams();
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<Incidencia[]>(
      `${this.apiUrl}/filtrar`,
      { params, withCredentials: true }
    );
  }

  /** Si en algún otro contexto necesitas filtrar todas las incidencias por fechas (sin estado), mantén este método: */
  filtrarPorFechas(desde?: string, hasta?: string): Observable<Incidencia[]> {
    let params: string[] = [];
    if (desde) params.push(`desde=${desde}`);
    if (hasta) params.push(`hasta=${hasta}`);
    const query = params.length ? '?' + params.join('&') : '';
    return this.http.get<Incidencia[]>(
      `${this.apiUrl}/filtrar${query}`,
      { withCredentials: true }
    );
  }

  /** Obtener el conteo de incidencias en estado “En proceso” */
  countEnProceso(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/en-proceso`, { withCredentials: true });
  }
}