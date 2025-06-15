import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-gestion-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionIncidencias.component.html',
  styleUrls: ['./gestionIncidencias.component.css']
})
export class GestionIncidenciasComponent implements OnInit {
  summaryBaseData: Incidencia[] = [];
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
  showResolveModal = false;

  incidenciaAEliminar: Incidencia | null = null;
  incidenciaDetalle: Incidencia | null = null;
  incidenciaAResolver: Incidencia | null = null;

  resolucion: string = '';

  filtroFechaActivo = false;

  pageSize: number = 7;
  currentPage: number = 1;
  totalPages: number = 1;
  pagedIncidents: Incidencia[] = [];

  zoomImageUrl: string | null = null;

  // Para PDF y filtros
  filtroActual: string = 'En proceso';
  fechaDesdeActual: string = '';
  fechaHastaActual: string = '';
  tipoReporteActivo: string = 'En proceso';

  constructor(
    private incidenciaService: IncidenciaService,
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.incidenciaService.listarTodas().subscribe({
      next: data => {
        this.isLoading = false;
        // Ordena por fecha descendente e ID descendente
        const sortedAll = data.sort((a, b) => {
          const tA = new Date(a.fechaIncidencia).getTime();
          const tB = new Date(b.fechaIncidencia).getTime();
          if (tA !== tB) return tB - tA;
          return Number(b.idIncidencia) - Number(a.idIncidencia);
        });
        this.summaryBaseData = [...sortedAll];
        this.updateSummary();

        // Mostrar inicialmente solo "En proceso"
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
    const enProcesoCount = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'en proceso').length;
    const solucionadaCount = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'solucionada').length;
    this.summaryData = [
      { type: 'En proceso', count: enProcesoCount },
      { type: 'Solucionada', count: solucionadaCount },
      { type: 'Totales', count: this.summaryBaseData.length }
    ];
  }

  private setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredIncidents.length / this.pageSize) || 1;
    // Asegura currentPage en rango [1..totalPages]
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    this.updatePagedIncidents();
  }

  private updatePagedIncidents(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedIncidents = this.filteredIncidents.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagedIncidents();
  }

  /**
   * Ventana fija de hasta 5 páginas:
   * - Si totalPages ≤ 5: [1..totalPages]
   * - Si currentPage ≤ 3: [1,2,3,4,5]
   * - Si currentPage > totalPages - 3: [totalPages-4..totalPages]
   * - En otro caso: [currentPage-2..currentPage+2]
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
      return Array.from({ length: maxVisible }, (_, i) => total - (maxVisible - 1) + i);
    }
    return [current - 2, current - 1, current, current + 1, current + 2];
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
        this.incidentsData = this.incidentsData.filter(i => i.idIncidencia !== this.incidenciaAEliminar?.idIncidencia);
        this.filteredIncidents = this.filteredIncidents.filter(i => i.idIncidencia !== this.incidenciaAEliminar?.idIncidencia);
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
    this.zoomImageUrl = null;
    this.incidenciaDetalle = inc;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.incidenciaDetalle = null;
    this.zoomImageUrl = null;
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
        // Actualiza localmente y quita de listas si corresponde
        this.summaryBaseData = this.summaryBaseData.filter(i =>
          !(i.idIncidencia === updated.idIncidencia && i.dniProfesor === updated.dniProfesor)
        );
        this.filteredIncidents = this.filteredIncidents.filter(i =>
          !(i.idIncidencia === updated.idIncidencia && i.dniProfesor === updated.dniProfesor)
        );
        this.showResolveModal = true;
        setTimeout(() => this.showResolveModal = false, 1500);
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

  generarPDFPorTipo(tipoReporte: string): void {
    let datosParaPdf: Incidencia[] = [];
    if (tipoReporte === 'Totales') {
      datosParaPdf = [...this.summaryBaseData];
    } else if (tipoReporte === 'Solucionada') {
      datosParaPdf = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'solucionada');
    } else if (tipoReporte === 'En proceso') {
      datosParaPdf = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'en proceso');
    }
    let tipoReporteConFecha = tipoReporte;
    if (this.filtroFechaActivo) {
      tipoReporteConFecha += ' (Filtrado por fecha)';
    }
    const fechaDesdeFormateada = this.fechaDesdeActual
      ? new Date(this.fechaDesdeActual).toLocaleDateString('es-ES') : undefined;
    const fechaHastaFormateada = this.fechaHastaActual
      ? new Date(this.fechaHastaActual).toLocaleDateString('es-ES') : undefined;
    this.pdfService.generarPdfIncidencias(
      datosParaPdf,
      tipoReporteConFecha,
      fechaDesdeFormateada,
      fechaHastaFormateada
    );
  }

  generarPDF(): void {
    const datosParaPdf = [...this.filteredIncidents];
    let tipoReporte = `Tabla filtrada (${this.tipoReporteActivo})`;
    if (this.filtroFechaActivo) {
      tipoReporte += ' - Con filtro de fecha';
    }
    const fechaDesdeFormateada = this.fechaDesdeActual
      ? new Date(this.fechaDesdeActual).toLocaleDateString('es-ES') : undefined;
    const fechaHastaFormateada = this.fechaHastaActual
      ? new Date(this.fechaHastaActual).toLocaleDateString('es-ES') : undefined;
    this.pdfService.generarPdfIncidencias(
      datosParaPdf,
      tipoReporte,
      fechaDesdeFormateada,
      fechaHastaFormateada
    );
  }

  filtrarPorEstado(estado: string): void {
    this.tipoReporteActivo = estado;
    if (estado === 'Totales') {
      this.filteredIncidents = [...this.summaryBaseData];
    } else if (estado === 'Solucionada') {
      this.filteredIncidents = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'solucionada');
    } else if (estado === 'En proceso') {
      this.filteredIncidents = this.summaryBaseData.filter(i => i.estado?.toLowerCase() === 'en proceso');
    } else {
      this.filteredIncidents = [];
    }
    this.currentPage = 1;
    this.setupPagination();
  }

  filterByDate(from: HTMLInputElement, to: HTMLInputElement): void {
    let start = from.value;
    let end = to.value;
    this.fechaDesdeActual = start;
    this.fechaHastaActual = end;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (startDate > endDate) {
        [start, end] = [end, start];
        from.value = start;
        to.value = end;
        this.fechaDesdeActual = start;
        this.fechaHastaActual = end;
      }
    }
    this.filtroFechaActivo = !!start || !!end;
    this.isLoading = true;
    this.incidenciaService.filtrarPorFechas(start, end).subscribe({
      next: data => {
        this.isLoading = false;
        this.summaryBaseData = data;
        this.updateSummary();
        this.filtrarPorEstado(this.tipoReporteActivo);
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
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

  toggleDateSort(): void {
    this.isDateDesc = !this.isDateDesc;
    this.filteredIncidents.sort((a, b) => {
      const tA = new Date(a.fechaIncidencia).getTime();
      const tB = new Date(b.fechaIncidencia).getTime();
      if (tA !== tB) {
        return this.isDateDesc ? tB - tA : tA - tB;
      }
      return this.isDateDesc
        ? Number(b.idIncidencia) - Number(a.idIncidencia)
        : Number(a.idIncidencia) - Number(b.idIncidencia);
    });
    this.currentPage = 1;
    this.setupPagination();
  }

  /** Abre la imagen en grande */
  zoomImage(fotoBase64: string) {
    this.zoomImageUrl = 'data:image/jpeg;base64,' + fotoBase64;
  }

  /** Cierra el overlay */
  closeZoom() {
    this.zoomImageUrl = null;
  }
}
