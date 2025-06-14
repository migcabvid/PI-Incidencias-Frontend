import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidenciaService, Incidencia } from '../../services/incidencia.service';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-mis-incidencias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misIncidencias.component.html',
  styleUrls: ['./misIncidencias.component.css']
})
export class MisIncidenciasComponent implements OnInit, AfterViewInit {
  isDateDesc = true;
  incidentsData: Incidencia[] = [];
  filteredIncidents: Incidencia[] = [];

  pageSize: number = 7;
  currentPage: number = 1;
  totalPages: number = 1;
  pagedIncidents: Incidencia[] = [];

  dniProfesor: string = '';
  isLoading: boolean = true;

  showModal = false;
  showSuccessModal = false;
  incidenciaAEliminar: Incidencia | null = null;

  showDetailModal = false;
  incidenciaDetalle: Incidencia | null = null;

  // --- Chunked pagination ---
  @ViewChild('paginationList', { static: true }) paginationList!: ElementRef<HTMLUListElement>;
  maxPageLinks: number = 5;    // se recalculará según ancho
  currentChunk: number = 0;    // índice del bloque actual
  totalChunks: number = 1;

  constructor(
    private incidenciaService: IncidenciaService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.authService.dniProfesor$.subscribe(dni => {
      this.dniProfesor = dni ?? '';
      this.incidenciaService.listarPorProfesor(this.dniProfesor).subscribe({
        next: data => {
          this.isLoading = false;
          const sorted = data.sort((a, b) => {
            const tA = new Date(a.fechaIncidencia).getTime();
            const tB = new Date(b.fechaIncidencia).getTime();
            if (tA !== tB) {
              return tB - tA;
            }
            return Number(b.idIncidencia) - Number(a.idIncidencia);
          });
          this.incidentsData = sorted;
          this.filteredIncidents = [...this.incidentsData];
          this.setupPagination();
        },
        error: err => {
          console.error(err);
          this.isLoading = false;
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.calculateMaxLinks();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.calculateMaxLinks();
  }

  private calculateMaxLinks(): void {
    const ul = this.paginationList.nativeElement;
    const available = ul.clientWidth;
    // Ajusta el valor 40 si tus estilos hacen que cada <li> sea más ancho o estrecho
    const approxLi = 40;
    this.maxPageLinks = Math.max(1, Math.floor(available / approxLi) - 2);
    this.updateChunks();
  }

  private updateChunks(): void {
    this.totalChunks = Math.ceil(this.totalPages / this.maxPageLinks);
    if (this.currentChunk >= this.totalChunks) {
      this.currentChunk = this.totalChunks - 1;
    }
    if (this.currentChunk < 0) {
      this.currentChunk = 0;
    }
  }

  public getVisiblePages(): number[] {
    const start = this.currentChunk * this.maxPageLinks;
    const end = Math.min(start + this.maxPageLinks, this.totalPages);
    return Array.from({ length: end - start }, (_, i) => start + i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    // ajustar chunk si la página queda fuera del rango visible
    const newChunk = Math.floor((page - 1) / this.maxPageLinks);
    if (newChunk !== this.currentChunk) {
      this.currentChunk = newChunk;
    }
    this.updatePagedIncidents();
  }

  prevChunk(): void {
    if (this.currentChunk > 0) {
      this.currentChunk--;
    }
  }

  nextChunk(): void {
    if (this.currentChunk < this.totalChunks - 1) {
      this.currentChunk++;
    }
  }

  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredIncidents.length / this.pageSize) || 1;
    this.currentChunk = 0;
    this.updateChunks();
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    this.updatePagedIncidents();
  }

  updatePagedIncidents(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedIncidents = this.filteredIncidents.slice(startIndex, endIndex);
  }

  filterById(term: string): void {
    const q = term.trim().toLowerCase();
    this.filteredIncidents = this.incidentsData.filter(i =>
      i.idIncidencia.toLowerCase().includes(q)
    );
    this.currentPage = 1;
    this.setupPagination();
  }

  openDeleteModal(incidencia: Incidencia): void {
    this.incidenciaAEliminar = incidencia;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.incidenciaAEliminar = null;
  }

  confirmDelete(): void {
    if (!this.incidenciaAEliminar) return;
    this.incidenciaService.eliminar(
      this.incidenciaAEliminar.idIncidencia,
      this.incidenciaAEliminar.dniProfesor
    ).subscribe({
      next: () => {
        this.incidentsData = this.incidentsData.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.filteredIncidents = this.filteredIncidents.filter(
          inc => inc.idIncidencia !== this.incidenciaAEliminar?.idIncidencia
        );
        this.showModal = false;
        this.showSuccessModal = true;
        this.incidenciaAEliminar = null;
        this.setupPagination();
        setTimeout(() => this.showSuccessModal = false, 1500);
      },
      error: () => {
        this.showModal = false;
        this.incidenciaAEliminar = null;
      }
    });
  }

  openDetailModal(incidencia: Incidencia): void {
    this.incidenciaDetalle = incidencia;
    this.showDetailModal = true;
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.incidenciaDetalle = null;
  }

  toggleDateSort(): void {
    this.isDateDesc = !this.isDateDesc;
    this.filteredIncidents.sort((a, b) => {
      const tA = new Date(a.fechaIncidencia).getTime();
      const tB = new Date(b.fechaIncidencia).getTime();
      if (tA !== tB) {
        return this.isDateDesc ? tB - tA : tA - tB;
      }
      const idA = Number(a.idIncidencia);
      const idB = Number(b.idIncidencia);
      return this.isDateDesc ? idB - idA : idA - idB;
    });
    this.currentPage = 1;
    this.setupPagination();
  }
}
