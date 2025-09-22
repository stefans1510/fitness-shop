import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DeliveryMethod } from '../../../../shared/models/deliveryMethod';

@Component({
  selector: 'app-delivery-method-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButton
  ],
  templateUrl: './delivery-method-form-dialog.component.html',
  styleUrl: './delivery-method-form-dialog.component.scss'
})
export class DeliveryMethodFormDialogComponent implements OnInit {
  deliveryMethodForm: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DeliveryMethodFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { isEdit: boolean; deliveryMethod?: DeliveryMethod }
  ) {
    this.isEdit = data.isEdit;
    this.deliveryMethodForm = this.fb.group({
      id: [0],
      shortName: ['', [Validators.required, Validators.maxLength(50)]],
      deliveryTime: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    if (this.isEdit && this.data.deliveryMethod) {
      this.deliveryMethodForm.patchValue(this.data.deliveryMethod);
    }
  }

  onSubmit() {
    if (this.deliveryMethodForm.valid) {
      const formValue = this.deliveryMethodForm.value;
      this.dialogRef.close(formValue);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  get title() {
    return this.isEdit ? 'Edit Delivery Method' : 'Create Delivery Method';
  }
}