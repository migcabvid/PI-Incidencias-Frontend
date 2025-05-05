import { Component } from '@angular/core';
import { CommonModule, NgForOf } from '@angular/common';
import { ToastService, Toast }   from './toast.service';

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [CommonModule, NgForOf],
  template: `
    <div class="fixed top-0 right-0 p-4 space-y-2 z-50">
      <ng-container *ngFor="let t of toastService.toasts$ | async">
        <div
          [ngClass]="{
            'bg-green-600': t.type === 'success',
            'bg-red-600':   t.type === 'destructive'
          }"
          class="text-white p-4 rounded shadow-lg"
        >
          <strong>{{ t.title }}</strong>
          <p>{{ t.message }}</p>
        </div>
      </ng-container>
    </div>
  `
})
export class ToasterComponent {
  constructor(public toastService: ToastService) {}
}
