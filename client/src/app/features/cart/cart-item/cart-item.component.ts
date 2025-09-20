import { Component, inject, input, OnInit, signal, OnDestroy } from '@angular/core';
import { CartItem } from '../../../shared/models/cart';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { CurrencyPipe } from '@angular/common';
import { CartService } from '../../../core/services/cart.service';
import { StockService } from '../../../core/services/stock.service';
import { Subject, takeUntil } from 'rxjs';
import { StockInfo } from '../../../shared/models/stock';

@Component({
  selector: 'app-cart-item',
  imports: [
    RouterLink,
    MatButton,
    MatIcon,
    CurrencyPipe
  ],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss'
})
export class CartItemComponent implements OnInit, OnDestroy {
  item = input.required<CartItem>();
  
  cartService = inject(CartService);
  stockService = inject(StockService);
  
  stockInfo = signal<StockInfo | null>(null);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadStockInfo();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStockInfo() {
    this.stockService.getAvailableStock(this.item().productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: stockInfo => this.stockInfo.set(stockInfo),
        error: error => {
          console.error('Error loading stock info:', error);
          this.stockInfo.set(null);
        }
      });
  }

  async incrementQuantity() {
    await this.cartService.addItemToCart(this.item());
    this.loadStockInfo(); // Refresh stock info after adding
  }

  decrementQuantity() {
    this.cartService.removeItemFromCart(this.item().productId);
    this.loadStockInfo(); // Refresh stock info after removing
  }

  removeItemFromCart() {
    this.cartService.removeItemFromCart(this.item().productId, this.item().quantity);
  }

  get maxAvailableQuantity(): number {
    return this.stockInfo()?.availableStock ?? 0;
  }
}
