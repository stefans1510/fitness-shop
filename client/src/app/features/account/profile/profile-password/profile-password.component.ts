import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../../../core/services/account.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { Router } from '@angular/router';
import { TextInputComponent } from '../../../../shared/components/text-input/text-input.component';
import { FormErrorHandlerService } from '../../../../shared/services/form-error-handler.service';

@Component({
  selector: 'app-profile-password',
  imports: [
    MatButtonModule,
    MatIcon,
    ReactiveFormsModule,
    TextInputComponent
  ],
  templateUrl: './profile-password.component.html',
  styleUrl: './profile-password.component.scss'
})
export class ProfilePasswordComponent {
  private accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private formErrorHandler = inject(FormErrorHandlerService);

  passwordForm!: FormGroup;

  constructor() {
    this.passwordForm = new FormGroup({
      currentPassword: new FormControl('', [Validators.required]),
      newPassword: new FormControl('', [Validators.required]),
      confirmPassword: new FormControl('', [Validators.required])
    });

    // Set up automatic server error clearing - handled by service
    this.formErrorHandler.setupAutoErrorClear(this.passwordForm);
  }



  onSubmit() {
    if (this.passwordForm.valid) {
      const formValue = this.passwordForm.value;
      
      this.accountService.changePassword({
        currentPassword: formValue.currentPassword!,
        newPassword: formValue.newPassword!,
        confirmPassword: formValue.confirmPassword!
      }).subscribe({
        next: () => {
          this.snackbar.success('Password changed successfully! Please sign in with new credentials');
          // Logout user and redirect to login
          this.accountService.logout().subscribe({
            next: () => {
              this.router.navigateByUrl('/account/login');
            }
          });
        },
        error: errors => {
          this.formErrorHandler.mapServerErrorsToForm(this.passwordForm, errors);
        }
      });
    }
  }

  get isFormValid() {
    return this.passwordForm.valid;
  }


}
