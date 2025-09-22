import { Component, OnInit, inject } from '@angular/core';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { AdminUsersComponent } from "./admin-users/admin-users.component";
import { AdminOrdersComponent } from "./admin-orders/admin-orders.component";
import { AdminProductsComponent } from "./admin-products/admin-products.component";
import { AdminCategoriesComponent } from "./admin-categories/admin-categories.component";
import { AdminDeliveryMethodsComponent } from "./admin-delivery-methods/admin-delivery-methods.component";
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  imports: [
    MatTabGroup,
    MatTab,
    AdminUsersComponent,
    AdminOrdersComponent,
    AdminProductsComponent,
    AdminCategoriesComponent,
    AdminDeliveryMethodsComponent
],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  selectedTabIndex = 0;

  ngOnInit() {
    // Check for tab parameter in query params
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab) {
        this.selectedTabIndex = this.getTabIndexFromName(tab);
      }
    });
  }

  onTabChange(index: number) {
    const tabName = this.getTabNameFromIndex(index);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName },
      queryParamsHandling: 'merge'
    });
  }

  private getTabIndexFromName(tabName: string): number {
    switch (tabName.toLowerCase()) {
      case 'orders': return 0;
      case 'products': return 1;
      case 'categories': return 2;
      case 'delivery-methods': return 3;
      case 'users': return 4;
      default: return 0;
    }
  }

  private getTabNameFromIndex(index: number): string {
    switch (index) {
      case 0: return 'orders';
      case 1: return 'products';
      case 2: return 'categories';
      case 3: return 'delivery-methods';
      case 4: return 'users';
      default: return 'orders';
    }
  }

}
