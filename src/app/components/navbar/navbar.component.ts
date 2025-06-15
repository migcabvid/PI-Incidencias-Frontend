import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router, RouterModule,
  NavigationStart,
  NavigationEnd
} from '@angular/router';
import { AuthService } from '../../auth.service';
import { IncidenciaService } from '../../services/incidencia.service';
import { filter } from 'rxjs/operators';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  allRoles: string[] = [];
  activeRole: string | null = null;

  isMisIncidencias = false;
  isCrearIncidencia = false;
  isGestionRole = false;

  private destroy$ = new Subject<void>();

  public roleDisplayMap: Record<string, string> = {
    profesor: 'Profesor',
    coordinadortic: 'Coordinador Tic',
    equipodirectivo: 'Equipo Directivo'
  };

  // Nuevo campo para el conteo de “En proceso”
  countEnProceso: number = 0;

  constructor(
    private auth: AuthService,
    private incidenciaService: IncidenciaService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // 1) Suscribir roles y rol activo
    this.auth.roles$.subscribe(roles => this.allRoles = roles);

    this.auth.activeRole$.subscribe(role => {
      this.activeRole = role;
      const key = role ? role.toLowerCase() : '';
      this.isGestionRole = ['equipodirectivo', 'coordinadortic'].includes(key);
      // Si es rol de gestión, obtener conteo inmediatamente
      if (this.isGestionRole) {
        this.fetchCountEnProceso();
      } else {
        // Si no es gestión, opcionalmente limpiar conteo
        this.countEnProceso = 0;
      }
    });

    this.router.events.pipe(
      filter(ev => ev instanceof NavigationEnd)
    ).subscribe((ev: NavigationEnd) => {
      this.setFlags(ev.urlAfterRedirects);
      this.cd.detectChanges();      // <-- fuerza el repaint YA
      if (this.isGestionRole && ev.urlAfterRedirects.includes('gestionIncidencias')) {
        this.fetchCountEnProceso();
      }
    });

    // 2) Suscribir eventos de navegación para recargar conteo al entrar en ruta de gestión
    this.router.events.pipe(
      filter(ev => ev instanceof NavigationEnd)
    ).subscribe((ev: any) => {
      const url = ev.urlAfterRedirects;
      this.setFlags(url);
      if (this.isGestionRole && url.includes('gestionIncidencias')) {
        this.fetchCountEnProceso();
      }
    });

    // 3) Inicializar banderas y conteo con la URL actual
    this.setFlags(this.router.url);
    if (this.isGestionRole && this.router.url.includes('gestionIncidencias')) {
      this.fetchCountEnProceso();
    }

    this.incidenciaService.cambios$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isGestionRole) {          // solo interesa a roles de gestión
          this.fetchCountEnProceso();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Invoca el servicio para obtener el conteo de incidencias “En proceso” */
  private fetchCountEnProceso(): void {
    this.incidenciaService.countEnProceso().subscribe({
      next: cnt => this.countEnProceso = cnt,
      error: err => {
        console.error('Error al obtener conteo de incidencias en proceso:', err);
        this.countEnProceso = 0;
      }
    });
  }

  private setFlags(url: string) {
    this.isMisIncidencias = url.includes('misIncidencias');
    this.isCrearIncidencia = url.includes('crearIncidencia');
    // isGestionRole se calcula en subscription de activeRole
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
