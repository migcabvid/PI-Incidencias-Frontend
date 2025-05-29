import { Component } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { ToastService, Toast }   from './toast.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule, NgForOf],
  template: `
    <div class="toast-container">
      <ng-container *ngFor="let t of toastService.toasts$ | async">
        <div
          [ngClass]="{
            'toast-success': t.type === 'success',
            'toast-error':   t.type === 'destructive'
          }"
          class="toast-message"
        >
          <strong>{{ t.title }}</strong>
          <p>{{ t.message }}</p>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./toast.component.css'] // Asegúrate de que el nombre sea correcto
})
export class ToasterComponent {
  constructor(public toastService: ToastService) {}
}
