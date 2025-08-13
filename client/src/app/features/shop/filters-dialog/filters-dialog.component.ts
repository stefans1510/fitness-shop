import { Component, inject } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';
import { MatDivider } from '@angular/material/divider'
import { MatListOption, MatSelectionList } from '@angular/material/list'
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filters-dialog',
  imports: [
    MatDivider,
    MatSelectionList,
    MatListOption,
    MatButton,
    FormsModule
  ],
  templateUrl: './filters-dialog.component.html',
  styleUrl: './filters-dialog.component.scss'
})
export class FiltersDialogComponent {
  shopService = inject(ShopService);
  private dialogReference = inject(MatDialogRef<FiltersDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  selectedTypes: string[] = this.data.selectedTypes;
  selectedBrands: string[] = this.data.selectedBrands;

  applyFilters() {   //apply filtering when dialog closed
    this.dialogReference.close({
      selectedTypes: this.selectedTypes,
      selectedBrands: this.selectedBrands
    })
  }

  clearFilters() {
    this.selectedTypes = [];
    this.selectedBrands = [];
    this.dialogReference.close({
      selectedTypes: [],
      selectedBrands: []
    });
  }
}
