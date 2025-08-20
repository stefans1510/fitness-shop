import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OrderParameters } from '../../shared/models/orderParameters';
import { Pagination } from '../../shared/models/pagination';
import { Order } from '../../shared/models/order';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  baseUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getOrders(orderParameters: OrderParameters) {
    let parameters = new HttpParams();

    if (orderParameters.filter && orderParameters.filter !== 'All') {
      parameters = parameters.append('status', orderParameters.filter);
    }

    parameters = parameters.append('pageIndex', orderParameters.pageNumber.toString());
    parameters = parameters.append('pageSize', orderParameters.pageSize.toString());

    return this.http.get<Pagination<Order>>(this.baseUrl + 'admin/orders', { params: parameters });
  }

  getOrder(id: number) {
    return this.http.get<Order>(this.baseUrl + 'admin/orders/' + id);
  }

  refundOrder(id: number) {
    return this.http.post<Order>(this.baseUrl + 'admin/orders/refund/' + id, {});
  }

  getProducts() {}
}
