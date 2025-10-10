export type Coupon = {
  id: number;
  code: string;
  description: string;
  type: string;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  isCustomerOnly: boolean;
}

export type CreateCouponDto = {
  code: string;
  description: string;
  type: number;
  value: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  isCustomerOnly: boolean;
}

export type CouponType = {
  value: number;
  name: string;
}

export const CouponTypes: CouponType[] = [
  { value: 1, name: 'Percentage' },
  { value: 2, name: 'Fixed Amount' }
];