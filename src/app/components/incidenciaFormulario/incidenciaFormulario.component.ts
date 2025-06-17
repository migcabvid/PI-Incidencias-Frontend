import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';
import { AuthService } from '../../auth.service';
import { take, filter, switchMap } from 'rxjs/operators';

interface FormDataIncidencia {
  id?: string;
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
  readonly MAX_DESCRIPCION = 500; // tope único

  formData: FormDataIncidencia = {
    id: '',
    fecha: '',
    descripcion: '',
    tipo: '',
    fotoFile: null,
    dniProfesor: ''
  };

  imagePreview: string | ArrayBuffer | null = null;
  isDragOver = false;
  private dragCounter = 0;
  isHover = false;

  // Modales
  showSuccessModal = false;
  showErrorModal = false;
  errorMessage = '';

  tipos = [
    { value: '', label: 'Selecciona un tipo' },
    { value: 'T.I.C.', label: 'T.I.C.' },
    { value: 'Mantenimiento', label: 'Mantenimiento' }
  ];

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInputRef!: ElementRef<HTMLInputElement>;

  constructor(
    private incService: IncidenciaService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // 1) Carga próximo ID
    this.incService.nextId().subscribe(id => this.formData.id = id);

    // 2) Fecha actual
    this.formData.fecha = this.getCurrentDate();

    // 3) DNI profesor
    this.authService.dniProfesor$
      .pipe(
        filter((dni): dni is string => dni !== null),
        take(1)
      )
      .subscribe(dni => this.formData.dniProfesor = dni);
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private resetFormFields(): void {
    // Sólo limpia descripción, tipo, foto y estados de preview/drag
    this.formData.descripcion = '';
    this.formData.tipo = '';
    this.formData.fotoFile = null;
    this.imagePreview = null;
    this.isDragOver = false;
    this.isHover = false;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
    if (this.cameraInputRef) {
      this.cameraInputRef.nativeElement.value = '';
    }
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  triggerCameraInput(): void {
    this.cameraInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.formData.fotoFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onCameraSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      this.formData.fotoFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (!this.formData.descripcion || !this.formData.tipo) {
      this.errorMessage = '"Tipo Incidencia" y "Descripción" son obligatorios';
      this.showErrorModal = true;
      return;
    }

    const payload = new FormData();
    payload.append('id', this.formData.id!);
    payload.append('fecha', this.formData.fecha);
    payload.append('tipo', this.formData.tipo);
    payload.append('descripcion', this.formData.descripcion);
    payload.append('dniProfesor', this.formData.dniProfesor);
    if (this.formData.fotoFile) {
      payload.append('foto', this.formData.fotoFile, this.formData.fotoFile.name);
    }

    this.incService.crearConFoto(payload).pipe(
      switchMap((inc: Incidencia) => {
        // Mostrar modal de éxito
        this.showSuccessModal = true;
        setTimeout(() => this.showSuccessModal = false, 2000);
        return this.incService.nextId();
      })
    ).subscribe({
      next: nextId => {
        this.formData.id = nextId;
        this.resetFormFields();
      },
      error: err => {
        console.error('Error al crear incidencia:', err);
        this.errorMessage = 'No se pudo crear la incidencia';
        this.showErrorModal = true;
      }
    });
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
  }

  onReset(): void {
    this.resetFormFields();
    this.incService.nextId().subscribe(id => this.formData.id = id);
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.dragCounter++;
    if (this.dragCounter === 1) {
      this.isDragOver = true;
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

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

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    this.dragCounter = 0;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      const file = files[0];
      this.formData.fotoFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  get caracteresRestantes(): number {
    return this.MAX_DESCRIPCION - (this.formData.descripcion?.length || 0);
  }

  guardarDescripcion(): void {
    if (!this.formData.descripcion) { return; }
    this.formData.descripcion = this.formData.descripcion.slice(0, this.MAX_DESCRIPCION);
    // Aquí puedes llamar a tu servicio para guardar la descripción si lo necesitas
  }
}