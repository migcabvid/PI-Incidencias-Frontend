import {
  Component,
  OnInit
} from '@angular/core';
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
  incidentsData: Incidencia[] = [];
  filteredIncidents: Incidencia[] = [];

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

  zoomImageUrl: string | null = null;

  constructor(
    private incidenciaService: IncidenciaService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.authService.dniProfesor$.subscribe(dni => {
      this.dniProfesor = dni ?? '';
      this.incidenciaService.listarPorProfesor(this.dniProfesor).subscribe({
        next: data => {
          this.isLoading = false;
          const sorted = data.sort((a, b) => {
            const tA = new Date(a.fechaIncidencia).getTime();
            const tB = new Date(b.fechaIncidencia).getTime();
            if (tA !== tB) {
              return tB - tA;
            }
            return Number(b.idIncidencia) - Number(a.idIncidencia);
          });
          this.incidentsData = sorted;
          this.filteredIncidents = [...this.incidentsData];
          this.setupPagination();
        },
        error: err => {
          console.error(err);
          this.isLoading = false;
        }
      });
    });
  }

  private setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredIncidents.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    this.updatePagedIncidents();
  }

  private updatePagedIncidents(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedIncidents = this.filteredIncidents.slice(startIndex, endIndex);
  }

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
    this.currentPage = 1;
    this.setupPagination();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedIncidents();
  }

  /**
   * Devuelve un array de números de página a mostrar en la paginación,
   * con ventana de hasta 5 enlaces según la regla:
   * - Si totalPages ≤ 5, mostrar [1..totalPages].
   * - Si currentPage ≤ 3, mostrar [1,2,3,4,5].
   * - Si currentPage > totalPages - 3, mostrar [totalPages-4..totalPages].
   * - En otro caso, centrar currentPage: [current-2..current+2].
   */
  public getVisiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (current > total - 3) {
      return Array.from({ length: maxVisible }, (_, i) => (total - (maxVisible - 1) + i));
    }
    return [current - 2, current - 1, current, current + 1, current + 2];
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
        this.incidentsData = this.incidentsData.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.filteredIncidents = this.filteredIncidents.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.showModal = false;
        this.showSuccessModal = true;
        this.incidenciaAEliminar = null;
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
    this.zoomImageUrl = null;
    this.incidenciaDetalle = incidencia;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.incidenciaDetalle = null;
    this.zoomImageUrl = null;
  }

  toggleDateSort(): void {
    this.isDateDesc = !this.isDateDesc;
    this.filteredIncidents.sort((a, b) => {
      const tA = new Date(a.fechaIncidencia).getTime();
      const tB = new Date(b.fechaIncidencia).getTime();
      if (tA !== tB) {
        return this.isDateDesc ? tB - tA : tA - tB;
      }
      const idA = Number(a.idIncidencia);
      const idB = Number(b.idIncidencia);
      return this.isDateDesc ? idB - idA : idA - idB;
    });
    this.currentPage = 1;
    this.setupPagination();
  }

  zoomImage(fotoBase64: string) {
    this.zoomImageUrl = 'data:image/jpeg;base64,' + fotoBase64;
  }

  closeZoom() {
    this.zoomImageUrl = null;
  }
}
