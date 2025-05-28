// src/app/services/incidencia.service.ts
import { Injectable }      from '@angular/core';
import { HttpClient }      from '@angular/common/http';
import { Observable }      from 'rxjs';
import { environment }     from '../../environments/environment';

export interface Incidencia {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  dniProfesor: string;
  // foto no la incluimos en el JSON de respuesta
}

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private apiUrl = `${environment.apiBaseUrl}/incidencias`;

  constructor(private http: HttpClient) {}

  crearConFoto(formData: FormData): Observable<Incidencia> {
    // No pongas headers: angular detecta el multipart y añade el boundary
    return this.http.post<Incidencia>(
      this.apiUrl,
      formData,
      { withCredentials: true }  // si estás usando cookies/sesión
    );
  }
}
