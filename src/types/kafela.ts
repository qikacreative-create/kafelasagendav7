export interface AttireModel {
  cpwModel?: string;
  cpwUkuran?: string;
  cppModel?: string;
  cppUkuran?: string;
  catatanAttire?: string;
}

export interface FotoTeknisModel {
  jmlShooter?: string;
  droneLighting?: string;
  namaKru?: string;
  linkDrive?: string;
}

export interface McProtokolModel {
  bahasaGaya?: string;
  dresscode?: string;
  tokohPenting?: string;
  catatanKhusus?: string;
}

export interface WoKoordinasiModel {
  jmlUndangan?: string;
  picGedung?: string;
  daftarVendor?: string;
  linkRundown?: string;
}

export interface JadwalFotografi {
  idJadwal: string;
  namaAcara: string;
  namaKlien: string;
  lokasi: string;
  paket: string;
  hargaPaketDasar: number;
  namaTambahan: string;
  hargaTambahan: number;
  namaPic: string;
  waPic: string;
  waktuMulai: number;
  waktuSelesai: number;
  tanggalMulai: number;
  tanggalSelesaiEvent: number;
  status: 'Booking' | 'DP' | 'Lunas' | 'Dibatalkan' | 'Menunggu Konfirmasi';
  hargaKotor: number;
  diskon: number;
  dpDibayar: number;
  catatan: string;
  sumber: '' | 'WEB' | 'WEB_TERKONFIRMASI' | 'KASIR_POS';
  attire?: AttireModel;
  fotoTeknis?: FotoTeknisModel;
  mcProtokol?: McProtokolModel;
  woKoordinasi?: WoKoordinasiModel;
  isFromArchive?: boolean;
  archiveDocId?: string;
}

export interface PaketLayanan {
  idPaket: string;
  namaPaket: string;
  hargaPaket: number;
  deskripsiPaket: string;
  urutan: number;
}

export interface AnggotaTimModel {
  uid: string;
  nama: string;
  username?: string;
  loginId?: string;
  noWhatsApp: string;
  password?: string;
  role: 'admin' | 'anggota';
  posisi: string;
  namaBrand: string;
  ownerParentId: string;
  tanggalDibuat: number;
}

export interface RekeningModel {
  bankUtama: string;
  rekUtama: string;
  namaUtama: string;
  bankAlternatif: string;
  rekAlternatif: string;
  namaAlternatif: string;
  linkPembayaran: string;
  catatanRekening: string;
}

export type PenempatanLogoMode = 'KEDUANYA' | 'SAMPING' | 'WATERMARK' | 'TIDAK_TAMPIL';
export type PaketLanggananTier = 'Starter' | 'Pro' | 'Ultimate';
export type UserRoleType = 'owner' | 'admin' | 'anggota';
export type BrandStatusType = 'AKTIF' | 'SUSPENDED' | 'TRIAL';

export interface BrandRegistryItem {
  id: string; // usually slug
  slug: string; // e.g. "kfls"
  namaBrand: string; // e.g. "Kafela Studio"
  ownerId: string; // Firebase UID / Document ID di /owners/{ownerId}
  ownerEmail?: string;
  ownerWhatsApp?: string;
  customDomain?: string; // e.g. "kflsagnd.web.app" or "brand.web.app" or "studioanda.com"
  tier: PaketLanggananTier; // "Starter" | "Pro" | "Ultimate"
  status: BrandStatusType;
  maxJadwal?: number;
  createdAt: number;
  expiredAt: number; // timestamp ms
  catatan?: string;
}

export type WebLayoutType =
  | 'HORIZONTAL_BOOK' // 1. Buku Editorial Majalah (Geser Samping)
  | 'VERTICAL_LANDING' // 2. Landing Page Modern (Scroll Vertikal)
  | 'CINEMATIC_SHOWCASE' // 3. Sinematik Layar Lebar 21:9 & Moodboard Gelap
  | 'GRID_MASONRY' // 4. Galeri Masonry & Moodboard Estetik
  | 'SPLIT_EDITORIAL' // 5. Split-Screen Dual-Pane Atelier
  | 'MINIMAL_LINKTREE' // 6. Bio-Link Premium & Quick Accordion
  | 'CAROUSEL_FULLSCREEN' // 7. Fullscreen Slide Imersif & Bottom Sheet
  | 'RETRO_BRUTALIST'; // 8. Neo-Brutalist & Pop Studio Modern

