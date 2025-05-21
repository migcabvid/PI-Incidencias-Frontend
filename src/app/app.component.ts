// src/app/app.component.ts
import { Component, OnInit }        from '@angular/core';
import { Router, RouterOutlet }     from '@angular/router';
import { NgIf }                     from '@angular/common';

import { NavbarComponent }          from './components/navbar/navbar.component';
import { ToasterComponent }         from './components/toast/toaster.component';
import { AuthService }              from './auth.service';

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
    // Al cargar la app, comprobamos sesión y redirigimos según el resultado
    this.auth.checkSession().subscribe({
      next: () => {
        // Si ya está logueado y está en /login, lo mandamos a crearIncidencia
        if (this.router.url === '/login') {
          this.router.navigate(['/crearIncidencia']);
        }
      },
      error: () => {
        // Si recibimos 401, redirigimos a /login
        this.router.navigate(['/login']);
      }
    });
  }

  /** Muestra navbar y toaster solo cuando hay sesión y no estamos en /login */
  showLayout(): boolean {
    return this.auth.loggedIn && this.router.url !== '/login';
  }
}
