import { Component, inject, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatLabel } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { OrderParameters } from '../../../shared/models/orderParameters';
import { Order } from '../../../shared/models/order';
import { RouterLink } from '@angular/router';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';

@Component({
  selector: 'app-admin-orders',
  imports: [
    MatTableModule,
    MatPaginator,
    MatIcon,
    MatSelectModule,
    MatLabel,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe,
    MatIconButton,
    RouterLink
],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss'
})
export class AdminOrdersComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  displayedColumns: string[] = ['id', 'buyerEmail', 'orderDate', 'total', 'status', 'actions'];
  dataSource = new MatTableDataSource<Order>([]);
  orderParameters = new OrderParameters;
  totalItems = 0;
  statusOptions = ['All', 'PaymentReceived', 'PaymentMissmatch', 'Refunded', 'Pending'];

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.adminService.getOrders(this.orderParameters).subscribe({
      next: response => {
        if (response.data) {
          this.dataSource.data = response.data;
          this.totalItems = response.count;
        }
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.orderParameters.pageNumber = event.pageIndex + 1;
    this.orderParameters.pageSize = event.pageSize;
    this.loadOrders();
  }

  onFilterChange(event: MatSelectChange) {
    this.orderParameters.filter = event.value;
    this.orderParameters.pageNumber = 1; // Reset to first page on filter change
    this.loadOrders();
  }

  async openConfirmDialog(orderId: number) {
    const confirmed = await this.confirmationDialogService.confirm(
      'Confirm Refund',
      'Are you sure you want to refund this order? This action cannot be undone.'
    )

    if (confirmed) {
      this.refundOrder(orderId);
    }
  }

  refundOrder(id: number) : void {
    this.adminService.refundOrder(id).subscribe({
      next: order => {
        this.dataSource.data = this.dataSource.data.map(o => o.id === id ? order : o)
      }
    });
  }
}
