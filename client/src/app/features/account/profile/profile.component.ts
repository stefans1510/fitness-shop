import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { ProfileInformationComponent } from './profile-information/profile-information.component';
import { ProfileAddressComponent } from './profile-address/profile-address.component';
import { ProfilePasswordComponent } from './profile-password/profile-password.component';

@Component({
  selector: 'app-profile',
  imports: [
    MatTabsModule,
    MatIcon,
    ProfileInformationComponent,
    ProfileAddressComponent,
    ProfilePasswordComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

}
