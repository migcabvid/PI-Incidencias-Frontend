import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'destructive';

export interface Toast {
  title: string;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>(this.toasts);
  readonly toasts$ = this.toastsSubject.asObservable();

  show(title: string, message: string, type: ToastType = 'success') {
    const newToast: Toast = { title, message, type };
    this.toasts = [...this.toasts, newToast];
    this.toastsSubject.next(this.toasts);

    // Descartar el toast tras 5 segundos
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t !== newToast);
      this.toastsSubject.next(this.toasts);
    }, 3000);
  }
}
