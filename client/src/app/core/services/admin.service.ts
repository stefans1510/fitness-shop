import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OrderParameters } from '../../shared/models/orderParameters';
import { UserParameters } from '../../shared/models/userParameters';
import { Pagination } from '../../shared/models/pagination';
import { Order } from '../../shared/models/order';
import { Product } from '../../shared/models/product';
import { User } from '../../shared/models/user';
import { ShopService } from './shop.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);
  private shopService = inject(ShopService);

  getOrders(orderParameters: OrderParameters) {
    let parameters = new HttpParams();

    if (orderParameters.filter && orderParameters.filter !== 'All') {
      parameters = parameters.append('status', orderParameters.filter);
    }

    parameters = parameters.append('pageIndex', orderParameters.pageIndex.toString());
    parameters = parameters.append('pageSize', orderParameters.pageSize.toString());

    return this.http.get<Pagination<Order>>(this.baseUrl + 'admin/orders', { params: parameters });
  }

  getOrder(id: number) {
    return this.http.get<Order>(this.baseUrl + 'admin/orders/' + id);
  }

  refundOrder(id: number) {
    return this.http.post<Order>(this.baseUrl + 'admin/orders/refund/' + id, {});
  }

  createProduct(product: Product) {
    return this.http.post<Product>(this.baseUrl + 'admin/products', product).pipe(
      tap(() => this.shopService.clearProductCache()) // Clear cache so new brands/types are loaded
    );
  }

  uploadProductPicture(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<{pictureUrl: string}>(this.baseUrl + 'admin/products/upload-picture', formData);
  }

  updateProduct(product: Product) {
    return this.http.put(this.baseUrl + 'admin/products/' + product.id, product).pipe(
      tap(() => this.shopService.clearProductCache()) // Clear cache so new brands/types are loaded
    );
  }

  deleteProduct(id: number) {
    return this.http.delete(this.baseUrl + 'admin/products/' + id).pipe(
      tap(() => this.shopService.clearProductCache()) // Clear cache in case deleted product had unique brand/type
    );
  }

  deleteBrand(brand: string) {
    return this.http.delete(this.baseUrl + 'admin/products/brands/' + encodeURIComponent(brand)).pipe(
      tap(() => this.shopService.clearBrandsCache())
    );
  }

  deleteType(type: string) {
    return this.http.delete(this.baseUrl + 'admin/products/types/' + encodeURIComponent(type)).pipe(
      tap(() => this.shopService.clearTypesCache())
    );
  }

  // User Management
  getUsers(userParameters: UserParameters) {
    let parameters = new HttpParams();

    parameters = parameters.append('pageIndex', userParameters.pageIndex.toString());
    parameters = parameters.append('pageSize', userParameters.pageSize.toString());

    if (userParameters.search) {
      parameters = parameters.append('search', userParameters.search);
    }

    if (userParameters.role && userParameters.role !== 'All') {
      parameters = parameters.append('role', userParameters.role);
    }

    return this.http.get<Pagination<User>>(this.baseUrl + 'admin/users', { params: parameters });
  }

  deleteUser(id: string) {
    return this.http.delete<{message: string}>(this.baseUrl + 'admin/users/' + id);
  }

  createAdminUser(adminUser: any) {
    return this.http.post<{message: string}>(this.baseUrl + 'admin/users/create-admin', adminUser);
  }
}
