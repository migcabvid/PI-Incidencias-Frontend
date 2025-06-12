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

  constructor(
    private incidenciaService: IncidenciaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    // Obtenemos el DNI del profesor desde AuthService (o similar)
    this.authService.dniProfesor$.subscribe(dni => {
      this.dniProfesor = dni ?? '';

      // Llamamos al endpoint que devuelve solo las incidencias de este profesor
      this.incidenciaService.listarPorProfesor(this.dniProfesor).subscribe({
        next: data => {
          this.isLoading = false;

          // Ordenamos descendentemente por fecha e ID (igual que antes)
          const sorted = data.sort((a, b) => {
            const tA = new Date(a.fechaIncidencia).getTime();
            const tB = new Date(b.fechaIncidencia).getTime();
            if (tA !== tB) {
              return tB - tA;
            }
            return Number(b.idIncidencia) - Number(a.idIncidencia);
          });

          // Asignamos solo las incidencias de este profesor
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

  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredIncidents.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    this.updatePagedIncidents();
  }

  updatePagedIncidents(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedIncidents = this.filteredIncidents.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedIncidents();
  }

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
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
}
