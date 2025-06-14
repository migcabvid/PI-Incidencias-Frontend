import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Incidencia } from '../../services/incidencia.service';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generarPdfIncidencias(
    incidencias: Incidencia[], 
    tipoReporte: string, 
    fechaDesde?: string, 
    fechaHasta?: string
  ): void {
    const doc = new jsPDF();
    
    // Configurar fuentes
    doc.setFont('helvetica');
    
    // Logo/Encabezado (simulado - ajusta según tu logo)
    this.agregarEncabezado(doc);
    
    // Título principal
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INCIDENCIAS', 105, 60, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.text('REGISTRO DE INCIDENCIAS (ESTADO)', 20, 75);
    
    // Información de fechas
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const fechaDesdeTexto = fechaDesde || 'dd/MM/yyyy';
    const fechaHastaTexto = fechaHasta || 'dd/MM/yyyy';
    doc.text(`Fecha desde: ${fechaDesdeTexto}`, 20, 85);
    doc.text(`Fecha hasta: ${fechaHastaTexto}`, 120, 85);
    
    // Información del tipo de reporte
    doc.setFont('helvetica', 'bold');
    doc.text(`Tipo de reporte: ${tipoReporte}`, 20, 95);
    doc.text(`Total de registros: ${incidencias.length}`, 120, 95);
    
    // Preparar datos para la tabla
    const tableData = incidencias.map(inc => [
      inc.idIncidencia,
      inc.tipoIncidencia || 'N/A',
      inc.estado || 'N/A',
      this.truncateText(inc.descripcion, 30),
      this.formatearFecha(inc.fechaIncidencia),
      this.truncateText(inc.resolucion || 'N/A', 25)
    ]);
    
    // Crear tabla
    autoTable(doc, {
      head: [['ID', 'Tipo', 'Estado', 'Descripción', 'Fecha', 'Resolución']],
      body: tableData,
      startY: 105,
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [76, 175, 80], // Verde similar al de tu imagen
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 25 }, // ID
        1: { cellWidth: 20 }, // Tipo  
        2: { cellWidth: 20 }, // Estado
        3: { cellWidth: 50 }, // Descripción
        4: { cellWidth: 25 }, // Fecha
        5: { cellWidth: 45 }  // Resolución
      },
      margin: { left: 15, right: 15 },
      tableWidth: 'auto'
    });
    
    // Pie de página
    this.agregarPiePagina(doc);
    
    // Descargar el PDF
    const nombreArchivo = `incidencias_${tipoReporte.toLowerCase().replace(' ', '_')}_${this.obtenerFechaActual()}.pdf`;
    doc.save(nombreArchivo);
  }
  
  private agregarEncabezado(doc: jsPDF): void {
    // Logo simulado (círculo con texto)
    doc.circle(30, 30, 15);
    doc.setFontSize(8);
    doc.text('LOGO', 30, 32, { align: 'center' });
    
    // Información institucional (ajusta según tus datos)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INSTITUCIÓN EDUCATIVA', 55, 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Sistema de Gestión de Incidencias', 55, 32);
    doc.text('Generado el: ' + new Date().toLocaleDateString('es-ES'), 55, 38);
  }
  
  private agregarPiePagina(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página 1 de ${pageCount}`, 105, pageHeight - 10, { align: 'center' });
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
}
