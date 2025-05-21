// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService }        from '../../auth.service';

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

  isMisIncidencias  = false;
  isCrearIncidencia = false;

  /** Mapeo de código de rol a etiqueta */
  public roleDisplayMap: Record<string,string> = {
    profesor:        'Profesor',
    coordinadortic:  'Coordinador Tic',
    equipodirectivo: 'Equipo Directivo'
  };

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // 1) Suscripción a roles y rol activo
    this.auth.roles$.subscribe(roles => {
      this.allRoles = roles;
      console.log('Roles cargados:', roles);
    });
    this.auth.activeRole$.subscribe(role => {
      this.activeRole = role;
      console.log('Rol activo:', role);
    });

    // 2) Inicializar los flags según la ruta actual
    const url = this.router.url;
    this.isMisIncidencias  = url.includes('misIncidencias');
    this.isCrearIncidencia = url.includes('crearIncidencia');

    // 3) Detectar cambios de ruta para actualizar los flags
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        const u = ev.urlAfterRedirects;
        this.isMisIncidencias  = u.includes('misIncidencias');
        this.isCrearIncidencia = u.includes('crearIncidencia');
      }
    });
  }

  /** Devuelve etiqueta del rol activo con mayúscula correcta */
  get displayActiveRole(): string {
    if (!this.activeRole) {
      return 'Selecciona rol';
    }
    const key = this.activeRole.toLowerCase();
    return this.roleDisplayMap[key] || this.titleCase(key);
  }

  /** Devuelve todos los roles excepto el activo, comparando en minúsculas */
  get otherRoles(): string[] {
    if (!this.activeRole) {
      // si aún no hay activo, devolvemos todo
      return this.allRoles;
    }
    const ar = this.activeRole.toLowerCase();
    return this.allRoles.filter(r => r.toLowerCase() !== ar);
  }

  /** Capitaliza la primera letra y pone resto en minúscula */
  titleCase(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  /**
   * Al seleccionar un rol, actualizamos el rol activo
   * y navegamos a misIncidencias
   */
  selectOption(r: string, event: MouseEvent) {
    event.preventDefault();
    this.auth.setActiveRole(r);
    this.router.navigate(['/misIncidencias']);
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
