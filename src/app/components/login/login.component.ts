
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest, LoginResponse } from '../../auth.service';

interface RoleOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario = '';
  password = '';

  availableRoles: RoleOption[] = [
    { value: 'profesor', label: 'Profesor' },
    { value: 'coordinadortic', label: 'Coordinador Tic' },
    { value: 'equipodirectivo', label: 'Equipo Directivo' }
  ];

  selectedRoleValue = '';
  selectedRoleLabel = 'Selecciona un rol';
  optionsVisible = false;

  errorMessage: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  toggleOptions(event: MouseEvent) {
    event.stopPropagation();
    this.optionsVisible = !this.optionsVisible;
  }

  closeOptions(event: MouseEvent) {
    if (!this.optionsVisible) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest('.custom-select')) {
      return;
    }
    this.optionsVisible = false;
  }

  selectOption(option: RoleOption) {
    this.selectedRoleValue = option.value;
    this.selectedRoleLabel = option.label;
    this.optionsVisible = false;
  }

  togglePasswordVisibility() {
    const input = document.getElementById('login-pass') as HTMLInputElement;
    const eye = document.querySelector('.login__eye') as HTMLElement;
    if (input.type === 'password') {
      input.type = 'text';
      eye.classList.replace('ri-eye-off-line', 'ri-eye-line');
    } else {
      input.type = 'password';
      eye.classList.replace('ri-eye-line', 'ri-eye-off-line');
    }
  }

  onSubmit() {
    this.errorMessage = null;

    if (!this.selectedRoleValue) {
      this.errorMessage = 'Debes seleccionar un rol.';
      return;
    }

    const req: LoginRequest = {
      username: this.usuario,
      password: this.password,
      rol: this.selectedRoleValue
    };

    // Suscribimos solo a next; AuthService.login emite null en caso de error HTTP.
    this.auth.login(req).subscribe((resp: LoginResponse | null) => {
      if (resp) {
        const key = resp.activeRole.toLowerCase();
        const destino = key === 'profesor'
          ? '/crearIncidencia'
          : '/gestionIncidencias';
        this.router.navigate([destino]);
      } else {
        // Credenciales o rol incorrectos: sólo mostrar mensaje en UI
        this.errorMessage = 'Usuario, contraseña o rol incorrectos.';
      }
    });
  }
}
