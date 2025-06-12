import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-mis-incidencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misIncidencias.component.html',
  styleUrls: ['./misIncidencias.component.css']
})
export class MisIncidenciasComponent implements OnInit {
  isDateDesc = true;
  // *** Datos originales y filtrados ***
  incidentsData: Incidencia[] = [];
  filteredIncidents: Incidencia[] = [];

  // *** Paginación ***
  pageSize: number = 7;
  currentPage: number = 1;
  totalPages: number = 1;
  pagedIncidents: Incidencia[] = [];

  dniProfesor: string = '';
  isLoading: boolean = true;

  showModal = false;
  showSuccessModal = false;
  incidenciaAEliminar: Incidencia | null = null;

  showDetailModal = false;
  incidenciaDetalle: Incidencia | null = null;

  constructor(
    private incidenciaService: IncidenciaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Antes de lanzar la petición, indico que está cargando
    this.isLoading = true;

    this.authService.dniProfesor$.subscribe(dni => {
      this.dniProfesor = dni ?? '';

      // Lanzamos la petición al backend
      this.incidenciaService.listarTodas().subscribe({
        next: data => {
          // Una vez que llegan los datos, desactivo la carga
          this.isLoading = false;

          const sorted = data.sort((a, b) => {
            const tA = new Date(a.fechaIncidencia).getTime();
            const tB = new Date(b.fechaIncidencia).getTime();
            if (tA !== tB) {
              // asumimos orden descendente inicial
              return tB - tA;
            }
            // fechas iguales → ID descendente
            return Number(b.idIncidencia) - Number(a.idIncidencia);
          });

          // 2) Filtra solo las del profesor y asigna
          this.incidentsData = sorted.filter(i => i.dniProfesor === this.dniProfesor);
          this.filteredIncidents = [...this.incidentsData];

          this.setupPagination();
        },
        error: err => {
          // Si hay error, también quitamos el spinner para que no se quede bloqueado
          console.error(err);
          this.isLoading = false;
        }
      });
    });
  }

  // Llamar a este método cada vez que cambie filteredIncidents (al buscar, al eliminar, etc.)
  setupPagination(): void {
    // Calcula número total de páginas
    this.totalPages = Math.ceil(this.filteredIncidents.length / this.pageSize) || 1;

    // Si currentPage se sale de rango (por ejemplo, tras filtrar deja menos páginas), ajusta:
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // Rellena pagedIncidents con el slice correspondiente a la página actual
    this.updatePagedIncidents();
  }

  updatePagedIncidents(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedIncidents = this.filteredIncidents.slice(startIndex, endIndex);
  }

  // Cambiar de página cuando el usuario pulse una página nueva
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedIncidents();
  }

  // Para el buscador: filtrar y reiniciar paginación
  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
    // Tras filtrar, volvemos a configurar (y, por defecto, empezará en página 1)
    this.currentPage = 1;
    this.setupPagination();
  }

  openDeleteModal(incidencia: Incidencia): void {
    this.incidenciaAEliminar = incidencia;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.incidenciaAEliminar = null;
  }

  confirmDelete(): void {
    if (!this.incidenciaAEliminar) return;
    this.incidenciaService.eliminar(
      this.incidenciaAEliminar.idIncidencia,
      this.incidenciaAEliminar.dniProfesor
    ).subscribe({
      next: () => {
        // Elimina la incidencia de la lista original y de la filtrada
        this.incidentsData = this.incidentsData.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.filteredIncidents = this.filteredIncidents.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.showModal = false;
        this.showSuccessModal = true;
        this.incidenciaAEliminar = null;
        // Tras eliminar, reconfigura paginación
        this.setupPagination();

        setTimeout(() => this.showSuccessModal = false, 1500);
      },
      error: () => {
        this.showModal = false;
        this.incidenciaAEliminar = null;
      }
    });
  }

  openDetailModal(incidencia: Incidencia): void {
    this.incidenciaDetalle = incidencia;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.incidenciaDetalle = null;
  }

  toggleDateSort(): void {
  this.isDateDesc = !this.isDateDesc;

  this.filteredIncidents.sort((a, b) => {
    // 1) Compara fechas
    const tA = new Date(a.fechaIncidencia).getTime();
    const tB = new Date(b.fechaIncidencia).getTime();
    if (tA !== tB) {
      return this.isDateDesc
        ? tB - tA   // descendente por fecha
        : tA - tB;  // ascendente por fecha
    }

    // 2) Si la fecha es idéntica, compara numéricamente el ID
    const idA = Number(a.idIncidencia);
    const idB = Number(b.idIncidencia);
    return this.isDateDesc
      ? idB - idA  // dentro de la misma fecha, IDs descendentes
      : idA - idB; // o IDs ascendentes
  });

  this.currentPage = 1;
  this.setupPagination();
}
}
