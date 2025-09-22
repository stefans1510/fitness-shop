import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { DeliveryMethod } from '../../../shared/models/deliveryMethod';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryMethodFormDialogComponent } from './delivery-method-form-dialog/delivery-method-form-dialog.component';

@Component({
  selector: 'app-admin-delivery-methods',
  imports: [
    MatTableModule,
    MatIcon,
    MatTooltipModule,
    MatButton,
    MatIconButton,
    CurrencyPipe,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './admin-delivery-methods.component.html',
  styleUrl: './admin-delivery-methods.component.scss'
})
export class AdminDeliveryMethodsComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmationDialogService = inject(ConfirmationDialogService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  
  displayedColumns: string[] = ['id', 'shortName', 'deliveryTime', 'description', 'price', 'actions'];
  dataSource = new MatTableDataSource<DeliveryMethod>([]);
  deliveryMethods = signal<DeliveryMethod[]>([]);

  ngOnInit() {
    this.loadDeliveryMethods();
  }

  loadDeliveryMethods() {
    this.adminService.getDeliveryMethods().subscribe({
      next: response => {
        this.deliveryMethods.set(response);
        this.dataSource.data = response;
      },
      error: error => {
        console.error('Error loading delivery methods:', error);
        this.snackbar.error('Error loading delivery methods');
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(DeliveryMethodFormDialogComponent, {
      width: '500px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createDeliveryMethod(result);
      }
    });
  }

  openEditDialog(deliveryMethod: DeliveryMethod) {
    const dialogRef = this.dialog.open(DeliveryMethodFormDialogComponent, {
      width: '500px',
      data: { 
        isEdit: true, 
        deliveryMethod: { ...deliveryMethod } 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateDeliveryMethod(result);
      }
    });
  }

  createDeliveryMethod(deliveryMethod: DeliveryMethod) {
    this.adminService.createDeliveryMethod(deliveryMethod).subscribe({
      next: () => {
        this.snackbar.success('Delivery method created successfully');
        this.loadDeliveryMethods();
      },
      error: error => {
        console.error('Error creating delivery method:', error);
        this.snackbar.error('Error creating delivery method');
      }
    });
  }

  updateDeliveryMethod(deliveryMethod: DeliveryMethod) {
    this.adminService.updateDeliveryMethod(deliveryMethod).subscribe({
      next: () => {
        this.snackbar.success('Delivery method updated successfully');
        this.loadDeliveryMethods();
      },
      error: error => {
        console.error('Error updating delivery method:', error);
        this.snackbar.error('Error updating delivery method');
      }
    });
  }

  async openConfirmDialog(deliveryMethod: DeliveryMethod) {
    const confirmed = await this.confirmationDialogService.confirm(
      'Delete Delivery Method',
      `Are you sure you want to delete the delivery method "${deliveryMethod.shortName}"?`
    );

    if (confirmed) {
      this.deleteDeliveryMethod(deliveryMethod.id);
    }
  }

  deleteDeliveryMethod(id: number) {
    this.adminService.deleteDeliveryMethod(id).subscribe({
      next: () => {
        this.snackbar.success('Delivery method deleted successfully');
        this.loadDeliveryMethods();
      },
      error: error => {
        console.error('Error deleting delivery method:', error);
        if (error.error?.message) {
          this.snackbar.error(error.error.message);
        } else {
          this.snackbar.error('Error deleting delivery method. Please try again.');
        }
      }
    });
  }
}