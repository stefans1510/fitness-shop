import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';

import { ShopService } from '../../../core/services/shop.service';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-admin-categories',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    RouterLink
  ],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss'
})
export class AdminCategoriesComponent implements OnInit {
  private shopService = inject(ShopService);
  private adminService = inject(AdminService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackbar = inject(SnackbarService);
  
  brands: string[] = [];
  types: string[] = [];
  
  displayedColumns: string[] = ['name', 'actions'];
  
  // Loading states
  loading = false;

  ngOnInit() {
    this.loadBrands();
    this.loadTypes();
  }

  loadBrands() {
    this.shopService.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
      },
      error: (error) => {
        console.error('Error loading brands:', error);
      }
    });
  }

  loadTypes() {
    this.shopService.getTypes().subscribe({
      next: (types) => {
        this.types = types;
      },
      error: (error) => {
        console.error('Error loading types:', error); 
      }
    });
  }

  async deleteBrand(brand: string) {
    const confirmed = await this.confirmationDialog.confirm(
      'Delete Brand', 
      `Are you sure you want to delete brand: "${brand}"?\n\nNote: This will only work if no products are using this brand.`
    );
    
    if (confirmed) {
      this.adminService.deleteBrand(brand).subscribe({
        next: (response: any) => {
          this.snackbar.success(response.message || 'Brand processed successfully');
          this.loadBrands(); // Refresh the list
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Error deleting brand';
          this.snackbar.error(errorMessage);
          console.error('Error deleting brand:', error);
        }
      });
    }
  }

  async deleteType(type: string) {
    const confirmed = await this.confirmationDialog.confirm(
      'Delete Type', 
      `Are you sure you want to delete type: "${type}"?\n\nNote: This will only work if no products are using this type.`
    );
    
    if (confirmed) {
      this.adminService.deleteType(type).subscribe({
        next: (response: any) => {
          this.snackbar.success(response.message || 'Type processed successfully');
          this.loadTypes(); // Refresh the list
        },
        error: (error) => {
          const errorMessage = error.error?.message || 'Error deleting type';
          this.snackbar.error(errorMessage);
          console.error('Error deleting type:', error);
        }
      });
    }
  }
}