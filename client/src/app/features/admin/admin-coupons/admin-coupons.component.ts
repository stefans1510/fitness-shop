import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Coupon } from '../../../shared/models/coupon';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CouponFormDialogComponent } from './coupon-form-dialog/coupon-form-dialog.component';

@Component({
  selector: 'app-admin-coupons',
  imports: [
    MatTableModule,
    MatIcon,
    MatTooltipModule,
    MatButton,
    MatIconButton,
    MatChipsModule,
    CurrencyPipe,
    DatePipe,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatDialogModule
  ],
  templateUrl: './admin-coupons.component.html',
  styleUrl: './admin-coupons.component.scss'
})
export class AdminCouponsComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  
  displayedColumns: string[] = [
    'id', 'code', 'description', 'type', 'value', 'validity', 'usage', 'status', 'actions'
  ];
  dataSource = new MatTableDataSource<Coupon>([]);
  coupons = signal<Coupon[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadCoupons();
  }

  loadCoupons() {
    this.loading.set(true);
    this.adminService.getCoupons().subscribe({
      next: response => {
        this.coupons.set(response);
        this.dataSource.data = response;
        this.loading.set(false);
      },
      error: error => {
        console.error('Error loading coupons:', error);
        this.snackbar.error('Error loading coupons');
        this.loading.set(false);
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CouponFormDialogComponent, {
      width: '600px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createCoupon(result);
      }
    });
  }

  openEditDialog(coupon: Coupon) {
    // Convert coupon to CreateCouponDto format for editing
    const couponDto = {
      code: coupon.code,
      description: coupon.description,
      type: coupon.type === 'Percentage' ? 1 : 2,
      value: coupon.value,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maximumDiscountAmount: coupon.maximumDiscountAmount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      usageLimit: coupon.usageLimit,
      isCustomerOnly: coupon.isCustomerOnly
    };

    const dialogRef = this.dialog.open(CouponFormDialogComponent, {
      width: '600px',
      data: { isEdit: true, coupon: couponDto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCoupon(coupon.id, result);
      }
    });
  }

  createCoupon(coupon: any) {
    this.adminService.createCoupon(coupon).subscribe({
      next: () => {
        this.snackbar.success('Coupon created successfully');
        this.loadCoupons();
      },
      error: error => {
        console.error('Error creating coupon:', error);
        // Extract error message for better user experience
        const errorMessage = error.error?.message || 'Error creating coupon';
        this.snackbar.error(errorMessage);
      }
    });
  }

  updateCoupon(id: number, coupon: any) {
    this.adminService.updateCoupon(id, coupon).subscribe({
      next: () => {
        this.snackbar.success('Coupon updated successfully');
        this.loadCoupons();
      },
      error: error => {
        console.error('Error updating coupon:', error);
        const errorMessage = error.error?.message || 'Error updating coupon';
        this.snackbar.error(errorMessage);
      }
    });
  }

  async toggleCouponStatus(coupon: Coupon) {
    const action = coupon.isActive ? 'deactivate' : 'activate';
    const confirmed = await this.confirmationDialogService.confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Coupon`,
      `Are you sure you want to ${action} the coupon "${coupon.code}"?`
    );

    if (confirmed) {
      if (coupon.isActive) {
        this.deactivateCoupon(coupon.id);
      } else {
        this.activateCoupon(coupon.id);
      }
    }
  }

  deactivateCoupon(id: number) {
    this.adminService.deactivateCoupon(id).subscribe({
      next: () => {
        this.snackbar.success('Coupon deactivated successfully');
        this.loadCoupons();
      },
      error: error => {
        console.error('Error deactivating coupon:', error);
        this.snackbar.error('Error deactivating coupon');
      }
    });
  }

  activateCoupon(id: number) {
    this.adminService.activateCoupon(id).subscribe({
      next: () => {
        this.snackbar.success('Coupon activated successfully');
        this.loadCoupons();
      },
      error: error => {
        console.error('Error activating coupon:', error);
        this.snackbar.error('Error activating coupon');
      }
    });
  }

  async deleteCoupon(coupon: Coupon) {
    const confirmed = await this.confirmationDialogService.confirm(
      'Delete Coupon',
      `Are you sure you want to permanently delete the coupon "${coupon.code}"? This action cannot be undone.`
    );

    if (confirmed) {
      this.adminService.deleteCoupon(coupon.id).subscribe({
        next: () => {
          this.snackbar.success('Coupon deleted successfully');
          this.loadCoupons();
        },
        error: error => {
          console.error('Error deleting coupon:', error);
          const errorMessage = error.error?.message || 'Error deleting coupon';
          this.snackbar.error(errorMessage);
        }
      });
    }
  }

  isExpired(coupon: Coupon): boolean {
    return new Date(coupon.validUntil) < new Date();
  }

  isNotYetValid(coupon: Coupon): boolean {
    return new Date(coupon.validFrom) > new Date();
  }
}