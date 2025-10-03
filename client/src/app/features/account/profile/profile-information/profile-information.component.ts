import { Component, inject } from '@angular/core';
import { MatIcon } from "@angular/material/icon";
import { AccountService } from '../../../../core/services/account.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-information',
  imports: [
    CommonModule,
    MatIcon
  ],
  templateUrl: './profile-information.component.html',
  styleUrl: './profile-information.component.scss'
})
export class ProfileInformationComponent {
  accountService = inject(AccountService);
  
  get user() {
    return this.accountService.currentUser();
  }
}
