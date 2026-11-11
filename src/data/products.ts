import type { Category, Product } from "../types/product.ts";

export const DEFAULT_PRODUCT_IMAGE = "/offline-product.svg";

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Kaos Polos Cotton Combed 30s",
    price: 75000,
    category: "Pria",
    sizes: ["S", "M", "L", "XL"],
    image: "/products/kaos-cotton.svg",
    stock: 25,
  },
  {
    id: 2,
    name: "Kemeja Flannel Slimfit",
    price: 135000,
    category: "Pria",
    sizes: ["M", "L", "XL"],
    image: "/products/kemeja-flannel.svg",
    stock: 18,
  },
  {
    id: 3,
    name: "Oversized Minimalist Hoodie",
    price: 185000,
    category: "Unisex",
    sizes: ["M", "L", "XL", "XXL"],
    image: "/products/hoodie-oversized.svg",
    stock: 12,
  },
  {
    id: 4,
    name: "Floral Casual Summer Dress",
    price: 145000,
    category: "Wanita",
    sizes: ["S", "M", "L"],
    image: "/products/dress-summer.svg",
    stock: 10,
  },
  {
    id: 5,
    name: "Vintage Denim Jacket",
    price: 220000,
    category: "Unisex",
    sizes: ["M", "L", "XL"],
    image: "/products/jaket-denim.svg",
    stock: 15,
  },
  {
    id: 6,
    name: "Korean Overfit Cardigan",
    price: 245000,
    category: "Import",
    sizes: ["All Size"],
    image: "/products/cardigan-korean.svg",
    stock: 8,
  },
  {
    id: 7,
    name: "Kaos Anak Ceria",
    price: 55000,
    category: "Anak-Anak",
    sizes: ["S", "M", "L"],
    image: "/products/kaos-anak.svg",
    stock: 20,
  },
  {
    id: 8,
    name: "Dress Anak Motif Bunga",
    price: 85000,
    category: "Anak-Anak",
    sizes: ["S", "M", "L"],
    image: "/products/dress-anak.svg",
    stock: 14,
  },
];

export const CATEGORIES: { name: Category; label: string }[] = [
  { name: "Semua", label: "✨ Semua Produk" },
  { name: "Pria", label: "👔 Pria" },
  { name: "Wanita", label: "👗 Wanita" },
  { name: "Unisex", label: "🧥 Unisex" },
  { name: "Import", label: "✈️ Import" },
  { name: "Anak-Anak", label: "🧒 Anak-Anak" },
];
