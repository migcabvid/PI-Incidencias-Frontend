// src/app/routes.ts
import { Routes }                        from '@angular/router';
import { LoginComponent }                from './components/login/login.component';
import { MisIncidenciasComponent }       from './components/misIncidencias/misIncidencias.component';
import { IncidenciaFormularioComponent } from './components/incidenciaFormulario/incidenciaFormulario.component';

export const routes: Routes = [
  // Ruta de login
  { path: 'login',          component: LoginComponent },

  // Rutas protegidas
  { path: 'misIncidencias',  component: MisIncidenciasComponent },
  { path: 'crearIncidencia', component: IncidenciaFormularioComponent },

  // Redirecciones
  { path: '',                redirectTo: 'login', pathMatch: 'full' },
  { path: '**',              redirectTo: 'login' }
];
