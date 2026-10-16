# Rencana Implementasi: Mode Demo Lengkap, Web Profil Demo, & Optimasi Lazy Loading

Dokumen ini merinci keputusan mengenai **Mode Demo Kasir**, ketersediaan **Demo Web Profil Publik**, serta strategi **Full Lazy Loading** untuk efisiensi performa dan penghematan kuota.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan & Jawaban atas Pertanyaan Pengguna:**
> 
> 1. **Apakah Web Profil Sebaiknya Bisa Demo? (Rekomendasi: YA, SANGAT DIREKOMENDASIKAN)**
>    - *Alasan*: Jika web profil juga memiliki mode demo, calon pengguna dapat menguji **siklus bisnis lengkap 100%**:
>      1. Melihat website profil studio mereka (sesuai profesi Foto/MUA/WO/MC) dengan tema, bio, dan paket harga.
>      2. Menguji klik **"Booking Online"** dari kacamata klien.
>      3. Pesanan tersebut langsung masuk ke notifikasi kasir demo (`Booking Web: 1 Menunggu Konfirmasi`).
>    - *Mekanisme Aman*: Web profil demo menggunakan `sessionStorage` (`demo_profile_data` atau `?id=demo`), sehingga **TIDAK mencemari** domain produksi atau database Firebase.
>
> 2. **Apakah Semuanya Perlu Lazy Loading? (Rekomendasi: YA, WAJIB)**
>    - *Masalah*: `profil.html` memuat puluhan foto portofolio berkualitas tinggi dan aset visual yang dapat membuat HP pengguna lemot dan boros kuota.
>    - *Solusi*: Menerapkan **Full Lazy Loading** (`loading="lazy"`, `decoding="async"`) pada seluruh gambar galeri, thumbnail paket, dan avatar di `profil.html` dan `booking.html`.
>    - *Di Sisi Kasir (`App.tsx`)*: Menggunakan on-demand conditional rendering untuk modal berat (Struk Thermal Canvas, Tanda Tangan Digital, Laporan Keuangan) agar kalender utama terbuka instan tanpa jeda.

---

## 1. Arsitektur Siklus Demo Terpadu (End-to-End Demo Loop)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Layar Login (LoginAndSetupScreen)                   │
│         Tombol Sekunder: [🚀 Coba Mode Demo (Jadwal Terisi)]          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pilih Profesi (Foto / MUA / WO / MC)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Aplikasi Kasir & Kalender Demo (App.tsx)             │
│  - Kalender hari ini terisi 2 agenda lunas (Wisuda, Self Photo)        │
│  - 1 Agenda besok status DP dengan sisa tagihan                        │
│  - Lonceng Booking Web aktif (1 Pesanan Menunggu Konfirmasi)           │
│  - Tombol aksi: "Lihat Web Profil Demo Saya ↗"                        │
│  - Tombol menu samping: "🚪 Keluar Mode Demo"                          │
└───────────────────────┬─────────────────────────▲──────────────────────┘
                        │ Klik "Lihat Profil"     │ Pesanan Booking Masuk
                        ▼                         │
┌─────────────────────────────────────────────────┴──────────────────────┐
│                  Web Profil Publik Demo (profil.html?id=demo)          │
│  - Membaca data demo dari sessionStorage (0 Read Firebase)             │
│  - Menampilkan portofolio, bio, dan paket harga sesuai profesi          │
│  - Seluruh gambar galeri menggunakan FULL LAZY LOADING                │
│  - Tombol "Booking Online" ──> Form Booking Demo (booking.html)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Strategi Optimasi Performa: Full Lazy Loading

Untuk menjamin aplikasi terasa super ringan di perangkat seluler dan hemat data:

### A. Pada `public/profil.html` & `public/booking.html`:
1. **Native Lazy Loading**:
   - Menambahkan `loading="lazy"` dan `decoding="async"` pada semua elemen `<img>` di grid portofolio, galeri karya, dan thumbnail layanan.
