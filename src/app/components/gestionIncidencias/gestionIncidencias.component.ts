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

  constructor(private incidenciaService: IncidenciaService) {}

  ngOnInit(): void {
    this.incidenciaService.listarTodas().subscribe({
      next: data => {
        this.incidentsData = data;
        this.filteredIncidents = [...data];
        this.updateSummary();
      },
      error: err => {
        console.error(err);
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
    // Aquí deberías llamar al endpoint de resolución si existe
    // Por ahora, solo actualizamos localmente:
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
  }

  filterByDate(from: HTMLInputElement, to: HTMLInputElement): void {
    const start = from.value;
    const end = to.value;
    this.filteredIncidents = this.incidentsData.filter(i => {
      const fecha = i.fechaIncidencia?.toString().slice(0, 10); // yyyy-MM-dd
      const after = start ? fecha >= start : true;
      const before = end ? fecha <= end : true;
      return after && before;
    });
  }
}
