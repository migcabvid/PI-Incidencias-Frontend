import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../auth.service';
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

  // Separamos valor y etiqueta
  selectedRoleValue = '';                         // "Profesor", "CoordinadorTic", "EquipoDirectivo"
  selectedRoleLabel = 'Selecciona un rol';        // lo que ve el usuario

  optionsVisible = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  toggleOptions() {
    this.optionsVisible = !this.optionsVisible;
  }

  // Ahora recibimos valor y etiqueta
  selectOption(value: string, label: string) {
    this.selectedRoleValue = value;
    this.selectedRoleLabel = label;
    this.optionsVisible = false;
  }

  closeOptions(event: Event) {
    if (!(event.target as HTMLElement).closest('.custom-select')) {
      this.optionsVisible = false;
    }
  }

  onSubmit() {
    if (!this.usuario || !this.password || !this.selectedRoleValue) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    const body: LoginRequest = {
      username: this.usuario,
      password: this.password,
      rol: this.selectedRoleValue
    };

    this.authService.login(body).subscribe({
      next: resp => {
        console.log('Éxito:', resp);
        this.router.navigate(['/dashboard']);
      },
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
}
