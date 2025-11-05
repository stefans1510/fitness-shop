import { Component, inject, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';
import { Product } from '../../shared/models/product';
import { ProductItemComponent } from "./product-item/product-item.component";
import { MatDialog } from '@angular/material/dialog'
import { FiltersDialogComponent } from './filters-dialog/filters-dialog.component';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatListOption, MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { ShopParams } from '../../shared/models/shopParams';
import { Pagination } from '../../shared/models/pagination';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { ScrollPositionService } from '../../core/services/scroll-position.service';
import { ShopState } from '../../shared/models/shopState';

@Component({
  selector: 'app-shop',
  imports: [
    ProductItemComponent,
    MatButton,
    MatIcon,
    MatMenu,
    MatSelectionList,
    MatListOption,
    MatMenuTrigger,
    MatPaginator,
    FormsModule,
    EmptyStateComponent
],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss'
})
export class ShopComponent implements AfterViewInit, OnDestroy {
  private shopService = inject(ShopService);
  private dialogService = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private scrollPositionService = inject(ScrollPositionService);
  private scrollHandler = () => this.checkScrollPosition();
  products?: Pagination<Product>;
  sortOptions = [
    {name: 'Alphabetical', value: 'name'},
    {name: 'Price: Low-High', value: 'priceAsc'},
    {name: 'Price: High-Low', value: 'priceDesc'}
  ]
  shopParams = new ShopParams();
  pageSizeOptions = [6, 12, 18, 24];
  showBackToTop: boolean = false;

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void {
    // Check if we're returning from product details and restore state
    const savedState = this.scrollPositionService.getShopState();
    if (savedState) {
      this.restoreShopState(savedState);
    } else {
      this.initializeShop(); // Initial load for brands/types/products
    }

    this.route.queryParamMap.subscribe(params => {
      // Only update from query params if we're not restoring from saved state
      if (!savedState) {
        const typeParam = params.get('type');
        this.shopParams.types = typeParam ? [typeParam] : [];
        const brandParam = params.get('brand');
        this.shopParams.brands = brandParam ? [brandParam] : [];
      }
      this.getProducts(); // Only update products on filter change
    });
  }

  ngAfterViewInit(): void {
    window.addEventListener('scroll', this.scrollHandler);
    this.checkScrollPosition();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
  }

  initializeShop() {
    // Subscribe to brands and types to ensure they're loaded into cache
    this.shopService.getBrands().subscribe();
    this.shopService.getTypes().subscribe();
    this.getProducts();
  }

  resetFilters() {
    this.shopParams = new ShopParams();
    this.getProducts();
  }

  getProducts() {
    this.shopService.getProducts(this.shopParams).subscribe({
      next: response => {
        this.products = response;
        // After products are loaded, check if we need to restore scroll position
        this.restoreScrollPosition();
      },
      error: error => console.log(error)
    })
  }

  private restoreScrollPosition() {
    const savedState = this.scrollPositionService.getShopState();
    if (savedState && savedState.scrollPosition > 0) {
      // Use a longer timeout to ensure DOM is fully rendered
      setTimeout(() => {
        window.scrollTo({
          top: savedState.scrollPosition,
          behavior: 'auto'
        });
        this.scrollPositionService.clearShopState();
      }, 500);
    }
  }

  onSearchChange() {
    this.shopParams.pageIndex = 1;
    this.getProducts();
  }

  handlePageEvent(event: PageEvent) {
    this.shopParams.pageIndex = event.pageIndex + 1;
    this.shopParams.pageSize = event.pageSize;
    this.getProducts();
  }

  onSortChange(event: MatSelectionListChange) {
    const selectedOption = event.options[0];
    if (selectedOption) {
      this.shopParams.sort = selectedOption.value;
      this.shopParams.pageIndex = 1;
      this.getProducts();
    }
  }

  openFiltersDialog() {
    const dialogReference = this.dialogService.open(FiltersDialogComponent, {
      data: {
        selectedTypes: this.shopParams.types,
        selectedBrands: this.shopParams.brands
      }
    });
    dialogReference.afterClosed().subscribe({
      next: result => {
        if (result) {
          this.shopParams.types = result.selectedTypes;
          this.shopParams.brands = result.selectedBrands;
          this.shopParams.pageIndex = 1;
          this.getProducts();
        }
      }
    })
  }

  checkScrollPosition() {
    const shopElement = this.elRef.nativeElement.querySelector('.flex.flex-col');
    if (!shopElement) return;
    const rect = shopElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    // Show only if bottom of shop is visible on any screen size
    this.showBackToTop = rect.bottom <= windowHeight + 10;
  }

  private restoreShopState(savedState: ShopState) {
    // Restore shop parameters
    this.shopParams.pageIndex = savedState.pageIndex;
    this.shopParams.pageSize = savedState.pageSize;
    this.shopParams.search = savedState.search || '';
    this.shopParams.sort = savedState.sort || '';
    this.shopParams.types = savedState.types || [];
    this.shopParams.brands = savedState.brands || [];

    // Subscribe to brands and types to ensure they're loaded into cache
    this.shopService.getBrands().subscribe();
    this.shopService.getTypes().subscribe();
  }

  private saveCurrentShopState() {
    const currentState: ShopState = {
      scrollPosition: window.pageYOffset,
      pageIndex: this.shopParams.pageIndex,
      pageSize: this.shopParams.pageSize,
      search: this.shopParams.search,
      sort: this.shopParams.sort,
      types: [...this.shopParams.types],
      brands: [...this.shopParams.brands]
    };
    this.scrollPositionService.saveShopState(currentState);
  }

  onProductNavigation(productId: number) {
    // Save current shop state before navigating to product details
    this.saveCurrentShopState();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
