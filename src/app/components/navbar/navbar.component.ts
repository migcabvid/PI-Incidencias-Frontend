import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
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
  isMisIncidencias  = false;
  isCrearIncidencia = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Suscripción a roles y rol activo
    this.auth.roles$.subscribe(roles => this.allRoles = roles);
    this.auth.activeRole$.subscribe(role => this.activeRole = role);

    // Redirigir al login si no hay sesión
    this.auth.checkSession().subscribe({
      error: () => this.router.navigate(['/login'])
    });

    // Detectar cambios de ruta para mostrar/ocultar items
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        const url = ev.urlAfterRedirects;
        this.isMisIncidencias  = url.includes('misIncidencias');
        this.isCrearIncidencia = url.includes('crearIncidencia');
      }
    });
  }

  selectOption(r: string) {
    this.auth.setActiveRole(r);
  }

  logout() {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  goTo(path: string) {
    this.router.navigate([`/${path}`]);
  }
}
