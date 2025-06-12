// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router, RouterModule,
  NavigationStart,
  NavigationEnd
} from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  allRoles: string[] = [];
  activeRole: string | null = null;

  isMisIncidencias = false;
  isCrearIncidencia = false;
  isGestionRole = false;

  public roleDisplayMap: Record<string, string> = {
    profesor: 'Profesor',
    coordinadortic: 'Coordinador Tic',
    equipodirectivo: 'Equipo Directivo'
  };

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    // 1) Suscribir roles y rol activo
    this.auth.roles$.subscribe(roles => this.allRoles = roles);

    // 2) Suscribir rol activo y calcular isGestionRole
    this.auth.activeRole$.subscribe(role => {
      this.activeRole = role;
      const key = role ? role.toLowerCase() : '';
      this.isGestionRole = ['equipodirectivo', 'coordinadortic'].includes(key);
    });

    // 2) Actualizar banderas en cuanto arranca la navegación
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationStart) {
        this.setFlags(ev.url);
      }
      // opcionalmente, también al terminar
      if (ev instanceof NavigationEnd) {
        this.setFlags(ev.urlAfterRedirects);
      }
    });

    // 3) Inicializa con la URL actual
    this.setFlags(this.router.url);
  }

  private setFlags(url: string) {
    this.isMisIncidencias = url.includes('misIncidencias');
    this.isCrearIncidencia = url.includes('crearIncidencia');
  }

  get displayActiveRole(): string {
    if (!this.activeRole) {
      return 'Selecciona rol';
    }
    const key = this.activeRole.toLowerCase();
    return this.roleDisplayMap[key] || this.titleCase(key);
  }

  get otherRoles(): string[] {
    if (!this.activeRole) {
      return this.allRoles;
    }
    return this.allRoles.filter(r => r.toLowerCase() !== this.activeRole!.toLowerCase());
  }

  titleCase(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  selectOption(r: string, event: MouseEvent) {
    event.preventDefault();
    this.auth.setActiveRole(r);

    const key = r.toLowerCase();
    if (key === 'profesor') {
      this.router.navigate(['/crearIncidencia']);
    } else {
      this.router.navigate(['/gestionIncidencias']);
    }
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
