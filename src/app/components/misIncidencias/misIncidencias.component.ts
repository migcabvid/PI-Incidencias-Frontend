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

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
  }
}
