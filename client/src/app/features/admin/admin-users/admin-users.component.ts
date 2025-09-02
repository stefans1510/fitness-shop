import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User } from '../../../shared/models/user';
import { UserParameters } from '../../../shared/models/userParameters';
import { Pagination } from '../../../shared/models/pagination';

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    MatMenuModule,
    FormsModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackbar = inject(SnackbarService);
  
  users: User[] = [];
  pagination?: Pagination<User>;
  displayedColumns: string[] = ['email', 'firstName', 'lastName', 'roles', 'actions'];
  
  // Parameters for API
  userParameters = new UserParameters();
  
  // Role filtering options
  roleFilterOptions = ['All', 'Admin', 'Customer'];
  
  // Available roles for changing user roles
  availableRoles = ['Admin', 'Customer'];
  
  // Loading states
  loading = false;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    
    this.adminService.getUsers(this.userParameters).subscribe({
      next: (result) => {
        this.users = result.data;
        this.pagination = result;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.userParameters.pageIndex = 1;
    this.loadUsers();
  }

  onRoleFilterChange() {
    this.userParameters.pageIndex = 1;
    this.loadUsers();
  }

  onUserRoleChange(user: User, newRole: string) {
    this.adminService.changeUserRole(user.id!, newRole).subscribe({
      next: (response) => {
        this.snackbar.success(response.message || 'User role updated successfully');
        this.loadUsers(); // Reload to get updated role data
      },
      error: (error) => {
        console.error('Error changing user role:', error);
        this.snackbar.error('Error changing user role. Please try again.');
        this.loadUsers(); // Reload to revert any optimistic updates
      }
    });
  }

  onPageChange(event: any) {
    this.userParameters.pageIndex = event.pageIndex + 1;
    this.userParameters.pageSize = event.pageSize;
    this.loadUsers();
  }

  async deleteUser(user: User) {
    const confirmed = await this.confirmationDialog.confirm(
      'Delete User',
      `Are you sure you want to delete user: ${user.email}? This action cannot be undone.`
    );
    
    if (confirmed) {
      this.adminService.deleteUser(user.id!).subscribe({
        next: (response) => {
          this.snackbar.success(response.message || 'User deleted successfully');
          this.loadUsers(); // Reload the list
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackbar.error('Error deleting user. Please try again.');
        }
      });
    }
  }
} 
