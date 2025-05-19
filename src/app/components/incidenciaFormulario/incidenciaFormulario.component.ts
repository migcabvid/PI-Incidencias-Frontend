import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ToastService } from '../toast/toast.service';

interface FormData {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: string;
  fotoFile: File | null;
}

@Component({
  selector: 'crearIncidencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidenciaFormulario.component.html',
  styleUrls: ['./incidenciaFormulario.component.css']
})
export class IncidenciaFormularioComponent implements OnInit {
  formData: FormData = {
    id: '',
    fecha: '',
    descripcion: '',
    tipo: '',
    fotoFile: null
  };

  tipos = [
    { value: '',       label: 'Selecciona un tipo' },
    { value: 'T.I.C.',  label: 'T.I.C.' },
    { value: 'Centro',  label: 'Centro' }
  ];

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  constructor(private toast: ToastService) {}

  ngOnInit() {
    this.resetIds();
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private generateId(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    let seq = +(localStorage.getItem('lastSequence') || 0) + 1;
    seq %= 1000;
    localStorage.setItem('lastSequence', seq.toString());
    return `${y}${m}${d}${String(seq).padStart(3, '0')}`;
  }

  private resetIds() {
    this.formData.id    = this.generateId();
    this.formData.fecha = this.getCurrentDate();
    // Reset foto también
    this.formData.fotoFile = null;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.formData.fotoFile = input.files[0];
      // opcional: vista previa o lógica adicional
      console.log('Archivo seleccionado:', this.formData.fotoFile);
    }
  }

  onSubmit() {
    if (!this.formData.descripcion || !this.formData.tipo) {
      this.toast.show(
        'Error',
        'Completa todos los campos requeridos',
        'destructive'
      );
      return;
    }
    this.toast.show(
      'Incidencia registrada',
      'La incidencia se ha registrado correctamente',
      'success'
    );
    // Aquí podrías enviar formData, incluyendo formData.fotoFile
    this.resetIds();
    this.formData.descripcion = '';
    this.formData.tipo        = '';
  }

  onReset() {
    this.formData.descripcion = '';
    this.formData.tipo        = '';
    this.formData.fotoFile    = null;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }
}
