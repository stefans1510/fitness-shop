import { Component, inject, OnInit } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatLabel, MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ShopService } from '../../../core/services/shop.service';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Product } from '../../../shared/models/product';
import { ShopParams } from '../../../shared/models/shopParams';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-admin-products',
  imports: [
    MatTableModule,
    MatPaginator,
    MatIcon,
    MatSelectModule,
    MatLabel,
    MatTooltipModule,
    MatButton,
    MatIconButton,
    CurrencyPipe,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss'
})
export class AdminProductsComponent implements OnInit {
  private shopService = inject(ShopService);
  private adminService = inject(AdminService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  private snackbar = inject(SnackbarService);
  displayedColumns: string[] = ['id', 'picture', 'name', 'brand', 'type', 'price', 'quantityInStock', 'actions'];
  dataSource = new MatTableDataSource<Product>([]);
  totalItems = 0;
  shopParameters = new ShopParams();
  productTypes: string[] = [];
  productBrands: string[] = [];
  products: Product[] = [];

  ngOnInit() {
    this.loadProductTypes();
    this.loadProductBrands();
    this.loadProducts();
  }

  loadProducts() {
    this.shopService.getProducts(this.shopParameters).subscribe({
      next: response => {
        if (response.data) {
          this.dataSource.data = response.data;
          this.totalItems = response.count;
        }
      }
    });
  }

  loadProductTypes() {
    this.shopService.getTypes().subscribe({
      next: response => this.productTypes = response
    });
  }

  loadProductBrands() {
    this.shopService.getBrands().subscribe({ 
      next: brands => this.productBrands = brands
    });
  }

  onFilterChange() {
    this.shopParameters.pageIndex = 1; // Reset to first page
    this.loadProducts();
  }

  onSearch() {
    this.shopParameters.pageIndex = 1;
    this.loadProducts();
  }

  resetFilters() {
    this.shopParameters = new ShopParams();
    this.loadProducts();
  }

  onPageChange(event: PageEvent) {
    this.shopParameters.pageIndex = event.pageIndex + 1;
    this.shopParameters.pageSize = event.pageSize;
    this.loadProducts();
  }

  async openConfirmDialog(product: Product) {
    const confirmed = await this.confirmationDialogService.confirm(
      'Delete Product',
      `Are you sure you want to delete the product ${product.name}?`
    );

    if (confirmed) {
      this.deleteProduct(product.id);
    }
  }

  deleteProduct(id: number) {
    this.adminService.deleteProduct(id).subscribe({
      next: () => {
        this.snackbar.success('Product deleted successfully');
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.snackbar.error('Error deleting product. Please try again.');
      }
    });
  }
}
