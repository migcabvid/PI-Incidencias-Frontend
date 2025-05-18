import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  optionsVisible = false;

  constructor(
    private router: Router,
    public auth: AuthService
  ) {}

  toggleOptions() {
    this.optionsVisible = !this.optionsVisible;
  }

  selectOption(role: string) {
    this.auth.changeRole(role);
    this.optionsVisible = false;
  }

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  get title(): string {
    switch (this.router.url) {
      case '/':                return 'Registrar Incidencia';
      case '/mis-incidencias': return 'Mis Incidencias';
      default:                 return '';
    }
  }
}
