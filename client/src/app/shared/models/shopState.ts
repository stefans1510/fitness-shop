export type ShopState = {
  scrollPosition: number;
  pageIndex: number;
  pageSize: number;
  search?: string;
  sort?: string;
  types?: string[];
  brands?: string[];
};