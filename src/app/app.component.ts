// app.component.ts

import { Component, OnInit }        from '@angular/core';
import { Router, RouterOutlet }     from '@angular/router';
import { NgIf }                     from '@angular/common';

import { NavbarComponent }          from './components/navbar/navbar.component';
import { ToasterComponent }         from './components/toast/toaster.component';
import { AuthService }              from './auth.service';  // <-- importa el servicio

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
export class AppComponent implements OnInit {            // <-- añade OnInit
  constructor(
    private router: Router,
    private auth: AuthService                              // <-- inyecta AuthService
  ) {}

  ngOnInit() {
    // Al cargar la app, pregunta al backend si la sesión sigue viva
    this.auth.checkSession().subscribe();
  }

  showLayout(): boolean {
    // Solo muestro navbar/toastr cuando hay sesión y no estoy en /login
    return this.auth.loggedIn && this.router.url !== '/login';
  }
}
