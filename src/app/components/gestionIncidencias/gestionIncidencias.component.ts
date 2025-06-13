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
    { type: 'Resueltas', count: 0 },
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
    // Cargamos solo incidencias EN PROCESO al iniciar
    this.incidenciaService.listarEnProceso().subscribe({
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
        this.summaryBaseData = [...sorted];
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
    // Contar EN PROCESO y Resueltas dentro de summaryBaseData
    const enProcesoCount = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'en proceso').length;
    const resueltasCount = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'resuelta').length;
    this.summaryData = [
      { type: 'En proceso', count: enProcesoCount },
      { type: 'Resueltas', count: resueltasCount },
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
      // Aquí debes pasar el DNI del coordinador actual; supongamos que lo tomas de sesión o similar.
      // Por simplicidad, por ahora lo dejamos fijo o en otra variable:
      'DNI_COORDINADOR_DE_SESSION',
      this.resolucion
    ).subscribe({
      next: updated => {
        // Actualizar localmente el estado y resolución
        this.incidenciaAResolver!.estado = updated.estado;
        this.incidenciaAResolver!.resolucion = updated.resolucion;
        // Remover de la lista de EN PROCESO si ahora es Resuelta
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
        console.error(err);
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

  // Si ambas fechas están definidas, comprobamos el orden
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate > endDate) {
      // Intercambiamos para que start <= end
      const tmp = start;
      start = end;
      end = tmp;
      // También actualizamos visualmente los inputs:
      from.value = start;
      to.value = end;
    }
  }

  this.filtroFechaActivo = !!start || !!end;
  this.isLoading = true;

  // Llamada al servicio: en tu caso filtrarPorFechasEnProceso
  this.incidenciaService.filtrarPorFechasEnProceso(start, end).subscribe({
    next: data => {
      // data ya contiene solo EN PROCESO en el rango corregido
      this.summaryBaseData = data;
      this.incidentsData = data; // si quieres recargar incidentsData también
      this.filteredIncidents = [...data];
      this.currentPage = 1;
      this.setupPagination();
      this.updateSummary();
      this.isLoading = false;
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
    // Si implementas filtrado extra en UI: por ahora solo “En proceso”, “Resueltas”, “Totales”
    if (estado === 'Totales') {
      this.filteredIncidents = [...this.summaryBaseData];
    } else if (estado === 'Resueltas') {
      this.filteredIncidents = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'resuelta');
    } else if (estado.toLowerCase() === 'en proceso') {
      this.filteredIncidents = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'en proceso');
    }
    this.currentPage = 1;
    this.setupPagination();
  }
}
