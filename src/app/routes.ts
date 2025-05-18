import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MisIncidenciasComponent } from './components/misIncidencias/misIncidencias.component';
import { AuthGuard } from './auth.guard';
import { IncidenciaFormularioComponent } from './components/incidenciaFormulario/incidenciaFormulario.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'incidencias', component: MisIncidenciasComponent },
      { path: 'crearIncidencia', component: IncidenciaFormularioComponent },
      { path: '', redirectTo: 'crearIncidencia', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'crearIncidencia' }
];
