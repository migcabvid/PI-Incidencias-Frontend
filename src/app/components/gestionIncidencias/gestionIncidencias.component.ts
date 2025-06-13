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
  summaryBaseData: Incidencia[] = []; // Solo filtrado por fecha EN PROCESO
  isDateDesc = true;
  isLoading = true;
  summaryData = [
    { type: 'En proceso', count: 0 },
    { type: 'Solucionada', count: 0 },
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

  constructor(private incidenciaService: IncidenciaService) { }

  ngOnInit(): void {
    this.isLoading = true;
    // 1) Cargar TODAS las incidencias (DTO) para el resumen
    this.incidenciaService.listarTodas().subscribe({
      next: data => {
        this.isLoading = false;
        // data: array con todas las incidencias del backend
        // Ordenamos por fecha descendente e ID descendente si fechas iguales:
        const sortedAll = data.sort((a, b) => {
          const tA = new Date(a.fechaIncidencia).getTime();
          const tB = new Date(b.fechaIncidencia).getTime();
          if (tA !== tB) return tB - tA;
          return Number(b.idIncidencia) - Number(a.idIncidencia);
        });
        // summaryBaseData para el conteo: todas las incidencias
        this.summaryBaseData = [...sortedAll];
        console.log(this.summaryBaseData);
        this.updateSummary();

        // 2) Para la tabla de incidencias inicialmente, mostrar solo "En proceso"
        this.incidentsData = sortedAll.filter(i => i.estado?.toLowerCase() === 'en proceso');
        this.filteredIncidents = [...this.incidentsData];
        this.setupPagination();

      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }


  updateSummary(): void {
    const enProcesoCount = this.summaryBaseData.filter(
      i => i.estado?.toLowerCase() === 'en proceso').length;
    const solucionadaCount = this.summaryBaseData.filter(
      i => i.estado?.toLowerCase() === 'solucionada').length;
    this.summaryData = [
      { type: 'En proceso', count: enProcesoCount },
      { type: 'Solucionada', count: solucionadaCount },
      { type: 'Totales', count: this.summaryBaseData.length }
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
    console.log(inc);
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
    this.incidenciaService.resolverIncidencia(
      this.incidenciaAResolver.idIncidencia,
      this.incidenciaAResolver.dniProfesor,
      this.resolucion
    ).subscribe({
      next: updated => {
        // Actualizar localmente estado y resolución
        this.incidenciaAResolver!.estado = updated.estado;
        this.incidenciaAResolver!.resolucion = updated.resolucion;
        // Si está en summaryBaseData (solo incidencias en proceso), al estar resuelta deberíamos quitarla:
        this.summaryBaseData = this.summaryBaseData.filter(i =>
          !(i.idIncidencia === updated.idIncidencia && i.dniProfesor === updated.dniProfesor)
        );
        this.filteredIncidents = this.filteredIncidents.filter(i =>
          !(i.idIncidencia === updated.idIncidencia && i.dniProfesor === updated.dniProfesor)
        );
        this.setupPagination();
        this.updateSummary();
        this.cerrarModalSolucion();
      },
      error: err => {
        console.error('Error al resolver incidencia:', err);
        this.cerrarModalSolucion();
      }
    });
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
  let start = from.value;
  let end = to.value;
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate > endDate) {
      [start, end] = [end, start];
      from.value = start;
      to.value = end;
    }
  }
  this.filtroFechaActivo = !!start || !!end;
  this.isLoading = true;
  // Llamada al servicio: suponiendo que filtrarPorFechas devuelve todas las incidencias en el rango (no solo En proceso)
  this.incidenciaService.filtrarPorFechas(start, end).subscribe({
    next: data => {
      console.log(data);
      // data: array de incidencias en el rango de fechas
      this.isLoading = false;
      // Actualizar summaryBaseData para ese rango
      this.summaryBaseData = data;
      this.updateSummary();
      // Para la tabla inferior, quizás inicialmente mostrar solo En proceso en el rango
      this.incidentsData = data.filter(i => i.estado?.toLowerCase() === 'en proceso');
      this.filteredIncidents = [...this.incidentsData];
      this.currentPage = 1;
      this.setupPagination();
    },
    error: err => {
      console.error(err);
      this.isLoading = false;
    }
  });
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
      this.filteredIncidents = [...this.summaryBaseData];
    } else if (estado === 'Solucionada') {
      this.filteredIncidents = this.summaryBaseData.filter(
        i => i.estado?.toLowerCase() === 'solucionada');
    } else if (estado === 'En proceso') {
      this.filteredIncidents = this.summaryBaseData.filter(
        i => i.estado?.toLowerCase() === 'en proceso');
    } else {
      this.filteredIncidents = [];
    }
    this.currentPage = 1;
    this.setupPagination();
  }


}
