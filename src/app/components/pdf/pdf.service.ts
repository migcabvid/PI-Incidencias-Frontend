import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incidencia } from '../../services/incidencia.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private logoBase64: string | null = null;

  constructor(private http: HttpClient) {
    this.cargarLogo();
  }

  /** Carga el logo real de assets/images/logo.png y lo guarda en base64 */
  private cargarLogo(): void {
    this.http.get('assets/images/logo.png', { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            this.logoBase64 = reader.result as string;
          };
          reader.readAsDataURL(blob);
        },
        error: (error) => {
          console.warn('No se pudo cargar el logo:', error);
          this.logoBase64 = null;
        }
      });
  }

  /** Devuelve el logo en base64 (o string vacío si no está disponible) */
  private obtenerLogoBase64(): Observable<string> {
    return new Observable(observer => {
      if (this.logoBase64) {
        observer.next(this.logoBase64);
        observer.complete();
      } else {
        this.http.get('assets/images/logo.png', { responseType: 'blob' })
          .subscribe({
            next: (blob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = reader.result as string;
                this.logoBase64 = base64;
                observer.next(base64);
                observer.complete();
              };
              reader.readAsDataURL(blob);
            },
            error: (error) => {
              console.warn('No se pudo cargar el logo:', error);
              observer.next('');
              observer.complete();
            }
          });
      }
    });
  }

  generarPdfIncidencias(
    incidencias: Incidencia[],
    tipoReporte: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): void {
    this.obtenerLogoBase64().subscribe(logoBase64 => {
      this.crearPDF(incidencias, tipoReporte, fechaDesde, fechaHasta, logoBase64);
    });
  }

  private crearPDF(
    incidencias: Incidencia[],
    tipoReporte: string,
    fechaDesde?: string,
    fechaHasta?: string,
    logoBase64?: string
  ): void {
    const doc = new jsPDF();

    // Agregar logo real si está disponible
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 15, 15, 25, 25);
      } catch (error) {
        console.warn('Error al añadir logo:', error);
        // Si falla, simplemente no muestra logo
      }
    }

    // Título principal centrado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INCIDENCIAS', 105, 30, { align: 'center' });

    // Subtítulo dinámico con el estado específico
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    // CAMBIO: Usar el tipoReporte dinámicamente
    let estadoTexto = tipoReporte;
    // Limpiar el texto para obtener solo el estado principal
    if (tipoReporte.includes('(Filtrado por fecha)')) {
      estadoTexto = tipoReporte.replace(' (Filtrado por fecha)', '');
    }
    if (tipoReporte.includes('Tabla filtrada')) {
      estadoTexto = tipoReporte.split('(')[1]?.split(')')[0] || tipoReporte;
    }

    doc.text(`REGISTRO DE INCIDENCIAS (${estadoTexto.toUpperCase()})`, 20, 45);

    // Información de fechas en la misma línea
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaDesdeTexto = fechaDesde || 'dd/MM/yyyy';
    const fechaHastaTexto = fechaHasta || 'dd/MM/yyyy';
    doc.text(`Fecha desde: ${fechaDesdeTexto}`, 20, 55);
    doc.text(`Fecha hasta: ${fechaHastaTexto}`, 120, 55);

    // Preparar datos para la tabla
    const tableData = incidencias.map(inc => [
      inc.idIncidencia,
      inc.tipoIncidencia || 'N/A',
      inc.estado || 'N/A',
      this.truncateText(inc.descripcion, 35),
      this.formatearFecha(inc.fechaIncidencia),
      this.truncateText(inc.resolucion || 'N/A', 30)
    ]);

    // Crear tabla con estilo similar a tu imagen
    autoTable(doc, {
      head: [['ID', 'Tipo', 'Estado', 'Descripción', 'Fecha', 'Resolución']],
      body: tableData,
      startY: 65, // AJUSTAR: Reducir Y porque eliminamos la línea
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [128, 128, 128],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [22, 96, 78], // Color #16604E en RGB
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 50, halign: 'left' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 40, halign: 'left' }
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        this.agregarPiePagina(doc, data.pageNumber, doc.getNumberOfPages());
      }
    });

    // Descargar el PDF
    const nombreArchivo = `incidencias_${this.limpiarNombreArchivo(estadoTexto)}_${this.obtenerFechaActual()}.pdf`;
    doc.save(nombreArchivo);
  }

  private agregarPiePagina(doc: jsPDF, paginaActual: number, totalPaginas: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    // Alinear paginación a la derecha
    doc.text(
      `Página ${paginaActual} de ${totalPaginas}`,
      pageWidth - 15, // X: 15mm desde el borde derecho
      pageHeight - 10,
      { align: 'right', baseline: 'bottom' }
    );
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES');
    } catch {
      return fecha;
    }
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private obtenerFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  private limpiarNombreArchivo(nombre: string): string {
    return nombre.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
