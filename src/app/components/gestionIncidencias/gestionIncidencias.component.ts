import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SummaryItem {
  type: string;
  count: number;
}

interface Incident {
  id: string;
  description: string;
  date: string;
  type: string;
  status: string;
  photo?: string; // base64
}

@Component({
  selector: 'app-gestion-incidencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestionIncidencias.component.html',
  styleUrls: ['./gestionIncidencias.component.css']
})
export class GestionIncidenciasComponent implements OnInit {
  summaryData: SummaryItem[] = [
    { type: 'Resueltas', count: 205 },
    { type: 'Pendientes', count: 8 },
    { type: 'Totales', count: 213 }
  ];

  incidentsData: Incident[] = [
    { id: 'IDG-001', description: 'Fallo crítico en servidor #3', date: '2025-05-19', type: 'error', status: 'Abierto' },
    { id: 'IDG-002', description: 'Error de conexión a base de datos', date: '2025-05-18', type: 'error', status: 'Resuelto' },
    { id: 'IDG-003', description: 'Lentitud en la aplicación móvil', date: '2025-05-17', type: 'queja', status: 'En Progreso' }
  ];

  filteredIncidents: Incident[] = [...this.incidentsData];

  showModal = false;
  showSuccessModal = false;
  showDetailModal = false;
  mostrarModalSolucion = false;

  incidenciaAEliminar: Incident | null = null;
  incidenciaDetalle: Incident | null = null;
  incidenciaAResolver: Incident | null = null;

  resolucion: string = '';

  ngOnInit(): void {
    this.filteredIncidents = [...this.incidentsData];
  }

  openDeleteModal(inc: Incident): void {
    this.incidenciaAEliminar = inc;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.incidenciaAEliminar = null;
  }

  confirmDelete(): void {
    if (!this.incidenciaAEliminar) return;
    // Aquí tu lógica para eliminar la incidencia (petición al backend si aplica)
    this.filteredIncidents = this.filteredIncidents.filter(
      i => i.id !== this.incidenciaAEliminar?.id
    );
    this.showModal = false;
    this.showSuccessModal = true;
    this.incidenciaAEliminar = null;
    setTimeout(() => this.showSuccessModal = false, 1500);
  }

  openDetailModal(inc: Incident): void {
    this.incidenciaDetalle = inc;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.incidenciaDetalle = null;
  }

  abrirModalSolucion(inc: Incident): void {
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
    // Simula la resolución localmente
    this.incidenciaAResolver.status = 'Resuelta';
    // Puedes guardar la resolución si lo deseas
    (this.incidenciaAResolver as any).resolucion = this.resolucion;
    this.cerrarModalSolucion();
  }

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.id.toLowerCase().includes(q)
    );
  }

  filterByDate(from: HTMLInputElement, to: HTMLInputElement): void {
    const start = from.value;
    const end = to.value;
    this.filteredIncidents = this.incidentsData.filter(i => {
      const after = start ? i.date >= start : true;
      const before = end ? i.date <= end : true;
      return after && before;
    });
  }
}
