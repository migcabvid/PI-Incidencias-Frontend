import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service'; // Importa el servicio de autenticación
import { Router } from '@angular/router'; // Importa el Router para redirecciones

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  usuario: string = '';
  password: string = '';
  selectedRole: string = 'Selecciona un rol';
  optionsVisible: boolean = false;
  errorMessage: string = ''; // Para mostrar errores en el inicio de sesión

  constructor(private authService: AuthService, private router: Router) {}

  toggleOptions() {
    this.optionsVisible = !this.optionsVisible;
  }

  selectOption(role: string) {
    this.selectedRole = role;
    this.optionsVisible = false;
  }

  closeOptions(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.optionsVisible = false;
    }
  }

  onSubmit() {
    if (!this.usuario || !this.password || this.selectedRole === 'Selecciona un rol') {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.authService.login(this.usuario, this.password).subscribe({
      next: (response) => {
        console.log('Inicio de sesión exitoso:', response);
        // Redirigir al usuario a otra página después del inicio de sesión
        this.router.navigate(['/dashboard']); // Cambia '/dashboard' según tu ruta
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error);
        this.errorMessage = 'Usuario o contraseña incorrectos.';
      }
    });
  }

  togglePasswordVisibility() {
    const passwordInput = document.getElementById('login-pass') as HTMLInputElement;
    const toggleEye = document.querySelector('.login__eye') as HTMLElement;

    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleEye.classList.replace('ri-eye-off-line', 'ri-eye-line');
    } else {
      passwordInput.type = 'password';
      toggleEye.classList.replace('ri-eye-line', 'ri-eye-off-line');
    }
  }
}