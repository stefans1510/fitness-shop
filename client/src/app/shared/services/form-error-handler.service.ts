import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormErrorHandlerService {

  mapServerErrorsToForm(
    form: FormGroup, 
    errors: string[], 
    fieldMappings?: { [key: string]: string }
  ) {
    // Clear existing server errors
    this.clearServerErrors(form);
    
    // Default field mappings based on common patterns
    const defaultMappings = {
      email: ['email', 'e-mail'],
      password: ['password'],
      firstName: ['first', 'name'],
      lastName: ['last', 'surname'],
      currentPassword: ['current', 'old'],
      newPassword: ['new password'],
      confirmPassword: ['confirm', 'confirmation'],
      companyCode: ['company', 'code', 'registration']
    };

    // Merge with custom mappings if provided
    const mappings = { ...defaultMappings, ...fieldMappings };

    errors.forEach(error => {
      const errorLower = error.toLowerCase();
      let mappedField = null;

      // Find the best matching field
      for (const [fieldName, keywords] of Object.entries(mappings)) {
        if (keywords.some(keyword => errorLower.includes(keyword))) {
          if (form.get(fieldName)) {
            mappedField = fieldName;
            break;
          }
        }
      }

      // If no specific mapping found, use the first available field
      if (!mappedField) {
        mappedField = Object.keys(form.controls)[0];
      }

      // Set the error on the mapped field
      this.setControlError(form, mappedField, error);
    });
  }

  // Sets a server error on a specific form control
  private setControlError(form: FormGroup, controlName: string, errorMessage: string) {
    const control = form.get(controlName);
    if (control) {
      const errors = control.errors || {};
      errors['serverError'] = { message: errorMessage };
      control.setErrors(errors);
    }
  }

  // Clears server errors from all form controls
  private clearServerErrors(form: FormGroup) {
    Object.keys(form.controls).forEach(controlName => {
      const control = form.get(controlName);
      if (control && control.errors) {
        delete control.errors['serverError'];
        if (Object.keys(control.errors).length === 0) {
          control.setErrors(null);
        }
      }
    });
  }

  // Sets up automatic server error clearing when user types
  setupAutoErrorClear(form: FormGroup) {
    form.valueChanges.subscribe(() => {
      this.clearServerErrors(form);
    });
  }
}