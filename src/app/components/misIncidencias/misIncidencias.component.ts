import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';
import { AuthService } from '../../auth.service'; // importa tu servicio de auth

@Component({
  selector: 'app-mis-incidencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misIncidencias.component.html',
  styleUrls: ['./misIncidencias.component.css']
})
export class MisIncidenciasComponent implements OnInit {
  incidentsData: Incidencia[] = [];
  filteredIncidents: Incidencia[] = [];
  dniProfesor: string = '';

  showModal = false;
  showSuccessModal = false; // Modal de éxito
  incidenciaAEliminar: Incidencia | null = null;

  showDetailModal = false;
  incidenciaDetalle: Incidencia | null = null;

  constructor(
    private incidenciaService: IncidenciaService,
    private authService: AuthService // inyecta el servicio de auth
  ) {}

  ngOnInit(): void {
    // Suponiendo que tienes un observable o método para obtener el dni
    this.authService.dniProfesor$.subscribe(dni => {
      this.dniProfesor = dni ?? '';
      this.incidenciaService.listarTodas().subscribe(data => {
        // Filtra solo las incidencias del usuario actual
        this.incidentsData = data.filter(i => i.dniProfesor === this.dniProfesor);
        this.filteredIncidents = [...this.incidentsData];
      });
    });
  }

  cargarIncidencias(): void {
    this.incidenciaService.listarTodas().subscribe(incidencias => {
      this.filteredIncidents = incidencias;
    });
  }

  // Llama a este método desde el botón de la papelera
  openDeleteModal(incidencia: Incidencia): void {
    this.incidenciaAEliminar = incidencia;
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
        // Elimina de la lista local
        this.filteredIncidents = this.filteredIncidents.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.showModal = false;
        this.showSuccessModal = true;
        this.incidenciaAEliminar = null;
        // Oculta el modal de éxito tras 1.5 segundos
        setTimeout(() => this.showSuccessModal = false, 1500);
      },
      error: () => {
        this.showModal = false;
        this.incidenciaAEliminar = null;
        // Aquí podrías mostrar un modal de error si lo deseas
      }
    });
  }

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
  }

  // Si quieres mostrar el modal tras eliminar, llama a esto:
  onDeleteSuccess(): void {
    this.showModal = true;
  }

  openDetailModal(incidencia: Incidencia): void {
    this.incidenciaDetalle = incidencia;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.incidenciaDetalle = null;
  }
}
