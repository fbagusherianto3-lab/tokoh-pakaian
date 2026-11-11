# Toko Pakaian Bagus & Tasya

Aplikasi toko pakaian berbasis React, TypeScript, dan Vite. Aplikasi menyediakan katalog produk, keranjang dan checkout simulasi, serta halaman pengelolaan produk, stok, pengguna, dan pesanan. Data disimpan di `localStorage` browser.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Perintah validasi:

```bash
npm run build
npm run lint
```

## Akun demo

Gunakan kata sandi `123` untuk akun demo berikut:

| Peran | Username |
| --- | --- |
| Admin | `admin` |
| Kasir | `kasir` |
| Pelanggan | `bagus` |

## Struktur kode

```text
src/
  assets/       Aset gambar dan ikon
  components/   Komponen antarmuka yang dapat digunakan kembali
  data/         Produk awal dan penyimpanan lokal
  types/        Tipe data katalog, keranjang, dan pesanan
  App.tsx       Halaman dan alur utama aplikasi
  index.css     Gaya global dan komponen
public/         Aset statis seperti gambar produk cadangan
```

Produk awal dan kategori katalog didefinisikan bersama di `src/data/products.ts`. Bentuk tipe produk yang digunakan aplikasi berada di `src/types/product.ts`.
