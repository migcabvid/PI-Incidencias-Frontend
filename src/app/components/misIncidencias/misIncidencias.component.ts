// src/app/components/misIncidencias/misIncidencias.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';
import { AuthService } from '../../auth.service';
import { Subscription } from 'rxjs';

interface SummaryRow {
  type: string;
  count: number;
}

@Component({
  selector: 'app-mis-incidencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misIncidencias.component.html',
  styleUrls: ['./misIncidencias.component.css']
})
export class MisIncidenciasComponent implements OnInit, OnDestroy {
  // *** Datos originales y filtrados ***
  datosIncidencias: Incidencia[]      = [];
  incidenciasFiltradas: Incidencia[] = [];

  // *** Paginación ***
  tamPagina: number        = 10;                
  paginaActual: number     = 1;                
  totalPaginas: number     = 1;                
  incidenciasPagina: Incidencia[] = [];

  // *** Información del profesor logueado ***
  dniProfesor: string = '';
  estaCargando: boolean = true;

  // *** Modales ***
  mostrarModalEliminar: boolean = false;
  mostrarModalExito:   boolean = false;
  incidenciaAEliminar: Incidencia | null = null;

  mostrarModalDetalle: boolean = false;
  incidenciaDetalle: Incidencia | null = null;

  // *** Nuevo: rol activo y suscripción ***
  activeRole: string | null = null;
  private roleSub!: Subscription;

  // *** Nuevo: datos de resumen para el filtro de fechas ***
  summaryData: SummaryRow[] = [];

  constructor(
    private servicioIncidencia: IncidenciaService,
    private servicioAuth: AuthService
  ) { }

  ngOnInit(): void {
    // 1) Suscribirse a activeRole para saber qué rol está activo en todo momento
    this.roleSub = this.servicioAuth.activeRole$
      .subscribe(role => {
        this.activeRole = role;
      });

    // 2) Cargar DNI del profesor y, en cuanto esté disponible, listar todas las incidencias
    this.estaCargando = true;
    this.servicioAuth.dniProfesor$.subscribe(dni => {
      this.dniProfesor = dni ?? '';

      this.servicioIncidencia.listarTodas().subscribe({
        next: data => {
          // 3) Ya tenemos TODAS las incidencias en “data”
          //    Si el rol es “profesor”, se filtran por su propio DNI.
          //    Si es “coordinadortic” o “equipodirectivo”, se asigna todo el array.
          if (this.activeRole === 'profesor') {
            this.datosIncidencias = data.filter(i => i.dniProfesor === this.dniProfesor);
          } else {
            // coordinador TIC y equipo directivo ven todo
            this.datosIncidencias = data;
          }

          // 4) Inicializar incidenciasFiltradas con el array base
          this.incidenciasFiltradas = [...this.datosIncidencias];

          // 5) Desactivar spinner y configurar paginación
          this.estaCargando = false;
          this.configurarPaginacion();
        },
        error: err => {
          console.error(err);
          this.estaCargando = false;
        }
      });
    });
  }

  ngOnDestroy(): void {
    // Limpiar suscripción al rol
    if (this.roleSub) {
      this.roleSub.unsubscribe();
    }
  }

