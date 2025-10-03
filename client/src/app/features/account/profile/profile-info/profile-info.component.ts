import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCard, MatCardContent } from '@angular/material/card';
import { AccountService } from '../../../../core/services/account.service';
import { User } from '../../../../shared/models/user';

@Component({
  selector: 'app-profile-info',
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
        
        @if (user) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @if (!isCompanyUser()) {
              <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-700">First Name</label>
                <div class="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  {{user.firstName}}
                </div>
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-700">Last Name</label>
                <div class="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  {{user.lastName}}
                </div>
              </div>
            } @else {
              <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-700">Company Name</label>
                <div class="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  {{user.firstName}}
                </div>
              </div>
              <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-700">Company Code</label>
                <div class="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900 font-mono">
                  {{user.companyCode}}
                </div>
              </div>
            }

            <!-- Email -->
            <div class="space-y-1 md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">Email Address</label>
              <div class="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                {{user.email}}
              </div>
            </div>

            <!-- Current Address Display -->
            @if (user.address) {
              <div class="space-y-1 md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Current Address</label>
                <div class="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md text-gray-900">
                  <div>{{user.address.line1}}</div>
                  @if (user.address.line2) {
                    <div>{{user.address.line2}}</div>
                  }
                  <div>{{user.address.city}}, {{user.address.state}} {{user.address.postalCode}}</div>
                  <div>{{user.address.country}}</div>
                </div>
              </div>
            }
          </div>
        }
    </div>
  `,
  styles: []
})
export class ProfileInfoComponent implements OnInit {
  private accountService = inject(AccountService);
  user: User | null = null;

  ngOnInit() {
    this.user = this.accountService.currentUser();
  }

  isCompanyUser(): boolean {
    return this.accountService.isCompanyUser();
  }
}