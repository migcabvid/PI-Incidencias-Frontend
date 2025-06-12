import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Incidencia {
  idIncidencia: string;
  fechaIncidencia: string;   // Formato yyyy-MM-dd
  tipoIncidencia: string;
  descripcion: string;
  dniProfesor: string;       // Se mantiene si lo necesitas, aunque mostraremos nombreProfesor
  estado?: string;
  foto?: string;             // Base64 si el backend lo envía así; si no, ignóralo
  nombreProfesor?: string;   // Nuevo campo para el nombre completo
  dniCoordinador?: string;
  nombreCoordinador?: string;
  resolucion?: string;
}

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private apiUrl = `${environment.apiBaseUrl}/incidencias`;

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

  /** Buscar por ID */
  buscarPorId(idIncidencia: string, dniProfesor: string): Observable<Incidencia> {
    return this.http.get<Incidencia>(
      `${this.apiUrl}/${idIncidencia}/${dniProfesor}`,
      { withCredentials: true }
    );
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
  eliminar(idIncidencia: string, dniProfesor: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${idIncidencia}/${dniProfesor}`,
      { withCredentials: true }
    );
  }

  /** Resolver incidencia */
  resolverIncidencia(
    idIncidencia: string,
    dniProfesor: string,
    dniCoordinador: string,
    resolucion: string
  ): Observable<Incidencia> {
    return this.http.put<Incidencia>(
      `${this.apiUrl}/${idIncidencia}/${dniProfesor}/resolver`,
      null,
      {
        params: {
          dniCoordinador,
          resolucion,
          estado: 'Resuelta'
        },
        withCredentials: true
      }
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
}