  // -------------------------------------------------------
  // Paginación (igual que antes)
  configurarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.incidenciasFiltradas.length / this.tamPagina) || 1;
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;
    if (this.paginaActual < 1) this.paginaActual = 1;
    this.actualizarIncidenciasPagina();
  }

  actualizarIncidenciasPagina(): void {
    const indiceInicio = (this.paginaActual - 1) * this.tamPagina;
    const indiceFin    = indiceInicio + this.tamPagina;
    this.incidenciasPagina = this.incidenciasFiltradas.slice(indiceInicio, indiceFin);
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaActual = pagina;
    this.actualizarIncidenciasPagina();
  }

  filtrarPorId(termino: string): void {
    const q = termino.trim().toLowerCase();
    this.incidenciasFiltradas = this.datosIncidencias.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
    this.paginaActual = 1;
    this.configurarPaginacion();
  }

  // -------------------------------------------------------
  // Eliminación (igual que antes)
  abrirModalEliminar(incidencia: Incidencia): void {
    this.incidenciaAEliminar = incidencia;
    this.mostrarModalEliminar = true;
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar = false;
    this.incidenciaAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (!this.incidenciaAEliminar) return;
    this.servicioIncidencia.eliminar(
      this.incidenciaAEliminar.idIncidencia,
      this.incidenciaAEliminar.dniProfesor
    ).subscribe({
      next: () => {
        this.datosIncidencias = this.datosIncidencias.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.incidenciasFiltradas = this.incidenciasFiltradas.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.mostrarModalEliminar = false;
        this.mostrarModalExito = true;
        this.incidenciaAEliminar = null;
        this.configurarPaginacion();
        setTimeout(() => this.mostrarModalExito = false, 1500);
      },
      error: () => {
        this.mostrarModalEliminar = false;
        this.incidenciaAEliminar = null;
      }
    });
  }

  abrirModalDetalle(incidencia: Incidencia): void {
    this.incidenciaDetalle = incidencia;
    this.mostrarModalDetalle = true;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.incidenciaDetalle = null;
  }

  // -------------------------------------------------------
  // NUEVO: Filtrado por rango de fechas y generación de “summaryData”
  /**
   * Recoge las fechas de los inputs, filtra las incidencias según ese rango
   * y agrupa por “estado” para rellenar summaryData.
   *
   * @param fromInput  – referencia al input de tipo date “from”
   * @param toInput    – referencia al input de tipo date “to”
   */
  filterByDate(fromInput: HTMLInputElement, toInput: HTMLInputElement): void {
    const fromValue = fromInput.value;
    const toValue   = toInput.value;

    // Si alguno de los dos está vacío, no hacemos nada
    if (!fromValue || !toValue) {
      this.summaryData = [];
      return;
    }

    // Convertimos a objetos Date
    let fechaDesde = new Date(fromValue);
    let fechaHasta = new Date(toValue);

    // Asegurarnos de que fechaDesde ≤ fechaHasta
    if (fechaDesde > fechaHasta) {
      // Intercambiamos si el usuario seleccionó mal
      [fechaDesde, fechaHasta] = [fechaHasta, fechaDesde];
    }

    // Filtrar todas las incidencias (o solo las del profesor, según rol)
    // Pero para coordinador/equipo directivo: usar this.datosIncidencias ya contiene TODAS
    let rangoFiltrado: Incidencia[] = this.datosIncidencias.filter(inc => {
      const fechaInc = new Date(inc.fechaIncidencia);
      return fechaInc >= fechaDesde && fechaInc <= fechaHasta;
    });

    // Agrupar por estado
    const mapConteo: Record<string, number> = {};
    rangoFiltrado.forEach(inc => {
      const key = inc.estado || 'Sin estado';
      mapConteo[key] = (mapConteo[key] || 0) + 1;
    });

    // Convertir a array de SummaryRow
    this.summaryData = Object.keys(mapConteo).map(k => ({
      type: k,
      count: mapConteo[k]
    }));
  }

  /**
   * Al hacer clic en el “+” de una fila de summaryData, recargamos la tabla
   * original (incidenciasFiltradas) solo con aquellas que tengan el mismo “estado”.
   *
   * @param estado  – el estado que hemos pulsado
   */
  showByEstado(estado: string): void {
    // Filtrar en this.datosIncidencias (que ya contiene todo, o solo del profesor)
    this.incidenciasFiltradas = this.datosIncidencias.filter(inc =>
      inc.estado === estado
    );
    this.paginaActual = 1;
    this.configurarPaginacion();
  }

   /**
   * Getter que devuelve la suma de todos los count de summaryData.
   * Así podremos mostrarlo en la plantilla.
   */
  get summaryTotal(): number {
    return this.summaryData.reduce((acc, row) => acc + row.count, 0);
  }

}
