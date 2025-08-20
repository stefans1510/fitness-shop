import { Component, inject, OnInit } from '@angular/core';
import { OrderService } from '../../../core/services/order.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '../../../shared/models/order';
import { MatCardModule } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AddressPipe } from '../../../shared/pipes/address.pipe';
import { PaymentCardPipe } from "../../../shared/pipes/payment-card.pipe";
import { AccountService } from '../../../core/services/account.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-order-detailed',
  imports: [
    MatCardModule,
    MatButton,
    DatePipe,
    CurrencyPipe,
    AddressPipe,
    PaymentCardPipe
],
  templateUrl: './order-detailed.component.html',
  styleUrl: './order-detailed.component.scss'
})
export class OrderDetailedComponent implements OnInit {
  private orderService = inject(OrderService);
  private activatedRoute = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  order?: Order;
  buttonText = this.accountService.isAdmin() ? 'Return to Admin' : 'Return to Orders';

  ngOnInit(): void {
    this.loadOrder();
  }

  onReturnClick() {
    this.accountService.isAdmin()
      ? this.router.navigateByUrl('/admin')  //if admin, navigate to admin
      : this.router.navigateByUrl('/orders'); //else navigate to orders
  }

  loadOrder() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');  //get id from route

    if (!id) return;

    const loadOrderData = this.accountService.isAdmin()
      ? this.adminService.getOrder(+id)  //if admin, use admin service
      : this.orderService.getOrderDetailed(+id); //else use order service

    loadOrderData.subscribe({
      next: order => this.order = order
    });
  }
}
