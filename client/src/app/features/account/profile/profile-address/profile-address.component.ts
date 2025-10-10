import { Component, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '../../../../core/services/account.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { StripeService } from '../../../../core/services/stripe.service';
import { Address } from '../../../../shared/models/user';
import { StripeAddressElement, StripeAddressElementChangeEvent } from '@stripe/stripe-js';

@Component({
  selector: 'app-profile-address',
  imports: [
    MatButtonModule
  ],
  templateUrl: './profile-address.component.html',
  styleUrl: './profile-address.component.scss'
})
export class ProfileAddressComponent implements AfterViewInit, OnDestroy {
  private accountService = inject(AccountService);
  private snackbar = inject(SnackbarService);
  private stripeService = inject(StripeService);

  addressElement?: StripeAddressElement;
  loading = false;
  isAddressComplete = false;
  hasChanges = false;
  initialAddress?: Address;

  ngAfterViewInit() {
    // Store initial address for change detection
    const currentUser = this.accountService.currentUser();
    this.initialAddress = currentUser?.address ? { ...currentUser.address } : undefined;
    
    // Material tabs are lazy-loaded, so we need to wait for the element to be actually visible
    this.initializeStripeElement();
  }

  private async initializeStripeElement() {
    // Check if the element exists and is visible (tab is active)
    const checkElement = () => {
      const element = document.getElementById('address-element');
      return element && element.offsetParent !== null; // offsetParent is null for hidden elements
    };

    // If element is not visible yet, wait and retry
    if (!checkElement()) {
      setTimeout(() => this.initializeStripeElement(), 100);
      return;
    }

    try {
      // Create the standalone Stripe address element (not tied to payment flow)
      this.addressElement = await this.stripeService.createStandaloneAddressElement();
      this.addressElement.mount('#address-element');
      this.addressElement.on('change', this.handleAddressChange);
    } catch (error: any) {
      this.snackbar.error('Failed to load address form: ' + error.message);
      console.error('Failed to initialize address element:', error);
    }
  }

  handleAddressChange = async (event: StripeAddressElementChangeEvent) => {
    this.isAddressComplete = event.complete;
    
    // Check if there are changes compared to initial address
    if (event.complete && this.addressElement) {
      const currentAddress = await this.getAddressFromStripeAddress();
      this.hasChanges = this.addressHasChanged(currentAddress);
    } else {
      this.hasChanges = false;
    }
  }

  async onSubmit() {
    if (this.isAddressComplete && this.addressElement) {
      this.loading = true;
      try {
        // Use the same method as checkout to get address data
        const address = await this.getAddressFromStripeAddress() as Address;
        
        if (address) {
          await firstValueFrom(this.accountService.updateAddress(address));
          this.snackbar.success('Address updated successfully!');
          
          // Force refresh of current user to update the address in memory
          await firstValueFrom(this.accountService.getUserInfo());
          
          // Update initial address and reset change detection
          this.initialAddress = { ...address };
          this.hasChanges = false;
        }
      } catch (error: any) {
        // Handle validation errors from the interceptor (array of error messages)
        if (Array.isArray(error)) {
          const errorMessage = error.join(', ');
          this.snackbar.error('Failed to update address: ' + errorMessage);
        } else {
          this.snackbar.error('Failed to update address: ' + (error.message || 'Unknown error'));
        }
        console.error('Failed to update address:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  private async getAddressFromStripeAddress(): Promise<Address | null> {
    const result = await this.addressElement?.getValue();
    const address = result?.value.address;

    if (address) {
      return {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        country: address.country,
        state: address.state,
        postalCode: address.postal_code,
      }
    } else return null;
  }

  private addressHasChanged(currentAddress: Address | null): boolean {
    if (!currentAddress && !this.initialAddress) return false;
    if (!currentAddress || !this.initialAddress) return true;

    // Compare all address properties
    return (
      currentAddress.line1 !== this.initialAddress.line1 ||
      (currentAddress.line2 || '') !== (this.initialAddress.line2 || '') ||
      currentAddress.city !== this.initialAddress.city ||
      (currentAddress.state || '') !== (this.initialAddress.state || '') ||
      currentAddress.country !== this.initialAddress.country ||
      currentAddress.postalCode !== this.initialAddress.postalCode
    );
  }

  ngOnDestroy() {
    // Clean up event listeners - no need to dispose since this is standalone
    if (this.addressElement) {
      this.addressElement.off('change', this.handleAddressChange);
    }
  }

  get canSave() {
    return this.isAddressComplete && !this.loading && this.hasChanges;
  }
}
