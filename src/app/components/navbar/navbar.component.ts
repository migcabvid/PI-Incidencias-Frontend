import { Component } from '@angular/core';
import { Router }    from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { AuthService }  from '../../auth.service';  // <-- importa el servicio

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  userRole = 'Profesor';
  roles    = ['Profesor', 'Coordinador TIC', 'Equipo Directivo'];

  constructor(
    private router: Router,
    private auth: AuthService               // <-- inyecta AuthService
  ) {}

  onRoleChange(ev: Event) {
    this.userRole = (ev.target as HTMLSelectElement).value;
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    // Llama al backend para invalidar sesión y luego redirige a /login
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  get title(): string {
    switch (this.router.url) {
      case '/':                return 'Registrar Incidencia';
      case '/mis-incidencias': return 'Mis Incidencias';
      default:                 return '';
    }
  }
}
