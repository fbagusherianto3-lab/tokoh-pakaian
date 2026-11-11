export type Category =
  | "Semua"
  | "Pria"
  | "Wanita"
  | "Unisex"
  | "Anak-Anak"
  | "Import";

export type ProductCategory = Exclude<Category, "Semua">;

export interface Product {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  sizes: string[];
  image: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  quantity: number;
}

export type OrderStatus = "Diproses" | "Dikirim" | "Selesai";

export interface OrderItem {
  id: string;
  date: string;
  createdAt?: string;
  username: string;
  items: CartItem[];
  totalPrice: number;
  paymentMethod: string;
  status: OrderStatus;
}
