import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Pagination } from '../../shared/models/pagination';
import { Product } from '../../shared/models/product';
import { ShopParams } from '../../shared/models/shopParams';
import { environment } from '../../../environments/environment';
import { Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  types: string[] = [];
  brands: string[] = [];


  getProducts(shopParams: ShopParams) {
    let params = new HttpParams();

    if (shopParams.types.length > 0) {
      params = params.append('types', shopParams.types.join(','));
    }

    if (shopParams.brands.length > 0) {
      params = params.append('brands', shopParams.brands.join(','));
    }

    if (shopParams.sort) {
      params = params.append('sort', shopParams.sort)
    }

    if (shopParams.search) {
      params = params.append('search', shopParams.search)
    }

    params = params.append('pageSize', shopParams.pageSize);
    params = params.append('pageIndex', shopParams.pageIndex);

    return this.http.get<Pagination<Product>>(this.baseUrl + 'products', { params });
  }

  getProduct(id: number) {
    return this.http.get<Product>(this.baseUrl + 'products/' + id);
  }

  getTypes(): Observable<string[]> {
    if (this.types.length > 0) {
      return of(this.types);
    }
    return this.http.get<string[]>(this.baseUrl + 'products/types').pipe(
      tap(response => this.types = response)
    );
  }

  getBrands(): Observable<string[]> {
    if (this.brands.length > 0) {
      return of(this.brands);
    }
    return this.http.get<string[]>(this.baseUrl + 'products/brands').pipe(
      tap(response => this.brands = response)
    );
  }

  // Methods to clear cache when new brands/types are added
  clearBrandsCache() {
    this.brands = [];
  }

  clearTypesCache() {
    this.types = [];
  }

  clearProductCache() {
    this.brands = [];
    this.types = [];
  }

}
