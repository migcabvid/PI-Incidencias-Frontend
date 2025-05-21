// src/app/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../auth.service';

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
  // Campos del formulario
  usuario = '';
  password = '';

  // Opciones de rol para el desplegable
  availableRoles: RoleOption[] = [
    { value: 'Profesor',        label: 'Profesor' },
    { value: 'CoordinadorTic',  label: 'Coordinador Tic' },
    { value: 'EquipoDirectivo', label: 'Equipo Directivo' }
  ];

  // Estado del desplegable
  selectedRoleValue = '';             // valor que se enviará al backend
  selectedRoleLabel = 'Selecciona un rol'; // etiqueta que ve el usuario
  optionsVisible = false;

  // Mensaje de error tras el submit
  errorMessage: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  toggleOptions(event: MouseEvent) {
  // Evitamos que el clic burbujee al contenedor padre
  event.stopPropagation();
  this.optionsVisible = !this.optionsVisible;
}

closeOptions(event: MouseEvent) {
  // Si no está abierto, no hacemos nada
  if (!this.optionsVisible) {
    return;
  }
  const target = event.target as HTMLElement;
  // Si el clic fue dentro del custom-select, seguimos abiertos
  if (target.closest('.custom-select')) {
    return;
  }
  // Si fue fuera, cerramos
  this.optionsVisible = false;
}


  selectOption(option: RoleOption) {
    this.selectedRoleValue = option.value;
    this.selectedRoleLabel = option.label;
    this.optionsVisible = false;
  }



  togglePasswordVisibility() {
    const input = document.getElementById('login-pass') as HTMLInputElement;
    const eye   = document.querySelector('.login__eye') as HTMLElement;
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

    // Comprobamos que se ha seleccionado un rol
    if (!this.selectedRoleValue) {
      this.errorMessage = 'Debes seleccionar un rol.';
      return;
    }

    const req: LoginRequest = {
      username: this.usuario,
      password: this.password,
      rol:      this.selectedRoleValue
    };

    this.auth.login(req).subscribe({
      next: () => {
        this.router.navigate(['/misIncidencias']);
      },
      error: err => {
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = err.error?.message
            || 'Usuario, contraseña o rol incorrectos.';
        } else {
          this.errorMessage = 'Error de servidor. Inténtalo más tarde.';
        }
      }
    });
  }
}
