import { Routes } from '@angular/router';
import { LoginComponent }              from './login/login.component';
import { IncidenciaFormularioComponent } from './incidenciaFormulario/incidenciaFormulario.component';
import { MisIncidenciasComponent }     from './misIncidencias/misIncidencias.component';
import { AuthGuard }                   from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: '',                component: IncidenciaFormularioComponent },
      { path: 'mis-incidencias', component: MisIncidenciasComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
