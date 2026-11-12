# Toko Pakaian Bagus & Tasya

Aplikasi toko pakaian berbasis React, TypeScript, dan Vite. Aplikasi menyediakan katalog produk, keranjang dan checkout simulasi, serta halaman pengelolaan produk, stok, pengguna, dan pesanan. Data disimpan di `localStorage` browser.

Untuk penjelasan kode per file beserta pertanyaan dan jawaban, lihat [Panduan Kode Toko Pakaian](./docs/PANDUAN-KODE.md).

Salin `.env.example` menjadi `.env.local` untuk mengatur nomor WhatsApp toko dan rekening tujuan transfer. Isi nomor WhatsApp dengan kode negara tanpa tanda `+` atau spasi, lalu isi nama bank, nomor rekening, dan nama pemilik rekening. Informasi rekening ditampilkan pada pilihan transfer; variabel `VITE_` akan terlihat oleh pengunjung aplikasi, jadi hanya isi data yang memang boleh dipublikasikan. Jalankan ulang server setelah mengubah konfigurasi. Pelanggan tetap perlu menekan tombol kirim di WhatsApp. Pembayaran QRIS, transfer, kartu, dan PayLater di aplikasi ini masih simulasi dan tidak memproses atau memverifikasi transaksi sungguhan.

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
