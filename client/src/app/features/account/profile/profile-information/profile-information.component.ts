import { Component, inject, OnInit, signal } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { AccountService } from '../../../../core/services/account.service';
import { CartService } from '../../../../core/services/cart.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Coupon } from '../../../../shared/models/coupon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-profile-information',
  imports: [
    CommonModule,
    MatIcon,
    MatChipsModule,
    MatTooltipModule,
    DatePipe
  ],
  templateUrl: './profile-information.component.html',
  styleUrl: './profile-information.component.scss'
})
export class ProfileInformationComponent implements OnInit {
  accountService = inject(AccountService);
  cartService = inject(CartService);
  
  availableCoupons = signal<Coupon[]>([]);
  loading = signal(false);
  
  get user() {
    return this.accountService.currentUser();
  }

  ngOnInit() {
    this.loadAvailableCoupons();
  }

  loadAvailableCoupons() {
    this.loading.set(true);
    this.cartService.getAvailableCoupons().subscribe({
      next: (coupons) => {
        this.availableCoupons.set(coupons);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading available coupons:', error);
        this.loading.set(false);
      }
    });
  }

  isExpired(coupon: Coupon): boolean {
    return new Date(coupon.validUntil) < new Date();
  }

  isNotYetValid(coupon: Coupon): boolean {
    return new Date(coupon.validFrom) > new Date();
  }

  getCouponStatusText(coupon: Coupon): string {
    if (this.isExpired(coupon)) return 'Expired';
    if (this.isNotYetValid(coupon)) return 'Coming Soon';
    return 'Available';
  }

  getCouponStatusClass(coupon: Coupon): string {
    if (this.isExpired(coupon)) return 'bg-red-100 text-red-800';
    if (this.isNotYetValid(coupon)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  }
}
