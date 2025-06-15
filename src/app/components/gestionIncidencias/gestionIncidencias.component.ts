import { Component, OnInit } from '@angular/core';
import { AfterViewInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';
import { PdfService } from '../../services/pdf.service'; // ← Importar el servicio

@Component({
  selector: 'app-gestion-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestionIncidencias.component.html',
  styleUrls: ['./gestionIncidencias.component.css']
})
export class GestionIncidenciasComponent implements OnInit, AfterViewInit {
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

  @ViewChild('paginationList', { static: true })
  paginationList!: ElementRef<HTMLUListElement>;

  maxPageLinks = 5;
  currentChunk = 0;
  totalChunks = 1;

  zoomImageUrl: string | null = null;

  // Nueva propiedad para rastrear el filtro actual
  filtroActual: string = 'En proceso';
  fechaDesdeActual: string = '';
  fechaHastaActual: string = '';

  // Nueva propiedad para rastrear qué tipo de PDF se quiere generar
  tipoReporteActivo: string = 'En proceso';

  constructor(
    private incidenciaService: IncidenciaService,
    private pdfService: PdfService // ← Inyectar el servicio PDF
  ) { }

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
  this.currentPage = Math.min(Math.max(this.currentPage, 1), this.totalPages);
  this.currentChunk = 0;
  this.updateChunks();
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
  const newChunk = Math.floor((page - 1) / this.maxPageLinks);
  if (newChunk !== this.currentChunk) {
    this.currentChunk = newChunk;
  }
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

        this.showResolveModal = true;     // ← lo mostramos
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

  /**
   * Método para generar PDF de un tipo específico desde el resumen
   */
  generarPDFPorTipo(tipoReporte: string): void {
    // Obtener los datos correspondientes al tipo de reporte
    let datosParaPdf: Incidencia[] = [];

    if (tipoReporte === 'Totales') {
      datosParaPdf = [...this.summaryBaseData];
    } else if (tipoReporte === 'Solucionada') {
      datosParaPdf = this.summaryBaseData.filter(
        i => i.estado?.toLowerCase() === 'solucionada'
      );
    } else if (tipoReporte === 'En proceso') {
      datosParaPdf = this.summaryBaseData.filter(
        i => i.estado?.toLowerCase() === 'en proceso'
      );
    }

    // Determinar el tipo de reporte con información de fechas si aplica
    let tipoReporteConFecha = tipoReporte;
    if (this.filtroFechaActivo) {
      tipoReporteConFecha += ' (Filtrado por fecha)';
    }

    // Formatear fechas para el PDF si hay filtro activo
    const fechaDesdeFormateada = this.fechaDesdeActual ?
      new Date(this.fechaDesdeActual).toLocaleDateString('es-ES') : undefined;
    const fechaHastaFormateada = this.fechaHastaActual ?
      new Date(this.fechaHastaActual).toLocaleDateString('es-ES') : undefined;

    // Generar el PDF
    this.pdfService.generarPdfIncidencias(
      datosParaPdf,
      tipoReporteConFecha,
      fechaDesdeFormateada,
      fechaHastaFormateada
    );
  }

  /**
   * Método actualizado para generar PDF de los datos actualmente mostrados en la tabla
   */
  generarPDF(): void {
    // Este método ahora genera PDF de lo que está en la tabla de abajo
    const datosParaPdf = [...this.filteredIncidents];

    let tipoReporte = `Tabla filtrada (${this.tipoReporteActivo})`;
    if (this.filtroFechaActivo) {
      tipoReporte += ' - Con filtro de fecha';
    }

    const fechaDesdeFormateada = this.fechaDesdeActual ?
      new Date(this.fechaDesdeActual).toLocaleDateString('es-ES') : undefined;
    const fechaHastaFormateada = this.fechaHastaActual ?
      new Date(this.fechaHastaActual).toLocaleDateString('es-ES') : undefined;

    this.pdfService.generarPdfIncidencias(
      datosParaPdf,
      tipoReporte,
      fechaDesdeFormateada,
      fechaHastaFormateada
    );
  }

  /**
   * Método actualizado filtrarPorEstado para rastrear el tipo activo
   */
  filtrarPorEstado(estado: string): void {
    this.tipoReporteActivo = estado; // Rastrear el tipo activo

    if (estado === 'Totales') {
      this.filteredIncidents = [...this.summaryBaseData];
    } else if (estado === 'Solucionada') {
      this.filteredIncidents = this.summaryBaseData.filter(
        i => i.estado?.toLowerCase() === 'solucionada'
      );
    } else if (estado === 'En proceso') {
      this.filteredIncidents = this.summaryBaseData.filter(
        i => i.estado?.toLowerCase() === 'en proceso'
      );
    } else {
      this.filteredIncidents = [];
    }

    this.currentPage = 1;
    this.setupPagination();
  }

  /**
   * Filtrar por fecha - ÚNICA VERSIÓN
   */
  filterByDate(from: HTMLInputElement, to: HTMLInputElement): void {
    let start = from.value;
    let end = to.value;

    // Guardar las fechas actuales para el PDF
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

        // Aplicar automáticamente el filtro que estaba activo
        this.filtrarPorEstado(this.tipoReporteActivo);
      },
      error: err => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Filtrar por ID - ÚNICA VERSIÓN
   */
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

    this.setupPagination();
  }

  ngAfterViewInit(): void {
  this.calculateMaxLinks();
}

@HostListener('window:resize')
onResize(): void {
  this.calculateMaxLinks();
}

private calculateMaxLinks(): void {
  const available = this.paginationList.nativeElement.clientWidth;
  const approxLi = 40;
  this.maxPageLinks = Math.max(1, Math.floor(available / approxLi) - 2);
  this.updateChunks();
}

private updateChunks(): void {
  this.totalChunks = Math.ceil(this.totalPages / this.maxPageLinks);
  this.currentChunk = Math.min(this.currentChunk, this.totalChunks - 1);
  if (this.currentChunk < 0) this.currentChunk = 0;
}

public getVisiblePages(): number[] {
  const start = this.currentChunk * this.maxPageLinks;
  const end = Math.min(start + this.maxPageLinks, this.totalPages);
  return Array.from({ length: end - start }, (_, i) => start + i + 1);
}

prevChunk(): void {
  if (this.currentChunk > 0) this.currentChunk--;
}

nextChunk(): void {
  if (this.currentChunk < this.totalChunks - 1) this.currentChunk++;
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
