import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AccountService } from '../../../core/services/account.service';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { JsonPipe } from '@angular/common';
import { TestErrorComponent } from "../../test-error/test-error.component";
import { TextInputComponent } from "../../../shared/components/text-input/text-input.component";

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    JsonPipe,
    TextInputComponent
],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private formBuilder = inject(FormBuilder);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private snackBar = inject(SnackbarService);
  validationErrors?: string[];

  registerForm = this.formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit() {
    this.accountService.register(this.registerForm.value).subscribe({
      next: () => {
        this.snackBar.success('Account created successfully - you can now log in');
        this.router.navigateByUrl('/account/login');
      },
      error: errors => this.validationErrors = errors
    });
  }
}
