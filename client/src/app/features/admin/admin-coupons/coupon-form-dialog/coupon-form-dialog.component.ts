import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CreateCouponDto, CouponTypes } from '../../../../shared/models/coupon';

@Component({
  selector: 'app-coupon-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDatepickerToggle,
    MatNativeDateModule,
    MatButton,
    MatIcon
  ],
  templateUrl: './coupon-form-dialog.component.html',
  styleUrl: './coupon-form-dialog.component.scss'
})
export class CouponFormDialogComponent implements OnInit {
  couponForm: FormGroup;
  isEdit: boolean;
  couponTypes = CouponTypes;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CouponFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isEdit: boolean; coupon?: CreateCouponDto }
  ) {
    this.isEdit = data.isEdit;
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(200)]],
      type: [1, [Validators.required]],
      value: [0, [Validators.required, Validators.min(1)]],
      minimumOrderAmount: [null, [Validators.min(0.01)]],
      maximumDiscountAmount: [null, [Validators.min(0.01)]],
      validFrom: [new Date(), [Validators.required]],
      validUntil: [this.getDefaultEndDate(), [Validators.required]],
      usageLimit: [null, [Validators.min(1)]],
      isCustomerOnly: [false]
    });

    // Add custom validator for value based on type
    this.couponForm.get('type')?.valueChanges.subscribe(type => {
      const valueControl = this.couponForm.get('value');
      if (type === 1) { // Percentage
        valueControl?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      } else { // Fixed Amount
        valueControl?.setValidators([Validators.required, Validators.min(1)]);
      }
      valueControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    if (this.isEdit && this.data.coupon) {
      const coupon = this.data.coupon;
      this.couponForm.patchValue({
        ...coupon,
        validFrom: new Date(coupon.validFrom),
        validUntil: new Date(coupon.validUntil)
      });
    }
  }

  private getDefaultEndDate(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() + 3); // Default to 3 months from now
    return date;
  }

  onSubmit() {
    if (this.couponForm.valid) {
      const formValue = this.couponForm.value;
      const couponDto: CreateCouponDto = {
        ...formValue,
        code: formValue.code.toUpperCase(), // Ensure uppercase
        validFrom: formValue.validFrom.toISOString(),
        validUntil: formValue.validUntil.toISOString()
      };
      this.dialogRef.close(couponDto);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.couponForm.controls).forEach(key => {
        this.couponForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.couponForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('min')) {
      return `${fieldName} must be greater than ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `${fieldName} must be less than or equal to ${control.errors?.['max'].max}`;
    }
    if (control?.hasError('maxlength')) {
      return `${fieldName} must be less than ${control.errors?.['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.couponForm.get(fieldName);
    return !!(control?.invalid && (control?.dirty || control?.touched));
  }

  getTypeLabel(): string {
    const type = this.couponForm.get('type')?.value;
    return type === 1 ? '%' : '$';
  }
}