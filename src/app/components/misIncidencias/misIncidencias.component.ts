import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Incident {
  id: string;
  description: string;
  date: string;
  status: string;
}

@Component({
  selector: 'app-mis-incidencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misIncidencias.component.html',
  styleUrls: ['./misIncidencias.component.css']
})
export class MisIncidenciasComponent implements OnInit {
  // Datos iniciales de incidencias
  incidentsData: Incident[] = [
    { id: 'IDG-001', description: 'Fallo crítico en servidor #3', date: '2025-05-19', status: 'Abierto' },
    { id: 'IDG-002', description: 'Error de conexión a base de datos', date: '2025-05-18', status: 'Resuelto' },
    { id: 'IDG-003', description: 'Lentitud en la aplicación móvil', date: '2025-05-17', status: 'En Progreso' }
  ];

  filteredIncidents: Incident[] = [];

  ngOnInit(): void {
    // Inicializar con todos los datos
    this.filteredIncidents = [...this.incidentsData];
  }

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.id.toLowerCase().includes(q)
    );
  }
}
