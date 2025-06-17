import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MisIncidenciasComponent } from './components/misIncidencias/misIncidencias.component';
import { IncidenciaFormularioComponent } from './components/incidenciaFormulario/incidenciaFormulario.component';
import { GestionIncidenciasComponent } from './components/gestionIncidencias/gestionIncidencias.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'misIncidencias', component: MisIncidenciasComponent },
  { path: 'crearIncidencia', component: IncidenciaFormularioComponent },
  { path: 'gestionIncidencias', component: GestionIncidenciasComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
