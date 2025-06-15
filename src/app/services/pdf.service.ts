// src/app/services/pdf.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incidencia } from './incidencia.service';
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
        // Si aún no está cargado, intentar cargar de nuevo
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

  /** (Opcional) Método alternativo basado en fetch, no usado si se emplea HttpClient */
  private cargarLogoComoBase64(): Promise<string> {
    return fetch('assets/images/logo.png')
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }));
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

    // Logo más pequeño y más arriba a la izquierda
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', 10, 6, 20, 20); // X=10, Y=6, ancho=20, alto=20
      } catch (error) {
        console.warn('Error al añadir logo:', error);
      }
    }

    // Título principal centrado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INCIDENCIAS', 105, 25, { align: 'center' }); // Título un poco más arriba

    // Línea de separación debajo del logo y el título
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(10, 32, 200, 32); // Línea más arriba

    // Subtítulo dinámico con el estado específico
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    let estadoTexto = tipoReporte;
    if (tipoReporte.includes('(Filtrado por fecha)')) {
      estadoTexto = tipoReporte.replace(' (Filtrado por fecha)', '');
    }
    if (tipoReporte.includes('Tabla filtrada')) {
      estadoTexto = tipoReporte.split('(')[1]?.split(')')[0] || tipoReporte;
    }

    doc.text(`REGISTRO DE INCIDENCIAS (${estadoTexto.toUpperCase()})`, 20, 45);

    // Información de fechas
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
      inc.descripcion || 'N/A',
      this.formatearFecha(inc.fechaIncidencia),
      inc.resolucion || 'N/A'
    ]);

    // Hacer la tabla más grande (más ancha)
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm para A4
    const tableWidth = 190; // Más grande, casi todo el ancho de la hoja
    const margin = (pageWidth - tableWidth) / 2;

    // Dibujar la tabla sin usar didDrawPage para footer
    autoTable(doc, {
      head: [['ID', 'Tipo', 'Estado', 'Descripción', 'Fecha', 'Resolución']],
      body: tableData,
      startY: 65,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [128, 128, 128],
        lineWidth: 0.5,
        overflow: 'linebreak',
        valign: 'top'
      },
      headStyles: {
        fillColor: [22, 96, 78],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 25, halign: 'center', fontSize: 8 }, // ID
        1: { cellWidth: 30, halign: 'center', fontSize: 8 }, // Tipo
        2: { cellWidth: 30, halign: 'center', fontSize: 8 }, // Estado
        3: { cellWidth: 45, halign: 'left', overflow: 'linebreak', fontSize: 8 }, // Descripción
        4: { cellWidth: 20, halign: 'center', fontSize: 8 }, // Fecha
        5: { cellWidth: 40, halign: 'left', overflow: 'linebreak', fontSize: 8 } // Resolución
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: margin, right: margin },
      tableWidth: tableWidth
      // NO usar didDrawPage aquí
    });

    // Tras dibujar la tabla, conocer el total real de páginas:
    const totalPages = doc.getNumberOfPages();

    // Insertar pie de página en cada página:
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      this.agregarPiePagina(doc, i, totalPages);
    }

    // Descargar / abrir el PDF
    const nombreArchivo = `incidencias_${this.limpiarNombreArchivo(estadoTexto)}_${this.obtenerFechaActual()}.pdf`;
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  }

  private agregarPiePagina(doc: jsPDF, paginaActual: number, totalPaginas: number): void {
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
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
