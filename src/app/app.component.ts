import { Component }    from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NgIf }         from '@angular/common';

import { NavbarComponent }  from './navbar/navbar.component';
import { ToasterComponent } from './toast/toaster.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NgIf,
    NavbarComponent,
    ToasterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(private router: Router) {}

  showLayout(): boolean {
    return this.router.url !== '/login';
  }
}
