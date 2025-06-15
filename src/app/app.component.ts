import { Component, OnInit }    from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgIf }                 from '@angular/common';

import { NavbarComponent } from './components/navbar/navbar.component';
import { ToasterComponent } from './components/toast/toaster.component';
import { AuthService }      from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    NavbarComponent,
    ToasterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Comprueba sesión en el backend; si falla, redirige a login
    this.auth.checkSession().subscribe({
      next: () => {
      if (this.router.url === '/' || this.router.url === '/login') {

        const rol = (this.auth.activeRole || '').toLowerCase();
        const gestion = ['coordinadortic', 'equipodirectivo']
                        .includes(rol);

        this.router.navigate([
          gestion ? '/gestionIncidencias'
                  : '/crearIncidencia'
        ]);
      }
    },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  /** 
   * Muestra navbar y toaster siempre que NO estemos en /login.
   * De esta forma, tras F5 en una ruta protegida, el layout sigue visible.
   */
  showLayout(): boolean {
    return this.router.url !== '/login';
  }
}
