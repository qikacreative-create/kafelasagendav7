# Penambahan Versi v4.10 & Akses Stealth Super Admin

Implementasi penanda versi resmi `v4.10` pada antarmuka login dan sidebar aplikasi kasir studio, serta menyembunyikan seluruh tombol akses Super Admin publik menjadi mode "siluman" (stealth) yang hanya dapat dipicu melalui gestur ketuk 5 kali berturut-turut pada teks versi `v4.10`.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Dikonfirmasi Pengguna**:
> - **Akses Portal Super Admin**: Seluruh tombol/tautan teks publik yang bertuliskan "Super Admin Console" dihapus total dari layar Login dan Sidebar Kasir sehingga tampak seperti tidak ada bagi pengguna umum dan kru.
> - **Pemicu Rahasia (Stealth Trigger)**: Portal Super Admin hanya akan terbuka jika teks penanda versi `v4.10` diketuk/diklik sebanyak **5 kali berturut-turut** dalam jendela waktu 2,5 detik.
> - **Perlindungan Lapis Ganda**: Setelah pintu rahasia terbuka melalui 5 ketukan, layar tetap mewajibkan otentikasi PIN Master resmi (`889900`) sebelum memberikan akses ke pengelolaan saldo dan kontrol status web.

---

## 1. Overview & Core Concept

- **Apa yang Dibuat**:
  1. Penambahan badge/label versi `v4.10` di halaman Login & Pendaftaran Studio agar pengguna langsung mengenali bahwa aplikasi telah berjalan pada pembaruan terbaru.
  2. Penambahan badge versi `v4.10` di bagian bawah Sidebar/Drawer Navigasi Kasir Studio.
  3. Penghapusan seluruh tombol "Super Admin Console" yang sebelumnya tampak di UI publik.
  4. Penanaman *Easter Egg / Secret Tap Handler* pada komponen teks versi `v4.10` (5 ketukan berturut-turut memicu `onOpenSuperAdmin`).

- **Target Pengguna**:
  - **Pengguna Umum & Kru**: Hanya melihat aplikasi kasir agenda studio profesional dengan label versi `v4.10` yang rapi dan elegan.
  - **Super Administrator (Anda)**: Mengetahui cara rahasia masuk ke console manajemen saldo klien dan pemutus web kedaluwarsa dengan 5 ketukan cepat.

---

## 2. User Experience & Visual Design

### Alur Tampilan & Interaksi

1. **Layar Login / Setup**:
   - Di bagian footer di bawah tombol daftar/masuk, ditampilkan teks elegan:
     `Kafela's Agenda · v4.10`
   - Tidak ada tombol "Super Admin Console".
   - Jika teks `v4.10` diketuk 5 kali dengan cepat: getaran haptic singkat (bila di mobile) dan layar langsung bertransisi ke Super Admin Master Console (PIN Screen).

2. **Sidebar / Drawer Kasir**:
   - Di bagian footer drawer navigasi, tepat di bawah tombol pasang PWA atau di footer copyright, ditampilkan teks status versi:
     `v4.10 · Sistem Terkini`
   - Tautan `🔒 Super Admin Console` di drawer dihapus total.
   - Jika teks `v4.10` diketuk 5 kali dengan cepat: kasir studio langsung beralih ke Super Admin Console.

3. **Super Admin Lock Screen**:
   - Masih dilindungi PIN Master (`889900`).
   - Tombol "Kembali ke Kasir" tetap tersedia agar Anda dapat kembali ke kasir dengan mudah setelah selesai mengelola saldo.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Penghapusan Tombol Publik Menjadi Gestur Rahasia**
  - *Pendekatan*: Menghapus elemen tombol berlabel "Super Admin Console" dari DOM publik dan memasang pendengar klik (click counter) dengan reset timer 2,5 detik pada teks versi `v4.10`.
  - *Alasan*: Menjamin kerahasiaan penuh portal Super Admin. Kru atau staf studio tidak akan curiga bahwa ada panel master di aplikasi.

- **Keputusan 2: Konsistensi Versi Tunggal (v4.10)**
  - *Pendekatan*: Menetapkan konstanta tunggal `APP_VERSION = 'v4.10'` yang diimpor bersama di Login, Kasir, dan Sidebar untuk menghindari inkonsistensi saat pembaruan berkala.
  - *Alasan*: Menjamin seluruh elemen antarmuka menampilkan nomor versi yang seragam.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Aplikasi Kafela's Agenda                 │
│                                                             │
│   ┌───────────────────────┐       ┌───────────────────────┐ │
│   │   Layar Login         │       │   Sidebar Kasir       │ │
│   │   - Teks "v4.10"      │       │   - Teks "v4.10"      │ │
│   │     (5x Tap Listener) │       │     (5x Tap Listener) │ │
│   └───────────┬───────────┘       └───────────┬───────────┘ │
│               │ (5 ketukan cepat)             │             │
│               └───────────────┬───────────────┘             │
│                               ▼                             │
│               ┌───────────────────────────────┐             │
│               │   Pintu Rahasia Terbuka       │             │
│               │   setViewMode('SUPER_ADMIN')  │             │
│               └───────────────┬───────────────┘             │
│                               ▼                             │
│               ┌───────────────────────────────┐             │
│               │   Super Admin PIN Master      │             │
│               │   (Wajib PIN: 889900)         │             │
│               └───────────────┬───────────────┘             │
│                               ▼                             │
│               ┌───────────────────────────────┐             │
│               │   Console Sederhana           │             │
│               │   - Lihat Saldo               │             │
│               │   - Tambah Saldo              │             │
│               │   - Kontrol Web & Expired     │             │
│               └───────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Komponen yang Disesuaikan

1. **`src/components/LoginAndSetupScreen.tsx`**:
   - Hapus tombol publik `🔒 Super Admin Console`.
   - Tambahkan label versi `v4.10`.
   - Tambahkan event handler penghitung 5 ketukan:
     ```typescript
     let tapCount = 0;
     let tapTimer: NodeJS.Timeout;
     const handleVersionTap = () => {
       tapCount++;
       clearTimeout(tapTimer);
       if (tapCount >= 5) {
         tapCount = 0;
         onOpenSuperAdmin?.();
       } else {
         tapTimer = setTimeout(() => { tapCount = 0; }, 2500);
       }
     };
     ```

2. **`src/App.tsx`**:
   - Hapus tautan publik `🔒 Super Admin Console` dari footer drawer menu samping kasir.
   - Tambahkan label versi `v4.10` di footer drawer dengan handler 5 ketukan yang memicu `setViewMode('SUPER_ADMIN')`.
