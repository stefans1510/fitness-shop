import { Component } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { AdminUsersComponent } from "./admin-users/admin-users.component";
import { AdminOrdersComponent } from "./admin-orders/admin-orders.component";
import { AdminProductsComponent } from "./admin-products/admin-products.component";

@Component({
  selector: 'app-admin',
  imports: [
    MatTabGroup,
    MatTab,
    AdminUsersComponent,
    AdminOrdersComponent,
    AdminProductsComponent
],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  // private adminService = inject(AdminService);
  // displayedColumns: string[] = ['id', 'buyerEmail', 'orderDate', 'status', 'action'];
  // dataSource = new MatTableDataSource<Order>([]);
  // orderParameters = new OrderParameters;
  // totalItems = 0;
  // statusOptions = ['All', 'PaymentReceived', 'PaymentMissmatch', 'Refunded', 'Pending'];

  // @ViewChild(MatPaginator) paginator!: MatPaginator;

  // ngOnInit(): void {
  //   this.loadOrders();
  // }

  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  // }

  // loadOrders() {
  //   this.adminService.getOrders(this.orderParameters).subscribe({
  //     next: response => {
  //       if (response.data) {
  //         this.dataSource.data = response.data;
  //         this.totalItems = response.count;
  //       }
  //     }
  //   });
  // }

  // onPageChange(event: any) {
  //   this.orderParameters.pageNumber = event.pageIndex + 1;
  //   this.orderParameters.pageSize = event.pageSize;
  //   this.loadOrders();
  // }

  // onFilterChange(event: any) {
  //   this.orderParameters.filter = event.value;
  //   this.orderParameters.pageNumber = 1; // Reset to first page on filter change
  //   this.loadOrders();
  // }
}
