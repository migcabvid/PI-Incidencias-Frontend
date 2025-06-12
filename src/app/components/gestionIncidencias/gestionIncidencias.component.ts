import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';

@Component({
  selector: 'app-gestion-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionIncidencias.component.html',
  styleUrls: ['./gestionIncidencias.component.css']
})
export class GestionIncidenciasComponent implements OnInit {
  isDateDesc = true;
  isLoading = true;
  summaryData = [
    { type: 'Resueltas', count: 0 },
    { type: 'Pendientes', count: 0 },
    { type: 'Totales', count: 0 }
  ];

  incidentsData: Incidencia[] = [];
  filteredIncidents: Incidencia[] = [];

  showModal = false;
  showSuccessModal = false;
  showDetailModal = false;
  mostrarModalSolucion = false;

  incidenciaAEliminar: Incidencia | null = null;
  incidenciaDetalle: Incidencia | null = null;
  incidenciaAResolver: Incidencia | null = null;

  resolucion: string = '';

  filtroFechaActivo = false;

  pageSize: number = 7;
  currentPage: number = 1;
  totalPages: number = 1;
  pagedIncidents: Incidencia[] = [];

  constructor(private incidenciaService: IncidenciaService) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.incidenciaService.listarTodas().subscribe({
      next: data => {
        this.isLoading = false;

        const sorted = data.sort((a, b) => {
          const tA = new Date(a.fechaIncidencia).getTime();
          const tB = new Date(b.fechaIncidencia).getTime();
          if (tA !== tB) return tB - tA;
          return Number(b.idIncidencia) - Number(a.idIncidencia);
        });
        this.incidentsData = sorted;

        this.filteredIncidents = [...sorted];
        this.setupPagination();
        this.updateSummary();
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  updateSummary(): void {
    this.summaryData = [
      { type: 'Resueltas', count: this.incidentsData.filter(i => i.estado?.toLowerCase() === 'resuelta').length },
      { type: 'Pendientes', count: this.incidentsData.filter(i => i.estado?.toLowerCase() !== 'resuelta').length },
      { type: 'Totales', count: this.incidentsData.length }
    ];
  }

  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredIncidents.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
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

  openDeleteModal(inc: Incidencia): void {
    this.incidenciaAEliminar = inc;
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
          i => i.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.filteredIncidents = this.filteredIncidents.filter(
          i => i.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.showModal = false;
        this.showSuccessModal = true;
        this.incidenciaAEliminar = null;
        this.setupPagination();
        this.updateSummary();
        setTimeout(() => this.showSuccessModal = false, 1500);
      },
      error: () => {
        this.showModal = false;
        this.incidenciaAEliminar = null;
      }
    });
  }

  openDetailModal(inc: Incidencia): void {
    this.incidenciaDetalle = inc;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.incidenciaDetalle = null;
  }

  abrirModalSolucion(inc: Incidencia): void {
    this.incidenciaAResolver = inc;
    this.resolucion = '';
    this.mostrarModalSolucion = true;
  }

  cerrarModalSolucion(): void {
    this.mostrarModalSolucion = false;
    this.incidenciaAResolver = null;
    this.resolucion = '';
  }

  enviarResolucion(): void {
    if (!this.resolucion || !this.incidenciaAResolver) return;
    this.incidenciaAResolver.estado = 'Resuelta';
    (this.incidenciaAResolver as any).resolucion = this.resolucion;
    this.cerrarModalSolucion();
    this.updateSummary();
  }

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
    this.currentPage = 1;
    this.setupPagination();
  }

  filterByDate(from: HTMLInputElement, to: HTMLInputElement): void {
    const start = from.value;
    const end = to.value;
    this.filtroFechaActivo = !!start || !!end;
    this.filteredIncidents = this.incidentsData.filter(i => {
      const fecha = i.fechaIncidencia?.toString().slice(0, 10);
      const after = start ? fecha >= start : true;
      const before = end ? fecha <= end : true;
      return after && before;
    });
    this.currentPage = 1;
    this.setupPagination();
    this.updateSummary();
  }

  toggleDateSort(): void {
    this.isDateDesc = !this.isDateDesc;
    this.filteredIncidents.sort((a, b) => {
      const tA = new Date(a.fechaIncidencia).getTime();
      const tB = new Date(b.fechaIncidencia).getTime();
      if (tA !== tB) {
        return this.isDateDesc
          ? tB - tA  // descendente
          : tA - tB; // ascendente
      }
      // mismo día → desempata por ID
      const idA = Number(a.idIncidencia);
      const idB = Number(b.idIncidencia);
      return this.isDateDesc
        ? idB - idA
        : idA - idB;
    });
    this.currentPage = 1;
    this.setupPagination();
    this.updateSummary();
  }

  filtrarPorEstado(estado: string): void {
    if (estado === 'Totales') {
      this.filteredIncidents = [...this.incidentsData];
    } else if (estado === 'Resueltas') {
      this.filteredIncidents = this.incidentsData.filter(i => i.estado?.toLowerCase() === 'resuelta');
    } else if (estado === 'Pendientes') {
      this.filteredIncidents = this.incidentsData.filter(i => i.estado?.toLowerCase() !== 'resuelta');
    }
    this.currentPage = 1;
    this.setupPagination();
    this.updateSummary();
  }
}
