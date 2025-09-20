import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../../shared/models/product';
import { CurrencyPipe } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDivider } from '@angular/material/divider';
import { CartService } from '../../../core/services/cart.service';
import { StockService } from '../../../core/services/stock.service';
import { StockInfo } from '../../../shared/models/stock';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-product-details',
  imports: [
    CurrencyPipe,
    MatButton,
    MatIcon,
    MatFormField,
    MatInput,
    MatLabel,
    MatDivider,
    FormsModule
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  private shopService = inject(ShopService);
  private activatedRoute = inject(ActivatedRoute);
  private cartService = inject(CartService);
  private stockService = inject(StockService);
  private snackbar = inject(SnackbarService);
  private destroy$ = new Subject<void>();

  product?: Product;
  quantityInCart = 0;
  quantity = 1;
  stockInfo = signal<StockInfo | null>(null);

  ngOnInit(): void {
    this.loadProduct();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProduct() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (!id) return;
    this.shopService.getProduct(+id).subscribe({
      next: product => {
        this.product = product;
        this.updateQuantityInCart();
        this.loadStockInfo();
      },
      error: error => console.log(error)
    })
  }

  loadStockInfo() {
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

  async updateCart() {
    if (!this.product) return;
    
    const stockInfo = this.stockInfo();
    if (!stockInfo) {
      this.snackbar.error('Unable to verify stock availability');
      return;
    }

    // Validate quantity limits
    if (this.quantity < 0) {
      this.quantity = 0;
      return;
    }

    if (this.quantity > stockInfo.availableStock) {
      this.quantity = stockInfo.availableStock;
      this.snackbar.error(`Only ${stockInfo.availableStock} items available`);
      return;
    }

    if (this.quantity > this.quantityInCart) {
      // Adding items
      const itemsToAdd = this.quantity - this.quantityInCart;
      await this.cartService.addItemToCart(this.product, itemsToAdd);
      this.updateQuantityInCart();
      this.loadStockInfo(); // Refresh stock info
    } else if (this.quantity < this.quantityInCart) {
      // Removing items
      const itemsToRemove = this.quantityInCart - this.quantity;
      this.cartService.removeItemFromCart(this.product.id, itemsToRemove);
      this.updateQuantityInCart();
      this.loadStockInfo(); // Refresh stock info
    }
  }

  updateQuantityInCart() {
    this.quantityInCart = this.cartService.cart()?.items
      .find(x => x.productId === this.product?.id)?.quantity || 0;
    this.quantity = this.quantityInCart || 1;
  }

  getButtonText() {
    return this.quantityInCart > 0 ? 'Update Cart' : 'Add to Cart';
  }

  get isOutOfStock(): boolean {
    return this.stockInfo()?.isOutOfStock ?? false;
  }

  get maxAvailableQuantity(): number {
    return this.stockInfo()?.availableStock ?? 0;
  }

  get isQuantityValid(): boolean {
    const stock = this.stockInfo();
    return stock ? this.quantity <= stock.availableStock && this.quantity >= 0 : true;
  }

  // Validate quantity input as user types
  onQuantityChange() {
    const stock = this.stockInfo();
    if (!stock) return;

    if (this.quantity < 0) {
      this.quantity = 0;
    }
    
    if (this.quantity > stock.availableStock) {
      this.quantity = stock.availableStock;
      this.snackbar.error(`Only ${stock.availableStock} items available`);
    }
  }
}
 