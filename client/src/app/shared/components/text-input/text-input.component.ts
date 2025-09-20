import { Component, Input, Self } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

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
export class TextInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  
  private onChange = (value: any) => {};
  private onTouched = () => {};

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
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
    // Called when user types - notify the form control
    this.onChange(event.target.value);
  }

  onBlur(): void {
    // Called when input loses focus - mark as touched
    this.onTouched();
  }

  get control() {
    return this.controlDir.control as FormControl;
  }
}
