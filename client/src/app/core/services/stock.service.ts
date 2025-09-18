import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, map, tap, forkJoin, firstValueFrom } from 'rxjs';

export interface StockInfo {
  productId: number;
  totalStock: number;
  availableStock: number;
  isOutOfStock: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private stockCache = new BehaviorSubject<Map<number, StockInfo>>(new Map());

  getAvailableStock(productId: number): Observable<StockInfo> {
    return this.http.get<StockInfo>(`${this.baseUrl}products/${productId}/stock`)
      .pipe(
        tap(stockInfo => this.updateCache(stockInfo))
      );
  }

  checkStockAvailability(productId: number, requestedQuantity: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}products/${productId}/check-availability/${requestedQuantity}`);
  }

  // Check multiple products at once
  checkMultipleStockAvailability(items: {productId: number, requestedQuantity: number}[]): Observable<{productId: number, isAvailable: boolean}[]> {
    const checks = items.map(item => 
      this.checkStockAvailability(item.productId, item.requestedQuantity)
        .pipe(map(isAvailable => ({ productId: item.productId, isAvailable })))
    );
    
    // Use forkJoin to wait for all checks to complete
    return forkJoin(checks);
  }

  // Get cached stock info (useful for UI updates)
  getCachedStockInfo(productId: number): StockInfo | null {
    return this.stockCache.value.get(productId) || null;
  }

  // Clear cache when needed (e.g., after successful order)
  clearCache(): void {
    this.stockCache.next(new Map());
  }

  private updateCache(stockInfo: StockInfo): void {
    const currentCache = this.stockCache.value;
    currentCache.set(stockInfo.productId, stockInfo);
    this.stockCache.next(currentCache);
  }
}
