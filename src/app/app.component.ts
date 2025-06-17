
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from './auth.service';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
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
    const activeRole = this.auth.activeRole;
    if (activeRole) {
      this.auth.checkSession().subscribe(resp => {
        if (resp) {
          // Sesión válida
        } else {
          this.limpiarYSacarLogin();
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
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
