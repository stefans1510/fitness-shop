import { inject, Injectable } from '@angular/core';
import { CartService } from './cart.service';
import { forkJoin, of, tap } from 'rxjs';
import { AccountService } from './account.service';
import { SignalrService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class InitService {
  private cartService = inject(CartService);
  private accountService = inject(AccountService);
  private signalrService = inject(SignalrService);

  init() {
    const cartId = localStorage.getItem('cart_id');
    const cart$ = cartId ? this.cartService.getCart(cartId).pipe(
      tap(cart => {
        // If cart retrieval fails, clear the invalid cart ID
        if (!cart) {
          console.warn('Cart not found on server, clearing local cart ID');
          localStorage.removeItem('cart_id');
        }
      })
    ) : of(null);

    return forkJoin({
      cart: cart$,
      user: this.accountService.getUserInfo().pipe(
        tap(user => {
          if (user) {
            this.signalrService.createHubConnection();
            setTimeout(() => {  // Update cart prices based on user type after login
              this.cartService.updateCartPricesForUserType();
            }, 100); // Small delay to ensure cart is loaded first
          }
        })
      )
    });
  }
}
