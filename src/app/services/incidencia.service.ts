// src/app/services/incidencia.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Incidencia {
  idIncidencia: string;
  fechaIncidencia: string;
  tipoIncidencia: string;
  descripcion: string;
  dniProfesor: string;
  estado?: string;
  foto?: string;
}

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private apiUrl = `${environment.apiBaseUrl}/incidencias`;

  constructor(private http: HttpClient) {}

  /** Nuevo método */
  nextId(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/next-id`, { withCredentials: true });
  }

  crearConFoto(formData: FormData): Observable<Incidencia> {
    // Angular detecta multipart automáticamente y añade el boundary
    return this.http.post<Incidencia>(
      this.apiUrl,
      formData,
      { withCredentials: true }
    );
  }

  listarTodas(): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(this.apiUrl, { withCredentials: true });
  }

  buscarPorId(idIncidencia: string, dniProfesor: string): Observable<Incidencia> {
    return this.http.get<Incidencia>(
      `${this.apiUrl}/${idIncidencia}/${dniProfesor}`,
      { withCredentials: true }
    );
  }

  actualizar(inc: Incidencia): Observable<Incidencia> {
    return this.http.put<Incidencia>(
      `${this.apiUrl}/${inc.idIncidencia}/${inc.dniProfesor}`,
      inc,
      { withCredentials: true }
    );
  }

  eliminar(idIncidencia: string, dniProfesor: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${idIncidencia}/${dniProfesor}`,
      { withCredentials: true }
    );
  }

  resolverIncidencia(idIncidencia: string, dniProfesor: string, dniCoordinador: string, resolucion: string): Observable<Incidencia> {
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
