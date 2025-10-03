import { Component, inject } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormGroup, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { AccountService } from '../../../core/services/account.service';
import { Router, RouterLink } from '@angular/router';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { TextInputComponent } from "../../../shared/components/text-input/text-input.component";
import { FormErrorHandlerService } from '../../../shared/services/form-error-handler.service';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, map, } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatButton,
    MatIcon,
    TextInputComponent,
    RouterLink
],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private accountService = inject(AccountService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private formErrorHandler = inject(FormErrorHandlerService);

  // Company registration state
  isCompanyRegistration = false;

  registerForm!: FormGroup;

  // Async validator for company code uniqueness
  companyCodeAsyncValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.value.length < 6) {
        return of(null); // Let other validators handle these cases
      }

      return this.accountService.checkCompanyCodeAvailability(control.value).pipe(
        debounceTime(300),
        map(response => response.available ? null : { companyCodeTaken: true }),
        catchError(() => of(null)) // If error, don't block validation
      );
    };
  }

  constructor() {
    this.registerForm = new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
      companyCode: new FormControl(''),
      isCompanyRegistration: new FormControl(false)
    });

    // Set up automatic server error clearing and live validation - handled by service and TextInputComponent
    this.formErrorHandler.setupAutoErrorClear(this.registerForm);
  }

  toggleRegistrationType(isCompany: boolean) {
    this.isCompanyRegistration = isCompany;
    this.registerForm.patchValue({ isCompanyRegistration: isCompany });
    
    // Update validation for company code
    const companyCodeControl = this.registerForm.get('companyCode');
    if (isCompany) {
      // Company code should be alphanumeric, 6-20 characters, and unique
      companyCodeControl?.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(20),
        Validators.pattern(/^[A-Za-z0-9]+$/) // Only letters and numbers
      ]);
      companyCodeControl?.setAsyncValidators([this.companyCodeAsyncValidator()]);
    } else {
      companyCodeControl?.clearValidators();
      companyCodeControl?.clearAsyncValidators();
      companyCodeControl?.setValue('');
    }
    companyCodeControl?.updateValueAndValidity();

    // Update validation for lastName - not required for company registration
    const lastNameControl = this.registerForm.get('lastName');
    if (isCompany) {
      lastNameControl?.clearValidators();
      lastNameControl?.setValue('');
    } else {
      lastNameControl?.setValidators([Validators.required]);
    }
    lastNameControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.accountService.register(this.registerForm.value).subscribe({
        next: () => {
          this.snackbar.success('Account created successfully - you can now log in');
          this.router.navigateByUrl('/account/login');
        },
        error: errors => {
          this.formErrorHandler.mapServerErrorsToForm(this.registerForm, errors);
        }
      });
    }
  }


}
