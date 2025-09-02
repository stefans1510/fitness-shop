import { Component, inject } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  imports: [
    RouterLink,
    CommonModule
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();
  private router = inject(Router);
  
  hideFooter$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.url.startsWith('/admin')),
    startWith(this.router.url.startsWith('/admin')) // check initial route
  );
}
