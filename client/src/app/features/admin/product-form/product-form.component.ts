import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShopService } from '../../../core/services/shop.service';
import { AdminService } from '../../../core/services/admin.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/select';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { Product } from '../../../shared/models/product';
import { startWith, map } from 'rxjs';

@Component({
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatOption,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButton,
    RouterLink
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  private shopService = inject(ShopService);
  private adminService = inject(AdminService);
  private snackbar = inject(SnackbarService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  productTypes: string[] = [];
  productBrands: string[] = [];
  filteredTypes: string[] = [];
  filteredBrands: string[] = [];
  productId?: number;
  imagePreview?: string;

  productForm = this.formBuilder.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    pictureUrl: [''],
    brand: ['', [Validators.required]],
    type: ['', [Validators.required]],
    quantityInStock: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadProductTypes();
    this.loadProductBrands();
    this.setupFilteredOptions();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId = +id;
      this.shopService.getProduct(+id).subscribe(product => {
        this.productForm.patchValue(product);
        
        if (product.pictureUrl) {  // set image preview to the existing product image for updates
          this.imagePreview = product.pictureUrl;
        }
      });
    }
  }

  setupFilteredOptions() {
    // Setup filtered brands
    this.productForm.get('brand')?.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBrands(value || ''))
    ).subscribe(filtered => {
      this.filteredBrands = filtered;
    });

    // Setup filtered types
    this.productForm.get('type')?.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTypes(value || ''))
    ).subscribe(filtered => {
      this.filteredTypes = filtered;
    });
  }

  private _filterBrands(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.productBrands.filter(brand => 
      brand.toLowerCase().includes(filterValue)
    );
  }

  private _filterTypes(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.productTypes.filter(type => 
      type.toLowerCase().includes(filterValue)
    );
  }

  displayBrand = (brand: string): string => brand;
  displayType = (type: string): string => type;

  loadProductTypes() {
    this.shopService.getTypes().subscribe({
      next: response => {
        this.productTypes = response;
        this.filteredTypes = response;
      }
    });
  }

  loadProductBrands() {
    this.shopService.getBrands().subscribe({
      next: brands => {
        this.productBrands = brands;
        this.filteredBrands = brands;
      }
    });
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      
      // Check if it's the same file that's already uploaded for this specific product
      const currentPictureUrl = this.productForm.get('pictureUrl')?.value;
      const expectedFileName = `images/products/${file.name}`;
      
      if (currentPictureUrl === expectedFileName) {
        this.snackbar.error('This image is already uploaded for this product.');
        // Reset the file input to prevent page reload
        fileInput.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);

      // Upload the file and get the URL from server
      this.adminService.uploadProductPicture(file).subscribe({
        next: response => {
          // Set the pictureUrl form control to the server URL
          this.productForm.patchValue({ pictureUrl: response.pictureUrl });
        },
        error: error => {
          console.error('Error uploading image:', error);
          // Reset preview on error
          this.imagePreview = undefined;
          // Reset the file input
          fileInput.value = '';
          
          // Show specific error message based on server response
          let errorMessage = 'Error uploading image. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.snackbar.error(errorMessage);
          
          // Prevent any default form submission or page refresh
          event.preventDefault();
          event.stopPropagation();
        }
      });
    }
  }

  onSubmit() {
    if (this.productForm.invalid) return;
    
    // For new products, ensure we have a picture URL
    if (!this.productId && !this.productForm.get('pictureUrl')?.value) {
      this.snackbar.error('Please upload a product image');
      return;
    }

    const formData = this.productForm.value;

    // Ensure all fields have values (no nulls)
    const productData: Product = {
      id: this.productId || 0,
      name: formData.name || '',
      description: formData.description || '',
      price: formData.price || 0,
      pictureUrl: formData.pictureUrl || '',
      brand: formData.brand || '',
      type: formData.type || '',
      quantityInStock: formData.quantityInStock || 0,
      hasDiscount: false
    };

    if (this.productId) {
      this.adminService.updateProduct(productData).subscribe({
        next: (response) => {
          this.snackbar.success('Product updated successfully');
          this.router.navigate(['/admin'], { queryParams: { tab: 'products' } });
        },
        error: error => {
          console.error('Update error:', error);
          this.snackbar.error('Error updating product. Please try again.');
        }
      });
    } else {
      this.adminService.createProduct(productData).subscribe({
        next: (response) => {
          this.snackbar.success('Product created successfully');
          this.router.navigate(['/admin'], { queryParams: { tab: 'products' } });
        },
        error: error => {
          console.error('Create error:', error);
          this.snackbar.error('Error creating product. Please try again.');
        }
      });
    }
  }

  getFileName(filePath: string): string {
    if (!filePath) return '';
    return filePath.split('/').pop() || '';
  }
}
