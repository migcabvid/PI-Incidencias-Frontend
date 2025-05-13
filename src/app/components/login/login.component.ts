import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../../auth.service';
import { Router } from '@angular/router';

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
  availableRoles = [
    { value: 'Profesor',        label: 'Profesor' },
    { value: 'CoordinadorTic',  label: 'Coordinador Tic' },
    { value: 'EquipoDirectivo', label: 'Equipo Directivo' }
  ];
  selectedRoleValue = '';   // valor que envía al backend
  selectedRoleLabel = 'Selecciona un rol'; // lo que ve el usuario
  optionsVisible = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleOptions() {
    this.optionsVisible = !this.optionsVisible;
  }

  selectOption(value: string, label: string) {
    this.selectedRoleValue = value;
    this.selectedRoleLabel = label;
    this.optionsVisible = false;
  }

  onSubmit() {
    if (!this.usuario || !this.password || !this.selectedRoleValue) {
      this.errorMessage = 'Completa usuario, contraseña y selecciona un rol.';
      return;
    }

    const body: LoginRequest = {
      username: this.usuario,
      password: this.password,
      rol:      this.selectedRoleValue
    };

    this.authService.login(body).subscribe({
      next: () => this.router.navigate(['/home']),
      error: err => {
        this.errorMessage = err.error?.message || 'Error en el login.';
      }
    });
  }

  togglePasswordVisibility() {
    const pwd = document.getElementById('login-pass') as HTMLInputElement;
    const eye = document.querySelector('.login__eye') as HTMLElement;
    if (pwd.type === 'password') {
      pwd.type = 'text';
      eye.classList.replace('ri-eye-off-line', 'ri-eye-line');
    } else {
      pwd.type = 'password';
      eye.classList.replace('ri-eye-line', 'ri-eye-off-line');
    }
  }

  closeOptions(event: Event) {
    const tgt = (event.target as HTMLElement);
    // sólo cierra si clicas fuera del custom-select
    if (!tgt.closest('.login__box--custom-select')) {
      this.optionsVisible = false;
    }
  }
}
