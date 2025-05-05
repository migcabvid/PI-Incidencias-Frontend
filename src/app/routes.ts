import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { IncidenciaComponent } from './incidencia/incidencia.component';
import { AuthGuard } from './auth.guard';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'incidencia', component: IncidenciaComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
