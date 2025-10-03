import { Component, Input, Self, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ErrorStateMatcher } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';

// Custom error state matcher to show errors immediately while typing
export class ImmediateErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null): boolean {
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

@Component({
  selector: 'app-text-input',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
    MatLabel
  ],
  templateUrl: './text-input.component.html',
  styleUrl: './text-input.component.scss'
})
export class TextInputComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() isPasswordRequirements = false; // Flag for password requirements validation
  @Input() isPasswordMatch = false; // Flag for password match validation
  @Input() matchFieldName = ''; // Name of field to match against
  
  // Use custom error state matcher for immediate validation feedback
  errorMatcher = new ImmediateErrorStateMatcher();
  
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private destroy$ = new Subject<void>();

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
  }

  ngOnInit() {
    // Set up automatic live validation - mark as touched when user starts typing
    if (this.control) {
      this.control.valueChanges
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          if (!this.control?.touched) {
            this.control?.markAsTouched();
          }
          // Clear server errors when user starts typing
          this.clearServerErrors();
          
          // Handle special validations
          if (this.isPasswordRequirements) {
            this.validatePasswordRequirements();
          }
          if (this.isPasswordMatch && this.matchFieldName) {
            this.validatePasswordMatch();
          }
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  writeValue(obj: any): void {
    // Update the form control's value when set programmatically
    this.control?.setValue(obj, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    // Store the callback function to call when input changes
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    // Store the callback function to call when input is touched
    this.onTouched = fn;
  }

  onInput(event: any): void {
    // Called when user types - notify the form control and mark as dirty for immediate validation
    this.onChange(event.target.value);
    this.control?.markAsDirty();
  }

  onBlur(): void {
    // Called when input loses focus - mark as touched
    this.onTouched();
  }

  get control() {
    return this.controlDir.control as FormControl;
  }

  // Server error management - centralized in TextInputComponent
  private clearServerErrors() {
    if (this.control && this.control.errors) {
      delete this.control.errors['serverError'];
      if (Object.keys(this.control.errors).length === 0) {
        this.control.setErrors(null);
      }
    }
  }

  // Public method to set server errors from parent components
  setServerError(errorMessage: string) {
    if (this.control) {
      const errors = this.control.errors || {};
      errors['serverError'] = { message: errorMessage };
      this.control.setErrors(errors);
    }
  }

  // Password requirements validation - same logic as profile-password component
  private validatePasswordRequirements() {
    if (!this.control || !this.control.value) {
      return;
    }

    const value = this.control.value;
    let firstError: any = null;
    
    // Check requirements in priority order - same as ASP.NET Core Identity requirements
    if (value.length < 6) {
      firstError = { minLength: { requiredLength: 6, actualLength: value.length } };
    } else if (!/(?=.*\d)/.test(value)) {
      firstError = { requiresDigit: true };
    } else if (!/(?=.*[a-z])/.test(value)) {
      firstError = { requiresLowercase: true };
    } else if (!/(?=.*[A-Z])/.test(value)) {
      firstError = { requiresUppercase: true };
    } else if (!/(?=.*[^\da-zA-Z])/.test(value)) {
      firstError = { requiresSpecialChar: true };
    }
    
    // Set only the first unmet requirement
    if (firstError) {
      const currentErrors = this.control.errors || {};
      // Clear all password requirement errors first
      delete currentErrors['minLength'];
      delete currentErrors['requiresDigit'];
      delete currentErrors['requiresLowercase'];
      delete currentErrors['requiresUppercase'];
      delete currentErrors['requiresSpecialChar'];
      
      // Set only the current priority error
      Object.keys(firstError).forEach(key => {
        currentErrors[key] = firstError[key];
      });
      
      this.control.setErrors(currentErrors);
    } else {
      // Clear password requirement errors but keep other errors
      const currentErrors = this.control.errors;
      if (currentErrors) {
        delete currentErrors['minLength'];
        delete currentErrors['requiresDigit'];
        delete currentErrors['requiresLowercase'];
        delete currentErrors['requiresUppercase'];
        delete currentErrors['requiresSpecialChar'];
        
        if (Object.keys(currentErrors).length === 0) {
          this.control.setErrors(null);
        }
      }
    }
  }

  // Password match validation
  private validatePasswordMatch() {
    if (!this.control || !this.control.parent || !this.matchFieldName) {
      return;
    }

    const matchControl = this.control.parent.get(this.matchFieldName);
    if (matchControl && this.control.value !== matchControl.value) {
      const currentErrors = this.control.errors || {};
      currentErrors['passwordMismatch'] = true;
      this.control.setErrors(currentErrors);
    } else if (this.control.hasError('passwordMismatch')) {
      const currentErrors = this.control.errors;
      if (currentErrors) {
        delete currentErrors['passwordMismatch'];
        if (Object.keys(currentErrors).length === 0) {
          this.control.setErrors(null);
        }
      }
    }
  }
}