2. **Skeleton & Placeholder Ringan**:
   - Menampilkan bingkai placeholder warna netral sebelum gambar selesai di-decode browser sehingga layout tidak melompat (*Zero Cumulative Layout Shift*).
3. **Threshold Scroll Observer**:
   - Gambar hanya dimuat saat pengunjung menggulir mendekati 200px dari viewport.

### B. Pada Aplikasi Utama (`src/App.tsx` & Komponen):
1. **On-Demand Modal Rendering**:
   - Komponen berat seperti kanvas cetak struk thermal, generator Base64 gambar, dan modal tanda tangan digital hanya diinisialisasi saat tombol ditekan oleh pengguna.
2. **Zero-Read Memory Cache**:
   - Sesi demo beroperasi murni di RAM dan `localStorage`, sama sekali tidak memanggil jaringan internet, sehingga bebas biaya kuota dan dapat dijalankan secara offline.

---

## 3. Rincian Fitur Mode Demo yang Dibangun

### A. Layar Login & Pemilihan Profesi (`LoginAndSetupScreen.tsx`)
- Tombol elegan di bawah form login: `[🚀 Coba Mode Demo (Jadwal Terisi)]`.
- Modal interaktif dengan 4 pilihan kartu profesi:
  - 📸 **Studio Foto & Fotografi** (Self Photo, Wisuda, Wedding, Pas Foto)
  - 💄 **MUA & Rias Pengantin** (Makeup Wisuda, Wedding, Prewedding & Henna)
  - 💍 **Wedding Organizer** (Akad Intimate, Resepsi Ballroom, Full Day)
  - 🎤 **MC & Event Host** (MC Wedding, Lamaran, Sound System)

### B. Dashboard Kasir & Kalender Terisi (`App.tsx` & `demoDataSeeder.ts`)
- **Kalender Hari Ini**: Otomatis terisi jadwal berstatus Lunas dan DP relatif terhadap tanggal saat ini (`Date.now()`).
- **Simulasi Booking Web Masuk**: Terdapat 1 pesanan baru dari website publik siap dicoba untuk diterima atau dihubungi via WhatsApp.
- **Akses Cepat Web Profil Demo**: Di dalam menu Pengaturan Studio terdapat tombol "Buka Website Profil Demo Saya ↗" yang mengarahkan ke `profil.html?id=demo`.
- **Tombol Keluar Demo**: Ditempatkan di navigasi sidebar desktop dan drawer mobile tanpa banner mengambang di atas layar.

### C. Web Profil Demo & Booking Demo (`profil.html` & `booking.html`)
- Mendeteksi parameter `id=demo` atau membaca `sessionStorage`.
- Menampilkan data profil, katalog paket, logo, dan galeri portofolio demo dengan tema yang elegan.
- Menerapkan **Full Lazy Loading** pada seluruh gambar galeri.

---

## 4. Rencana Eksekusi Berkas

1. **`src/services/demoDataSeeder.ts`**:
   - Menyesuaikan fungsi generator agar menyertakan data lengkap untuk profil web demo (tagline, bio, paket, portofolio demo).
   - Memastikan tanggal jadwal selalu dinamis terhadap hari ini (`today`).
2. **`src/components/LoginAndSetupScreen.tsx`**:
   - Menghidupkan tombol pemicu demo di bawah form login.
   - Merender modal pilihan 4 preset profesi yang interaktif.
3. **`src/App.tsx`**:
   - Menyediakan handler keluar demo di menu sidebar dan drawer navigasi.
   - Menyimpan draft demo ke `sessionStorage` agar `profil.html?id=demo` dapat langsung membacanya.
4. **`public/profil.html` & `public/booking.html`**:
   - Menambahkan deteksi rute demo (`id=demo`) untuk memuat data demo dari `sessionStorage`.
   - Mengoptimasi seluruh tag `<img>` galeri dan paket dengan atribut `loading="lazy"` dan `decoding="async"`.
