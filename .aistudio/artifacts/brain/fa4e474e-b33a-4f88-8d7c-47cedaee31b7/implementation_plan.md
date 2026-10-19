# Revisi Rencana Penjelasan & Panduan Deploy Firebase Hosting

## 1. Klarifikasi: Apakah Membuat Boros Read Firestore?
**Tidak sama sekali.** 
- `service-worker.js` adalah file skrip kecil di browser yang mengatur cara kerja cache PWA (Progressive Web App). File ini **tidak melakukan koneksi langsung ke database Firestore** dan **tidak menambah jumlah pembacaan (reads) Firestore**.
- Pembacaan Firestore hanya terjadi saat aplikasi React memanggil query database (`getDocs`, `onSnapshot`, dll.).
- Pengaturan `Cache-Control: no-cache, no-store, must-revalidate` **hanya diterapkan pada file service worker itu sendiri** agar browser tahu kapan harus memeriksa pembaruan kode aplikasi, sedangkan aset statis lainnya (seperti gambar, font, dan chunk JS aplikasi) tetap di-cache secara optimal oleh Workbox.

---

## 2. Apa yang Perlu Anda Lakukan Saat Deploy?

Cukup jalankan perintah standar di terminal:

1. **Build Aplikasi**:
   ```bash
   npm run build
   ```

2. **Deploy ke Firebase**:
   ```bash
   firebase deploy --only hosting
   ```

Dengan cara ini, aplikasi Anda tetap cepat, hemat kuota/read database, namun pembaruan versi dapat diterima oleh pengguna secara instan tanpa nyangkut di cache lama.
