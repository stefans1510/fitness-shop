import { Component, inject, Input, OnInit, signal, OnDestroy } from '@angular/core';
import { Product } from '../../../shared/models/product';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { CurrencyPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { StockService, StockInfo } from '../../../core/services/stock.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-item',
  imports: [
    MatCard,
    MatCardContent,
    CurrencyPipe,
    MatCardActions,
    MatButton,
    MatIcon,
    RouterLink
  ],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.scss'
})
export class ProductItemComponent implements OnInit, OnDestroy {
  @Input() product?: Product;
  cartService = inject(CartService);
  stockService = inject(StockService);
  
  stockInfo = signal<StockInfo | null>(null);
  private destroy$ = new Subject<void>();

  ngOnInit() {
    if (this.product) {
      this.loadStockInfo();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStockInfo() {
    if (!this.product) return;

    this.stockService.getAvailableStock(this.product.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: stockInfo => this.stockInfo.set(stockInfo),
        error: error => {
          console.error('Error loading stock info:', error);
          this.stockInfo.set(null);
        }
      });
  }

  get isOutOfStock(): boolean {
    return this.stockInfo()?.isOutOfStock ?? false;
  }

  get isLowStock(): boolean {
    const stock = this.stockInfo();
    return stock ? stock.availableStock > 0 && stock.availableStock <= 5 : false;
  }

}
