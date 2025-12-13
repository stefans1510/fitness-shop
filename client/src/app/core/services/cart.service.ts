import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Cart, CartItem } from '../../shared/models/cart';
import { Product } from '../../shared/models/product';
import { map, firstValueFrom, of } from 'rxjs';
import { DeliveryMethod } from '../../shared/models/deliveryMethod';
import { Coupon } from '../../shared/models/coupon';
import { ShopService } from './shop.service';
import { StockService } from './stock.service';
import { SnackbarService } from './snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private shopService = inject(ShopService);
  private stockService = inject(StockService);
  private snackbar = inject(SnackbarService);
  cart = signal<Cart | null>(null);
  itemCount = computed(() => {
    return this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0);
  });
  selectedDelivery = signal<DeliveryMethod | null>(null);
  appliedCoupon = signal<{code: string, discount: number, type: number} | null>(null);
  totals = computed(() => {
    const cart = this.cart();
    const delivery = this.selectedDelivery();
    const coupon = this.appliedCoupon();

    if (!cart) return null;
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = delivery ? delivery.price : 0;
    const discount = coupon ? coupon.discount : 0;
    return {
      subtotal,
      shipping,
      discount,
      total: subtotal + shipping - discount
    }
  });

  getCart(id: string) {
    return this.http.get<Cart>(this.baseUrl + 'shoppingcart?id=' + id).pipe(
      map(cart => {
        this.cart.set(cart);
        
        // Restore coupon state if cart has discount applied
        if (cart.couponCode && cart.discountAmount && cart.discountAmount > 0) {
          this.appliedCoupon.set({
            code: cart.couponCode,
            discount: cart.discountAmount,
            type: 1 // Assuming type 1 for now, we might need to store this too
          });
        } else {
          this.appliedCoupon.set(null);
        }
        
        return cart;
      })
    );
  }

  setCart(cart: Cart) {
    return this.http.post<Cart>(this.baseUrl + 'shoppingcart', cart).subscribe({
      next: cart => this.cart.set(cart)
    });
  }

  async addItemToCart(item: CartItem | Product, quantity = 1) {
    const cart = this.cart() ?? this.createCart();

    if (this.isProduct(item)) {
      item = this.mapProductToCartItem(item);
    }

    const productId = this.isProduct(item) ? item.id : item.productId;
    const currentCartQuantity = this.getCartItemQuantity(productId);

    try {
      const stockInfo = await firstValueFrom(this.stockService.getAvailableStock(productId));
      
      if (stockInfo.isOutOfStock) {
        this.snackbar.error('Sorry, this product is currently out of stock');
        return;
      }

      // Calculate how many we can actually add
      const maxCanAdd = Math.max(0, stockInfo.availableStock - currentCartQuantity);
      
      if (maxCanAdd === 0) {
        return;  // Since button should be disabled, keep as safety net
      }

      // Add the requested quantity (should always be within limits due to UI constraints)
      const actualQuantityToAdd = Math.min(quantity, maxCanAdd);

      this.snackbar.success(`Added ${actualQuantityToAdd} item(s) to cart`);

      // Add the actual quantity we can add
      cart.items = this.addOrUpdateItem(cart.items, item, actualQuantityToAdd);
      this.setCart(cart);
      
    } catch (error) {
      console.error('Error checking stock availability:', error);
      this.snackbar.error('Unable to verify stock availability. Please try again.');
    }
  }

  removeItemFromCart(productId: number, quantity = 1) {
    const cart = this.cart();
    
    if(!cart) return;  //break out of function if no cart

    const index = cart.items.findIndex(x => x.productId === productId);

    if(index !== -1) {  //product is in cart
      if (cart.items[index].quantity > quantity) {
        cart.items[index].quantity -= quantity; //reduce num of items by passed qty param 
      } else {
        cart.items.splice(index, 1);
      }
      if (cart.items.length === 0) {
        this.deleteCart();
      } else {
        this.setCart(cart);
      }
    }
  }

  deleteCart() {
    this.http.delete(this.baseUrl + 'shoppingcart?id=' + this.cart()?.id).subscribe({
      next: () => {
        localStorage.removeItem('cart_id');
        this.cart.set(null);
        this.appliedCoupon.set(null);
      }
    })
  }

  addOrUpdateItem(items: CartItem[], item: CartItem, quantity: number): CartItem[] {
    const index = items.findIndex(x => x.productId === item.productId);

    if (index === -1) {
      item.quantity = quantity;
      items.push(item);
    } else {
      items[index].quantity += quantity;
    }

    return items;
  }

  private mapProductToCartItem(item: Product): CartItem {
    // Use discounted price if available (for company users), otherwise use regular price
    const effectivePrice = item.hasDiscount && item.discountedPrice ? item.discountedPrice : item.price;
    
    return {
      productId: item.id,
      productName: item.name,
      price: effectivePrice,
      quantity: 0,
      pictureUrl: item.pictureUrl,
      type: item.type,
      brand: item.brand
    }
  }

  private isProduct(item: CartItem | Product): item is Product {
    return (item as Product).id !== undefined;
  }

  createCart(): Cart {
    const cart = new Cart();
    localStorage.setItem('cart_id', cart.id);

    return cart;
  }

  // Clear cart completely (for logout)
  clearCart() {
    localStorage.removeItem('cart_id');
    this.cart.set(null);
    this.selectedDelivery.set(null);
    this.appliedCoupon.set(null);
  }

  // Check if cart is expired and needs to be recreated
  async validateCart(): Promise<boolean> {
    const cart = this.cart();
    if (!cart) return false;

    try {
      // Try to get the cart from the server to validate it still exists
      const serverCart = await firstValueFrom(this.getCart(cart.id));
      return serverCart !== null;
    } catch (error) {
      console.error('Cart validation failed:', error);
      // If cart validation fails, clear it
      this.clearCart();
      return false;
    }
  }

  // Get current quantity of a product in the cart
  getCartItemQuantity(productId: number): number {
    const cart = this.cart();
    if (!cart) return 0;
    
    const item = cart.items.find(x => x.productId === productId);
    return item ? item.quantity : 0;
  }

  // Update cart item prices based on current user type (company vs regular user)
  async updateCartPricesForUserType(): Promise<void> {
    const cart = this.cart();
    if (!cart || cart.items.length === 0) return;

    let hasUpdates = false;
    let priceReductions = 0;
    const updatedItems: CartItem[] = [];

    // Fetch current product information with updated prices for current user
    for (const cartItem of cart.items) {
      try {
        const product = await firstValueFrom(this.shopService.getProduct(cartItem.productId));
        if (product) {
          const effectivePrice = product.hasDiscount && product.discountedPrice 
            ? product.discountedPrice 
            : product.price;
          
          // Check if price changed
          if (Math.abs(cartItem.price - effectivePrice) > 0.01) {
            hasUpdates = true;
            // Count if it's a price reduction (discount applied)
            if (effectivePrice < cartItem.price) {
              priceReductions++;
            }
          }

          updatedItems.push({
            ...cartItem,
            price: effectivePrice
          });
        } else {
          // Keep original item if product not found
          updatedItems.push(cartItem);
        }
      } catch (error) {
        console.error('Error fetching product for cart update:', error);
        // Keep original item on error
        updatedItems.push(cartItem);
      }
    }

    // Update cart if prices changed
    if (hasUpdates) {
      const updatedCart = { ...cart, items: updatedItems };
      
      // Wait for the cart to be properly saved before continuing
      return new Promise((resolve) => {
        this.http.post<Cart>(this.baseUrl + 'shoppingcart', updatedCart).subscribe({
          next: (savedCart) => {
            this.cart.set(savedCart);
            
            // Show feedback if discounts were applied
            if (priceReductions > 0) {
              this.snackbar.success(`Company discount applied to ${priceReductions} item${priceReductions > 1 ? 's' : ''} in your cart!`);
            }
            resolve();
          },
          error: (error) => {
            console.error('Error saving updated cart:', error);
            resolve(); // Still resolve to prevent hanging
          }
        });
      });
    }
  }

  // Validate entire cart stock availability
  async validateCartStock(): Promise<{valid: boolean, issues: string[]}> {
    const cart = this.cart();
    if (!cart || cart.items.length === 0) {
      return { valid: true, issues: [] };
    }

    const issues: string[] = [];
    
    try {
      const stockChecks = cart.items.map(item => ({
        productId: item.productId,
        requestedQuantity: item.quantity
      }));

      const results = await firstValueFrom(
        this.stockService.checkMultipleStockAvailability(stockChecks)
      );

      for (const result of results) {
        if (!result.isAvailable) {
          const cartItem = cart.items.find(x => x.productId === result.productId);
          const stockInfo = await firstValueFrom(this.stockService.getAvailableStock(result.productId));
          
          if (stockInfo.isOutOfStock) {
            issues.push(`${cartItem?.productName || 'Product'} is out of stock`);
          } else {
            issues.push(`${cartItem?.productName || 'Product'}: only ${stockInfo.availableStock} available (you have ${cartItem?.quantity} in cart)`);
          }
        }
      }

      return { valid: issues.length === 0, issues };
    } catch (error) {
      console.error('Error validating cart stock:', error);
      return { valid: false, issues: ['Unable to validate stock availability'] };
    }
  }

  // Apply coupon to cart
  applyCoupon(couponCode: string) {
    const cart = this.cart();
    if (!cart) {
      throw new Error('No cart available');
    }

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    return this.http.post<{discount: number, type: number}>(
      this.baseUrl + 'coupons/validate', 
      { 
        code: couponCode, 
        orderAmount: subtotal,
        cartId: cart.id 
      }
    ).pipe(
      map(response => {
        this.appliedCoupon.set({
          code: couponCode,
          discount: response.discount,
          type: response.type
        });
        
        // Update cart with coupon code and discount amount
        const updatedCart = { ...cart, couponCode: couponCode, discountAmount: response.discount };
        this.setCart(updatedCart);
        
        return response;
      })
    );
  }

  // Remove applied coupon
  removeCoupon() {
    this.appliedCoupon.set(null);
    
    // Clear coupon from cart
    const cart = this.cart();
    if (cart) {
      const updatedCart = { ...cart, couponCode: undefined, discountAmount: 0 };
      this.setCart(updatedCart);
    }
    
    return of(null);
  }

  // Clear coupon when cart is cleared
  clearCoupon() {
    this.appliedCoupon.set(null);
  }

  // Get available coupons for the current user
  getAvailableCoupons() {
    return this.http.get<Coupon[]>(this.baseUrl + 'coupons/available');
  }
}
