import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CurrencyPipe, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-order-summary',
  imports: [
    MatButton,
    RouterLink,
    MatFormField,
    MatLabel,
    MatInput,
    CurrencyPipe,
    ReactiveFormsModule,
    MatError
  ],
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.scss'
})
export class OrderSummaryComponent {
  cartService = inject(CartService);
  location = inject(Location);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);

  couponForm: FormGroup = this.fb.group({
    code: ['', [Validators.maxLength(50)]]
  });

  isApplyingCoupon = false;

  applyCoupon() {
    const couponCode = this.couponForm.get('code')?.value?.trim()?.toUpperCase();
    
    if (this.couponForm.valid && !this.isApplyingCoupon && couponCode) {
      this.isApplyingCoupon = true;
      
      this.cartService.applyCoupon(couponCode).subscribe({
        next: () => {
          this.snackbar.success(`Coupon ${couponCode} applied successfully!`);
          this.couponForm.reset();
          this.isApplyingCoupon = false;
        },
        error: (error) => {
          this.isApplyingCoupon = false;
          
          // Extract error message from HTTP error response
          let errorMessage = 'Failed to apply coupon';
          
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.status === 404) {
            errorMessage = 'Coupon code not found';
          } else if (error.status === 400) {
            errorMessage = 'Invalid coupon code';
          }
          
          this.snackbar.error(errorMessage);
        }
      });
    }
  }

  removeCoupon() {
    this.cartService.removeCoupon().subscribe({
      next: () => {
        this.snackbar.success('Coupon removed');
      },
      error: (error) => {
        this.snackbar.error(error.message || 'Failed to remove coupon');
      }
    });
  }
}
