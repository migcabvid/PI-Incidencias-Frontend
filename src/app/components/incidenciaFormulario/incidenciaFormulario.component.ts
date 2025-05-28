import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../toast/toast.service';
import { IncidenciaService } from '../../services/incidencia.service';
import { AuthService } from '../../auth.service';
import { take, filter } from 'rxjs/operators';

interface FormDataIncidencia {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: string;
  fotoFile: File | null;
  dniProfesor: string;
}

@Component({
  selector: 'crearIncidencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidenciaFormulario.component.html',
  styleUrls: ['./incidenciaFormulario.component.css']
})
export class IncidenciaFormularioComponent implements OnInit {
  formData: FormDataIncidencia = {
    id: '',
    fecha: '',
    descripcion: '',
    tipo: '',
    fotoFile: null,
    dniProfesor: ''
  };

  // Nueva propiedad para almacenar el DataURL
  imagePreview: string | ArrayBuffer | null = null;

  // Nueva propiedad para estado de “drag over”
  isDragOver = false;
  private dragCounter = 0;

  isHover = false;

  tipos = [
    { value: '', label: 'Selecciona un tipo' },
    { value: 'T.I.C.', label: 'T.I.C.' },
    { value: 'Centro', label: 'Centro' }
  ];

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  constructor(
    private toast: ToastService,
    private incService: IncidenciaService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.resetIds();

    this.authService.dniProfesor$
      .pipe(
        filter((dni): dni is string => dni !== null),
        take(1)
      )
      .subscribe(dni => {
        this.formData.dniProfesor = dni;
      });
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private generateId(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    let seq = +(localStorage.getItem('lastSequence') || '0') + 1;
    seq %= 1000;
    localStorage.setItem('lastSequence', seq.toString());
    return `${y}${m}${d}${String(seq).padStart(3, '0')}`;
  }

  private resetIds(): void {
    this.formData.id = this.generateId();
    this.formData.fecha = this.getCurrentDate();
    this.formData.fotoFile = null;
    this.imagePreview = null;               // limpiamos la previsualización
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
      const file = input.files[0];
      this.formData.fotoFile = file;

      // Leemos el fichero para previsualizarlo
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (!this.formData.descripcion || !this.formData.tipo) {
      this.toast.show('Error', 'Completa todos los campos requeridos', 'destructive');
      return;
    }

    const payload = new FormData();
    payload.append('id', this.formData.id);
    payload.append('fecha', this.formData.fecha);
    payload.append('tipo', this.formData.tipo);
    payload.append('descripcion', this.formData.descripcion);
    payload.append('dniProfesor', this.formData.dniProfesor);
    if (this.formData.fotoFile) {
      payload.append('foto', this.formData.fotoFile, this.formData.fotoFile.name);
    }

    this.incService.crearConFoto(payload).subscribe({
      next: inc => {
        this.toast.show('Éxito', 'Incidencia creada correctamente', 'success');
        this.resetIds();
        this.formData.descripcion = '';
        this.formData.tipo = '';
      },
      error: err => {
        console.error('Error al crear incidencia:', err);
        this.toast.show('Error', 'No se pudo crear la incidencia', 'destructive');
      }
    });
  }

  onReset(): void {
    this.formData.descripcion = '';
    this.formData.tipo = '';
    this.formData.fotoFile = null;
    this.imagePreview = null;               // eliminamos la previsualización
    this.isDragOver = false;
    this.isHover = false;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  /** Solo marca true la primera vez que entra el drag */
  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.isDragOver = true;
    }
  }

  /** Solo evita el comportamiento por defecto
   *  pero NO toca el isDragOver */
  onDragOver(event: DragEvent): void {
    event.preventDefault();  // sólo evitamos el default, no tocamos el contador
  }

  /** Cuando sales del área, desactiva */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.isDragOver = false;
    }
  }

  onMouseEnter(): void {
    this.isHover = true;
  }

  onMouseLeave(): void {
    this.isHover = false;
  }

  /** Procesa el fichero arrastrado igual que onFileSelected */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    this.dragCounter = 0;
    const files = event.dataTransfer?.files;
    if (files && files.length) {
      const file = files[0];
      this.formData.fotoFile = file;

      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

}
