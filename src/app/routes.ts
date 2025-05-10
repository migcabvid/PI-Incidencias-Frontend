import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { MisIncidenciasComponent } from './components/misIncidencias/misIncidencias.component';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './components/home/home.component';
import { IncidenciaFormularioComponent } from './components/incidenciaFormulario/incidenciaFormulario.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'incidencias', component: MisIncidenciasComponent },
      { path: 'crearIncidencia', component: IncidenciaFormularioComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
