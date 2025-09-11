import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmationDialogService } from '../../../core/services/confirmation-dialog.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User } from '../../../shared/models/user';
import { UserParameters } from '../../../shared/models/userParameters';
import { Pagination } from '../../../shared/models/pagination';
import { TextInputComponent } from '../../../shared/components/text-input/text-input.component';

@Component({
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatLabel,
    MatPaginatorModule,
    MatSelectModule,
    MatOptionModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    TextInputComponent
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private confirmationDialog = inject(ConfirmationDialogService);
  private snackbar = inject(SnackbarService);
  private formBuilder = inject(FormBuilder);
  
  users: User[] = [];
  pagination?: Pagination<User>;
  displayedColumns: string[] = ['email', 'firstName', 'lastName', 'userType', 'actions'];
  
  // Parameters for API
  userParameters = new UserParameters();
  
  // Role filtering options
  roleFilterOptions = ['All', 'Admin', 'Customer', 'Company'];
  
  // Loading states
  loading = false;
  
  // Create admin form state
  showCreateAdminForm = false;
  createAdminLoading = false;
  
  // Validation errors (same as register component)
  validationErrors?: string[];
  
  // Create admin form (same validation as register component)
  adminForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    password: ['', Validators.required]
  });

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

  getRoleClass(role: string): string {
    switch (role) {
      case 'Admin':
        return 'role-badge role-admin';
      case 'Company':
        return 'role-badge role-company';
      case 'Customer':
        return 'role-badge role-customer';
      default:
        return 'role-badge role-default';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'Admin':
        return 'admin_panel_settings';
      case 'Company':
        return 'business';
      case 'Customer':
        return 'person';
      default:
        return 'help';
    }
  }

  onSearch() {
    this.userParameters.pageIndex = 1;
    this.loadUsers();
  }

  onRoleFilterChange() {
    this.userParameters.pageIndex = 1;
    this.loadUsers();
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

  openCreateAdminDialog() {
    this.showCreateAdminForm = !this.showCreateAdminForm;
    if (!this.showCreateAdminForm) {
      // Reset form when closing
      this.adminForm.reset();
      this.validationErrors = undefined;
    }
  }

  onSubmitAdminForm() {
    this.createAdminLoading = true;
    this.validationErrors = undefined; // Clear previous errors
    
    this.adminService.createAdminUser(this.adminForm.value).subscribe({
      next: (response) => {
        this.snackbar.success(response.message || 'Admin user created successfully');
        this.showCreateAdminForm = false;
        this.adminForm.reset();
        this.validationErrors = undefined;
        this.loadUsers(); // Reload the users list
        this.createAdminLoading = false;
      },
      error: (errors) => {
        this.validationErrors = errors;
        this.createAdminLoading = false;
      }
    });
  }

  onCancelAdminForm() {
    this.showCreateAdminForm = false;
    this.adminForm.reset();
    this.validationErrors = undefined;
  }
} 
