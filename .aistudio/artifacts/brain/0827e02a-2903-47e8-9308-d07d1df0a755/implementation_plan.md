# Arsitektur Tangguh: Native Firestore Persistence & Indikator Jaringan Ringan

Analisis komparatif arsitektur (Tangguh vs Rapuh) dan rencana implementasi solusi offline yang paling kokoh, stabil, dan minim risiko menggunakan **fitur resmi Google Cloud Firestore Offline Persistence** dipadukan dengan **Indikator Visual Koneksi Ringan**.

---

## Analisis: Apakah Offline Membuat Aplikasi Lebih Tangguh atau Malah Rapuh?

| Pendekatan | Risiko Kerapuhan | Tingkat Ketangguhan | Keputusan |
| :--- | :--- | :--- | :--- |
| **A. Custom Queue Rumit (Buatan Sendiri)** | **Tinggi (Bisa Rapuh):** Berisiko *stuck queue* (antrean macet), rawan duplikasi jadwal, dan potensi *race condition* jika internet putus-nyambung. | Sedang | ❌ **Dihindari** (Terlalu berisiko membuat aplikasi rapuh) |
| **B. Native Firestore Offline Persistence + Safe UX (Rekomendasi)** | **Nol:** Menggunakan mesin sinkronisasi resmi Google yang memiliki *exponential backoff, retry*, dan konsistensi data otomatis di level SDK. | **Sangat Tinggi (100% Tangguh):** Kasir tetap bisa mencatat dan membaca data saat offline, data otomatis tersinkron saat internet pulih tanpa beban kode rumit. | ✅ **Dipilih (Solusi Terbaik & Paling Tangguh)** |

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan Arsitektur Terbaik:**
> 1. **Tanpa Custom Queue Rumit**: Menghindari antrean buatan sendiri yang rawan macet (*fragile*), melainkan mengaktifkan **Native IndexedDB Persistence bawaan Firestore SDK**.
> 2. **Ketangguhan Kasir Offline**:
>    - Aplikasi tetap 100% dapat dibuka saat tidak ada internet (didukung PWA & Local Cache).
>    - Jadwal, kalender, pencarian arsip, dan cetak struk thermal Bluetooth tetap berfungsi normal.
>    - Transaksi baru yang disimpan saat offline langsung masuk ke mesin persistensi Firestore dan dikirim ke server saat internet kembali terhubung.
> 3. **Indikator Koneksi Ringan & Tenang**:
>    - Menampilkan status visual yang jelas di sudut atas bilah kasir saat perangkat offline (`"Mode Offline (Lokal)"`) dan kembali normal saat online (`"Online & Tersinkron"`).

---

## 1. Overview & Core Concept

- **Tujuan**: Memberikan ketenangan bagi kasir bahwa aplikasi tidak akan pernah *hang*, macet, atau kehilangan transaksi saat internet mati, tanpa menambah kode rumit yang berpotensi menjadi bumerang (*fragile*).
- **Cara Kerja**:
  1. Firestore SDK diinisialisasi dengan konfigurasi `persistentLocalCache` & `persistentMultipleTabManager` resmi dari Google Firebase JS SDK.
  2. Saat online: Transaksi langsung tercatat ke Cloud Firestore dan di-cache ke memori lokal.
  3. Saat offline: Transaksi disimpan secara aman di storage terisolasi per-owner, UI kasir langsung terbarui instan, struk kasir bisa langsung dicetak ke printer fisik.
  4. Saat online kembali: SDK Firestore secara cerdas melakukan negosiasi data dengan server dan mengunggah perubahan tanpa risiko data tertimpa atau macet.

---

## 2. User Experience & Visual Design

- **Bilah Header Kasir**:
  - **Saat Online**: Ikon status hijau halus / tidak mengganggu ritme kerja kasir.
  - **Saat Offline**: Lencana elegan amber di samping tombol profil:
    - Ikon `WifiOff` + teks `"Offline • Transaksi Tersimpan di HP"`.
  - **Saat Internet Pulih**: Transisi animasi sejenak: `"✓ Terhubung Kembali"`, lalu lencana menghilang dengan mulus.
- **Formulir Kasir**:
  - Tetap responsif, tombol Simpan tidak diblokir, struk tetap keluar.

---

## 3. Technical Architecture & Implementation Steps

```
┌─────────────────────────────────────────────────────────────────┐
│                     Perangkat Kasir (HP / PC)                   │
│                                                                 │
│  Kasir Menyimpan Jadwal / DP / Pelunasan                       │
│        │                                                        │
│        ▼                                                        │
│  React State Update + Workspace Cache Lokal (Instan)            │
│        │                                                        │
│        ▼                                                        │
│  Google Firestore SDK: persistentLocalCache (Resmi)             │
│  (IndexedDB terenkripsi per sesi browser)                      │
│        │                                                        │
│   [Jika Offline]                       [Jika Online]            │
│        │                                     │                  │
│        ▼                                     ▼                  │
│  Lencana "Mode Offline"              Langsung Sync ke Cloud     │
│  Tersimpan di IndexedDB SDK                 Firestore           │
│        │                                     ▲                  │
│        │ [Koneksi Internet Kembali Pulih]    │                  │
│        └─────────────────────────────────────┘                  │
│              Auto-negotiate & push oleh SDK                     │
└─────────────────────────────────────────────────────────────────┘
```

### Langkah Eksekusi Teknis:
1. **Konfigurasi Firestore Persistence (`src/services/firebaseClient.ts`)**:
   - Memastikan Firestore diinisialisasi menggunakan `initializeFirestore` dengan opsi `persistentLocalCache` dan `persistentMultipleTabManager` agar multi-tab dan mode offline bekerja optimal.
2. **Indikator Koneksi Ringan (`src/App.tsx` & `src/components/NetworkStatusBadge.tsx`)**:
   - Menambahkan pemantau status `navigator.onLine` dan event listener `online` / `offline`.
   - Menampilkan lencana status yang informatif dan menenangkan kasir.
3. **Uji Validasi**:
   - Menjalankan build TypeScript & verifikasi kelancaran aplikasi.
