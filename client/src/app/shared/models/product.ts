export type Product = {
    id: number;
    name: string;
    description: string;
    price: number;
    discountedPrice?: number;
    pictureUrl: string;
    type: string;
    brand: string;
    quantityInStock: number;
    hasDiscount: boolean;
}