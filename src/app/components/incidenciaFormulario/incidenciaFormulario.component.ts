import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { ToastService }      from '../toast/toast.service';

interface FormData {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: string;
}

@Component({
  selector: 'crearIncidencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidenciaFormulario.component.html',
  styleUrls: ['./incidenciaFormulario.component.css']
})
export class IncidenciaFormularioComponent implements OnInit {
  formData: FormData = { id: '', fecha: '', descripcion: '', tipo: '' };
  tipos = [
    { value: '',       label: 'Selecciona un tipo' },
    { value: 'tipo1',  label: 'Tipo 1' },
    { value: 'tipo2',  label: 'Tipo 2' },
    { value: 'tipo3',  label: 'Tipo 3' }
  ];

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
  }

  onSubmit() {
    if (!this.formData.descripcion || !this.formData.tipo) {
      this.toast.show('Error', 'Completa todos los campos requeridos', 'destructive');
      return;
    }
    this.toast.show('Incidencia registrada', 'La incidencia se ha registrado correctamente', 'success');
    this.resetIds();
    this.formData.descripcion = '';
    this.formData.tipo        = '';
  }

  onReset() {
    this.formData.descripcion = '';
    this.formData.tipo        = '';
  }
}