export interface WebProfilSekunder {
  aktif: boolean;
  subJudul?: string; // misal "Wedding & Prewedding", "Self Studio & Graduation", "Katalog Busana"
  jenisUsaha?: string;
  usernameSlug?: string;
  taglineWeb?: string;
  bioWeb?: string;
  email?: string;
  noWhatsApp?: string;
  linkIg?: string;
  linkTiktok?: string;
  linkYoutube?: string;
  linkFacebook?: string;
  temaWeb?: 'MODERN_STUDIO' | 'LUXURY_GOLD' | 'CLEAN_MINIMALIST' | 'VERTICAL_LANDING';
  layoutWeb?: WebLayoutType;
  portofolioWeb?: string[];
  portofolioCaptions?: string[];
  linkBookingKhusus?: string; // jika diisi, pakai link ini; jika kosong, pakai booking bawaan
  pesanPenutupWeb?: string;
  jamOperasionalWeb?: string;
  ctaTeksKustom?: string;
  ctaLinkKustom?: string;
}

export interface OwnerProfile {
  uid: string;
  namaOwner: string;
  namaBrand: string;
  saldo?: number;
  noWhatsApp: string;
  email?: string;
  jenisUsaha: string;
  paketAktif: PaketLanggananTier;
  tanggalDaftar: number;
  tanggalLangganan: number;
  username: string;
  taglineWeb: string;
  bioWeb?: string;
  linkIg: string;
  linkTiktok: string;
  linkYoutube?: string;
  linkFacebook?: string;
  lokasi1: string;
  lokasi2: string;
  lokasi3: string;
  logoBrandUrl: string;
  penempatanLogo: PenempatanLogoMode;
  ttdUrl: string;
  portofolioWeb: string[];
  portofolioCaptions?: string[];
  temaWeb?: 'MODERN_STUDIO' | 'LUXURY_GOLD' | 'CLEAN_MINIMALIST' | 'VERTICAL_LANDING';
  layoutWeb?: WebLayoutType;
  pesanPenutupWeb?: string;
  jamOperasionalWeb?: string;
  ctaTeksKustom?: string;
  ctaLinkKustom?: string;
  teksTombolBooking?: string;
  isWebsiteActive?: boolean;
  isBookingActive?: boolean;
  webProfil2?: WebProfilSekunder;
  templateWaTagihan: string;
  templateWaKonfirmasi: string;
  templateWaBookingWeb: string;
  warnaTema: string;
  gayaLatarNavigasi?: 'SOLID' | 'GLASS' | 'GRADIENT' | 'DARK_ACCENT';
  opasitasNavigasi?: number;
  isKacaGelap: boolean;
  opasitasOverlay: string;
  customBackgroundUrl?: string;
  customBackgroundBlur?: number;
  customBackgroundOpacity?: number;
  customBackgroundOverlayType?: 'HITAM' | 'PUTIH';
  opasitasKartu?: number;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface QuotaStats {
  readsSession: number;
  writesSession: number;
  cacheHitsSession: number;
  lastSyncedAt: number;
  syncMode: 'CACHE_PRO' | 'LIVE_ULTIMATE' | 'LOCKED_STARTER';
  isIdlePaused: boolean;
  isLiveListenerActive?: boolean;
}

export interface ThemePaletteItem {
  id: string;
  name: string;
  hex: string;
  category: 'Profesional & Elegan' | 'Terang & Ceria' | 'Pastel & Lembut';
}

export const KAFELA_THEME_COLORS: ThemePaletteItem[] = [
  // Kategori 1: Profesional & Elegan
  { id: 'warnaDefault', name: 'Slate Default', hex: '#34495E', category: 'Profesional & Elegan' },
  { id: 'warnaMaroon', name: 'Maroon', hex: '#800000', category: 'Profesional & Elegan' },
  { id: 'warnaBiru', name: 'Ocean Blue', hex: '#2980B9', category: 'Profesional & Elegan' },
  { id: 'warnahijautua', name: 'Emerald Dark', hex: '#04361D', category: 'Profesional & Elegan' },
  { id: 'warnaMahogany', name: 'Mahogany', hex: '#C04000', category: 'Profesional & Elegan' },
  { id: 'warnaDeepPurple', name: 'Deep Purple', hex: '#5E35B1', category: 'Profesional & Elegan' },
  { id: 'warnagrey', name: 'Steel Grey', hex: '#616A6B', category: 'Profesional & Elegan' },
  { id: 'warnaOnyx', name: 'Onyx Black', hex: '#212121', category: 'Profesional & Elegan' },
  { id: 'warnaNavy', name: 'Royal Navy', hex: '#1A237E', category: 'Profesional & Elegan' },
  { id: 'warnaCrimson', name: 'Crimson', hex: '#B71C1C', category: 'Profesional & Elegan' },
  { id: 'warnaTeal', name: 'Deep Teal', hex: '#004D40', category: 'Profesional & Elegan' },
  { id: 'warnaForest', name: 'Forest Green', hex: '#1B5E20', category: 'Profesional & Elegan' },
  { id: 'warnaKopi', name: 'Espresso Kopi', hex: '#3E2723', category: 'Profesional & Elegan' },
  { id: 'warnaMidnight', name: 'Midnight Blue', hex: '#0D47A1', category: 'Profesional & Elegan' },
  { id: 'warnaCharcoal', name: 'Charcoal', hex: '#37474F', category: 'Profesional & Elegan' },
  { id: 'warnaOlive', name: 'Olive', hex: '#33691E', category: 'Profesional & Elegan' },
  // Kategori 2: Terang & Ceria
  { id: 'warnaMerahTerang', name: 'Coral Red', hex: '#E74C3C', category: 'Terang & Ceria' },
  { id: 'warnaOrange', name: 'Sunset Orange', hex: '#E67E22', category: 'Terang & Ceria' },
  { id: 'warnaHijau', name: 'Fresh Green', hex: '#27AE60', category: 'Terang & Ceria' },
  { id: 'warnaBiruTerang', name: 'Sky Blue', hex: '#3498DB', category: 'Terang & Ceria' },
  { id: 'warnaKuning', name: 'Golden Sun', hex: '#D4AC0D', category: 'Terang & Ceria' },
  { id: 'warnaUngu', name: 'Amethyst', hex: '#9B59B6', category: 'Terang & Ceria' },
  { id: 'warnaPink', name: 'Rose Pink', hex: '#E91E63', category: 'Terang & Ceria' },
  { id: 'warnaCyan', name: 'Aqua Cyan', hex: '#0097A7', category: 'Terang & Ceria' },
  // Kategori 3: Pastel & Lembut
  { id: 'warnaSoftBlue', name: 'Soft Blue', hex: '#5499C7', category: 'Pastel & Lembut' },
  { id: 'warnaMint', name: 'Mint Leaf', hex: '#45B39D', category: 'Pastel & Lembut' },
  { id: 'warnaPeach', name: 'Warm Peach', hex: '#DC7633', category: 'Pastel & Lembut' },
  { id: 'warnaLavender', name: 'Soft Lavender', hex: '#8E44AD', category: 'Pastel & Lembut' },
];

export const DAFTAR_JENIS_USAHA = [
  'Fotografi & Studio Foto',
  'Make Up Artist (MUA)',
  'Wedding Organizer (WO)',
  'Master of Ceremony (MC)',
  'Videografi & Sinematografi',
  'Sewa Pakaian & Gaun',
  'Dekorasi & Tenda',
  'Sound System & Musik',
  'Umum / Standar',
];

export interface TopUpRequest {
  id: string;
  ownerUid: string;
  ownerName: string;
  brandName: string;
  amount: number;
  buktiTransferUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
}
