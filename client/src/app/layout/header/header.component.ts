import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BusyService } from '../../core/services/busy.service';
import { MatProgressBar } from '@angular/material/progress-bar';
import { CartService } from '../../core/services/cart.service';
import { AccountService } from '../../core/services/account.service';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { ViewStateService } from '../../core/services/view-state.service';


@Component({
  selector: 'app-header',
  imports: [
    MatIcon,
    MatButton,
    MatBadge,
    RouterLink,
    RouterLinkActive,
    MatProgressBar,
    MatMenuTrigger,
    MatMenu,
    MatDivider,
    MatMenuItem,
    MatIconButton
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  busyService = inject(BusyService);
  cartService = inject(CartService);
  accountService = inject(AccountService);
  private router = inject(Router);
  private routeSubsription?: Subscription;
  menuOpen: boolean = false;
  dropdownOpen: boolean = false;
  contactInView: boolean = false;
  private viewState = inject(ViewStateService);
  private contactInViewSub?: Subscription;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;;
  }

  closeMenu() {
    this.menuOpen = false;
    this.dropdownOpen = false;
  }

  logout() {
    this.accountService.logout().subscribe({
      next: () => {
        this.accountService.currentUser.set(null);
        this.router.navigateByUrl('/');
      }
    })
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  ngOnInit(): void {
    this.routeSubsription = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closeMenu();
      }
    });
    this.contactInViewSub = this.viewState.contactInView$.subscribe(val => {
      this.contactInView = val;
    });
  }

  ngOnDestroy(): void {
    this.routeSubsription?.unsubscribe();
    this.contactInViewSub?.unsubscribe();
  }
}
