import { Component, inject, OnInit } from '@angular/core';
import { CartService } from '../../core/services/cart.service';
import { CartItemComponent } from "./cart-item/cart-item.component";
import { OrderSummaryComponent } from "../../shared/components/order-summary/order-summary.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { Router } from '@angular/router';
import { AccountService } from '../../core/services/account.service';

@Component({
  selector: 'app-cart',
  imports: [CartItemComponent, OrderSummaryComponent, EmptyStateComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  private router = inject(Router);
  private accountService = inject(AccountService);
  cartService = inject(CartService);

  async ngOnInit() {
    // Update cart prices if user is a company user
    if (this.accountService.currentUser() && this.accountService.isCompanyUser()) {
      await this.cartService.updateCartPricesForUserType();
    }
  }

  onAction() {
    this.router.navigateByUrl('/shop');
  }
}
