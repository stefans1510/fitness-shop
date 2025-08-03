export type Order = {
  id: number
  orderDate: string
  buyerEmail: string
  shippingAddress: ShippingAddress
  deliveryMethod: string
  shippingPrice: number
  paymentSummary: PaymentSummary
  orderItems: OrderItem[]
  subtotal: number
  status: string
  total: number
  paymentIntentId: string
}

export type ShippingAddress = {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export type PaymentSummary = {
  last4: number
  brand: string
  expMonth: number
  expYear: number
}

export type OrderItem = {
  productId: number
  productName: string
  pictureUrl: string
  price: number
  quantity: number
}

export type OrderToCreate = {
    cartId: string
    deliveryMethodId: number
    shippingAddress: ShippingAddress
    paymentSummary: PaymentSummary
}