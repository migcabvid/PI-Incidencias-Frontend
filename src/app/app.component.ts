import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, RouterOutlet, NavbarComponent ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'MiAplicacion';

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

 ngOnInit(): void {
  // 0) Si no hay rol activo guardado, no intentamos /auth/session
  const savedActive = localStorage.getItem('activeRole');
  if (!savedActive) {
    this.router.navigate(['/login']);
    return;
  }

  // 1) Comprobar sesión al arrancar y redirigir según rol
  this.auth.checkSession().subscribe({
    next: resp => {
      if (resp) {
        // Si venimos de "/" o "/login", enviamos al área correspondiente
        if (this.router.url === '/' || this.router.url === '/login') {
          const rol = (this.auth.activeRole || '').toLowerCase();
          const esGestor = ['coordinadortic', 'equipodirectivo']
                            .includes(rol);
          this.router.navigate([
            esGestor ? '/gestionIncidencias'
                     : '/crearIncidencia'
          ]);
        }
      } else {
        // Sesión expirada o no válida → limpiamos y vamos a login
        this.limpiarYSacarLogin();
      }
    },
    error: () => {
      // Error de red u otro → idem, limpiamos y login
      this.limpiarYSacarLogin();
    }
  });
}


  private limpiarYSacarLogin(): void {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  showLayout(): boolean {
    return this.auth.activeRole !== null;
  }
}
