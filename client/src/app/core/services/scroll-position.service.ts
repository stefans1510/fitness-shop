import { Injectable } from '@angular/core';
import { ShopState } from '../../shared/models/shopState';

@Injectable({
  providedIn: 'root'
})
export class ScrollPositionService {
  private shopState: ShopState | null = null;

  saveShopState(state: ShopState): void {
    this.shopState = { ...state };
  }

  getShopState(): ShopState | null {
    return this.shopState;
  }

  clearShopState(): void {
    this.shopState = null;
  }

  // Legacy methods for backward compatibility
  saveScrollPosition(route: string, position: number): void {
    if (route === '/shop') {
      if (this.shopState) {
        this.shopState.scrollPosition = position;
      } else {
        this.shopState = {
          scrollPosition: position,
          pageIndex: 1,
          pageSize: 6
        };
      }
    }
  }

  getScrollPosition(route: string): number {
    if (route === '/shop' && this.shopState) {
      return this.shopState.scrollPosition;
    }
    return 0;
  }

  clearScrollPosition(route: string): void {
    if (route === '/shop') {
      this.shopState = null;
    }
  }
}