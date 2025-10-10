import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SignalrService } from '../../../core/services/signalr.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AddressPipe } from '../../../shared/pipes/address.pipe';
import { PaymentCardPipe } from '../../../shared/pipes/payment-card.pipe';
import { OrderService } from '../../../core/services/order.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-checkout-success',
  imports: [
    RouterLink,
    MatButton,
    MatProgressSpinner,
    DatePipe,
    CurrencyPipe,
    AddressPipe,
    PaymentCardPipe
  ],
  templateUrl: './checkout-success.component.html',
  styleUrl: './checkout-success.component.scss'
})
export class CheckoutSuccessComponent implements OnInit, OnDestroy{
  signalrService = inject(SignalrService);
  private orderService = inject(OrderService);

  async ngOnInit() {
    // If no SignalR signal, immediately try to fetch the most recent order
    if (!this.signalrService.orderSignal()) {
      try {
        console.log('No SignalR signal, fetching most recent order...');
        const orders = await firstValueFrom(this.orderService.getOrdersForUser());
        if (orders && orders.length > 0) {
          // Get the most recent order (should be the one just created)
          const mostRecentOrder = orders[0];
          this.signalrService.orderSignal.set(mostRecentOrder);
          console.log('Set most recent order as completed order', mostRecentOrder);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      }
    }
  }

  ngOnDestroy(): void {
    this.orderService.orderComplete = false;
    this.signalrService.orderSignal.set(null);
  }
}
