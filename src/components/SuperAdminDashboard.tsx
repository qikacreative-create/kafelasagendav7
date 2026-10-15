import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Globe,
  Key,
  Layers,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Server,
  Share2,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { BrandRegistryItem, BrandStatusType, PaketLanggananTier, TopUpRequest } from '../types/kafela';
import {
  deleteBrandRegistryFromFirebase,
  fetchBrandsRegistryFromFirebase,
  fetchTopUpRequests,
  getLocalCachedBrands,
  saveBrandRegistryToFirebase,
  syncAllBrandsToFirebase,
  updateTopUpStatus,
} from '../services/firebaseClient';
import { formatTanggalIndo } from '../utils/formatters';
import { getLimits } from '../utils/subscription';

interface SuperAdminDashboardProps {
  onSelectBrandForCashier: (brand: BrandRegistryItem) => void;
  onExitSuperAdmin: () => void;
}

const DEFAULT_MASTER_PIN = '889900';
const PIN_STORAGE_KEY = 'KAFELA_SUPERADMIN_AUTH_KEY';

export function SuperAdminDashboard({
  onSelectBrandForCashier,
  onExitSuperAdmin,
}: SuperAdminDashboardProps) {
  // Autentikasi Super Admin
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(PIN_STORAGE_KEY) === 'UNLOCKED';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Data Direktori Brand & Top-Ups
  const [brands, setBrands] = useState<BrandRegistryItem[]>(() => getLocalCachedBrands());
  const [activeAdminTab, setActiveAdminTab] = useState<'BRANDS' | 'TOPUPS'>('BRANDS');
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingBrand, setEditingBrand] = useState<BrandRegistryItem | null>(null);
  const [shareBrand, setShareBrand] = useState<BrandRegistryItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Tambah / Edit Brand
  const [formNamaBrand, setFormNamaBrand] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formWhatsApp, setFormWhatsApp] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formCustomDomain, setFormCustomDomain] = useState<string>('');
  const [formTier, setFormTier] = useState<PaketLanggananTier>('Pro');
  const [formStatus, setFormStatus] = useState<BrandStatusType>('AKTIF');
  const [formDurasiBulan, setFormDurasiBulan] = useState<number>(12);
  const [formCatatan, setFormCatatan] = useState<string>('');

  const getBrandDomain = (slug: string, customDom?: string) => {
    const dom = (customDom || '').trim();
    if (dom) return dom.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return `${slug}.web.app`;
  };

  useEffect(() => {
    if (isUnlocked) {
      loadBrandsData();
    }
  }, [isUnlocked]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadBrandsData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBrandsRegistryFromFirebase();
      setBrands(data);
      const topUps = await fetchTopUpRequests();
      setTopUpRequests(topUps);
    } catch (err) {
      console.warn('Gagal memuat brands dari remote, memakai cache:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveTopUp = async (req: TopUpRequest) => {
    if (!confirm(`Setujui top-up saldo sebesar Rp ${req.amount.toLocaleString()} untuk "${req.brandName}"? Saldo owner akan bertambah.`)) return;
    setIsLoading(true);
    const res = await updateTopUpStatus(req.id, 'APPROVED', req.ownerUid, req.amount);
    setIsLoading(false);
    if (res.success) {
      showToast(`Top-up Rp ${req.amount.toLocaleString()} berhasil disetujui & ditambahkan ke saldo!`);
      loadBrandsData();
    } else {
      alert(res.error || 'Gagal menyetujui top-up.');
    }
  };

  const handleRejectTopUp = async (req: TopUpRequest) => {
    if (!confirm(`Tolak top-up saldo dari "${req.brandName}"?`)) return;
    setIsLoading(true);
    const res = await updateTopUpStatus(req.id, 'REJECTED');
    setIsLoading(false);
    if (res.success) {
      showToast('Top-up ditolak.');
      loadBrandsData();
    } else {
      alert(res.error || 'Gagal menolak top-up.');
    }
  };

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === DEFAULT_MASTER_PIN) {
      sessionStorage.setItem(PIN_STORAGE_KEY, 'UNLOCKED');
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('PIN Master salah! Gunakan PIN default');
    }
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem(PIN_STORAGE_KEY);
    setIsUnlocked(false);
    setPinInput('');
  };

  // Helper Auto Generate Slug dari Nama Brand
  const handleNamaBrandChange = (val: string) => {
    setFormNamaBrand(val);
    if (!editingBrand) {
      const slugGenerated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setFormSlug(slugGenerated);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    setFormNamaBrand('');
    setFormSlug('');
    setFormWhatsApp('');
    setFormEmail('');
    setFormCustomDomain('');
    setFormTier('Pro');
    setFormStatus('AKTIF');
    setFormDurasiBulan(12);
    setFormCatatan('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (b: BrandRegistryItem) => {
    setEditingBrand(b);
    setFormNamaBrand(b.namaBrand);
    setFormSlug(b.slug);
    setFormWhatsApp(b.ownerWhatsApp || '');
    setFormEmail(b.ownerEmail || '');
    setFormCustomDomain(b.customDomain || '');
    setFormTier(b.tier);
    setFormStatus(b.status);
    setFormDurasiBulan(12);
    setFormCatatan(b.catatan || '');
    setIsAddModalOpen(true);
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = formSlug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug || !formNamaBrand.trim()) {
      alert('Nama Brand dan Slug URL wajib diisi!');
      return;
    }

    // --- PEMBATASAN MULTI-WEBSITE ---
    const existingBrands = brands.filter(b => b.ownerId === (editingBrand ? editingBrand.ownerId : `owner-${cleanSlug}-${Date.now().toString().slice(-4)}`));
    const limits = getLimits(formTier);
    if (existingBrands.length >= limits.maxWebsites && !editingBrand) {
      alert(`Klien ini berada di paket ${formTier} dan hanya diperbolehkan memiliki ${limits.maxWebsites} website. Mohon upgrade ke paket Ultimate untuk menambah website.`);
      return;
    }
    // ---------------------------------

    const maxJadwal = formTier === 'Ultimate' ? 99999 : formTier === 'Pro' ? 300 : 75;
    const now = Date.now();
    const expiredAt =
      editingBrand && editingBrand.expiredAt > now
        ? editingBrand.expiredAt
        : now + formDurasiBulan * 30 * 86400000;

    const brandPayload: BrandRegistryItem = {
      id: cleanSlug,
      slug: cleanSlug,
      namaBrand: formNamaBrand.trim(),
      ownerId: editingBrand ? editingBrand.ownerId : `owner-${cleanSlug}-${Date.now().toString().slice(-4)}`,
      ownerEmail: formEmail.trim() || undefined,
      ownerWhatsApp: formWhatsApp.trim() || undefined,
      customDomain: formCustomDomain.trim() ? formCustomDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '') : undefined,
      tier: formTier,
      status: formStatus,
      maxJadwal,
      createdAt: editingBrand ? editingBrand.createdAt : now,
      expiredAt,
      catatan: formCatatan.trim() || undefined,
    };

    setIsLoading(true);
    const res = await saveBrandRegistryToFirebase(brandPayload);
    setIsLoading(false);

    if (res.success) {
      showToast(`Brand "${brandPayload.namaBrand}" berhasil disimpan!`);
      setIsAddModalOpen(false);
      loadBrandsData();
    } else {
      alert(`Gagal menyimpan: ${res.error}`);
    }
  };

  const handleClearDemoBrands = async () => {
    if (!confirm('Hapus semua brand contoh/demo dari direktori?')) return;
    try {
      localStorage.removeItem('KAFELA_BRANDS_REGISTRY_V1');
      setBrands([]);
      showToast('Semua brand contoh berhasil dihapus.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBrand = async (b: BrandRegistryItem) => {
    if (!confirm(`Hapus brand "${b.namaBrand}" (${b.slug}) beserta seluruh data akses secara permanen?`)) return;

    setIsLoading(true);
    const res = await deleteBrandRegistryFromFirebase(b.slug, b.ownerId);
    setIsLoading(false);
    if (res.success) {
      showToast(`Brand "${b.namaBrand}" telah dihapus.`);
      loadBrandsData();
    } else {
      alert(`Gagal menghapus brand: ${res.error || 'Terjadi kesalahan'}`);
    }
  };

  const handleExtend30Days = async (b: BrandRegistryItem) => {
    const baseTime = Math.max(b.expiredAt || Date.now(), Date.now());
    const newExpiredAt = baseTime + 30 * 24 * 60 * 60 * 1000;
    const updated: BrandRegistryItem = { ...b, expiredAt: newExpiredAt, status: 'AKTIF' };
    setIsLoading(true);
    await saveBrandRegistryToFirebase(updated);
    setIsLoading(false);
    showToast(`Masa aktif "${b.namaBrand}" berhasil diperpanjang 30 hari.`);
    loadBrandsData();
  };

  const handleQuickChangeTier = async (b: BrandRegistryItem, newTier: PaketLanggananTier) => {
    const updated: BrandRegistryItem = {
      ...b,
      tier: newTier,
      maxJadwal: newTier === 'Ultimate' ? 99999 : newTier === 'Pro' ? 300 : 75,
    };
    setIsLoading(true);
    await saveBrandRegistryToFirebase(updated);
    setIsLoading(false);
    showToast(`Tier "${b.namaBrand}" diubah ke ${newTier}.`);
    loadBrandsData();
  };

  const handleSyncAllToFirestore = async () => {
    if (!confirm(`Sinkronkan seluruh ${brands.length} brand ke koleksi Firestore /brands_registry?`)) return;

    setIsLoading(true);
    const res = await syncAllBrandsToFirebase(brands);
    setIsLoading(false);
    showToast(`Berhasil menyinkronkan ${res.successCount} dari ${res.total} brand ke Firestore.`);
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filtered list
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchSearch =
        b.namaBrand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.customDomain && b.customDomain.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.ownerWhatsApp && b.ownerWhatsApp.includes(searchQuery)) ||
        (b.ownerEmail && b.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTier = filterTier === 'ALL' || b.tier === filterTier;
      const daysLeft = Math.ceil((b.expiredAt - Date.now()) / (1000 * 60 * 60 * 24));
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'HAMPIR_HABIS' ? daysLeft > 0 && daysLeft <= 7 : b.status === filterStatus);

      return matchSearch && matchTier && matchStatus;
    });
  }, [brands, searchQuery, filterTier, filterStatus]);

  // Statistik Metrik Ringkas
  const stats = useMemo(() => {
    const total = brands.length;
    const aktif = brands.filter((b) => b.status === 'AKTIF').length;
    const trial = brands.filter((b) => b.status === 'TRIAL').length;
    const suspended = brands.filter((b) => b.status === 'SUSPENDED').length;
    const ultimate = brands.filter((b) => b.tier === 'Ultimate').length;
    const pro = brands.filter((b) => b.tier === 'Pro').length;
    const starter = brands.filter((b) => b.tier === 'Starter').length;

    return { total, aktif, trial, suspended, ultimate, pro, starter };
  }, [brands]);

  // =========================================================================
  // TAMPILAN LOCK SCREEN PIN MASTER JIKA BELUM TEROTENTIKASI
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center text-sky-400 mb-5 mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-center text-slate-100 mb-1">
            Super Admin Master Console
          </h1>
          <p className="text-xs text-center text-slate-400 mb-6">
            Pusat Lisensi Multi-Tenant &amp; Pengelolaan 30+ Brand Studio
          </p>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Masukkan PIN Master
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN Master"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm font-mono text-center tracking-widest text-slate-100 focus:outline-none"
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
              {pinError && <p className="text-xs text-rose-400 mt-2 text-center">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" /> Buka Master Console
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
            <button
              onClick={onExitSuperAdmin}
              className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Kembali ke Kasir
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN UTAMA SUPER ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR CONTRACT: Brand Wordmark — Breadcrumb/Links — Action CTA */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-6 sticky top-0 z-30">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shadow-inner">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-100 whitespace-nowrap">
                Kafela Master Console
              </span>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                MULTI-TENANT
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              kflsagnd.web.app / brands_registry
            </div>
          </div>
        </div>

        {/* Center Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Klien Terdaftar: <strong className="text-slate-200">{stats.total}</strong></span>
          <span className="text-slate-700">|</span>
          <span>Aktif: <strong className="text-emerald-400">{stats.aktif}</strong></span>
          <span className="text-slate-700">|</span>
          <span>Trial: <strong className="text-amber-400">{stats.trial}</strong></span>
          <span className="text-slate-700">|</span>
          <span>Suspended: <strong className="text-rose-400">{stats.suspended}</strong></span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenAddModal}
            className="bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Daftarkan Brand</span>
          </button>

          <button
            onClick={handleClearDemoBrands}
            className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-medium text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap border border-rose-500/30 cursor-pointer"
            title="Hapus semua brand contoh"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus Contoh</span>
          </button>

          <button
            onClick={onExitSuperAdmin}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap border border-slate-700 cursor-pointer"
            title="Keluar ke mode Kasir Studio"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kasir Studio</span>
          </button>

          <button
            onClick={handleLockAdmin}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kunci Console"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Tab Switcher: Direktori Brand vs Verifikasi Top-Up */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveAdminTab('BRANDS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeAdminTab === 'BRANDS' ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            🏢 Direktori Brand Klien ({brands.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAdminTab('TOPUPS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer relative ${
              activeAdminTab === 'TOPUPS' ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            💳 Verifikasi Top-Up Saldo 
            {topUpRequests.filter(r => r.status === 'PENDING').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                {topUpRequests.filter(r => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>

        {activeAdminTab === 'TOPUPS' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Verifikasi Top-Up Saldo Klien (Bukti Transfer)</h3>
                <p className="text-xs text-slate-400">Setujui permintaan top-up setelah mengecek bukti transfer untuk otomatis menambah saldo klien.</p>
              </div>
              <button
                type="button"
                onClick={loadBrandsData}
                className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> <span>Muat Ulang</span>
              </button>
            </div>

            {topUpRequests.length === 0 ? (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center text-slate-400 text-xs">
                Belum ada permintaan top-up saldo dari klien.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topUpRequests.map((req) => (
                  <div key={req.id} className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{req.brandName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Owner: <strong className="text-slate-200">{req.ownerName}</strong></p>
                      <p className="text-xs text-slate-400">Waktu: <strong className="text-slate-200">{new Date(req.createdAt).toLocaleString('id-ID')}</strong></p>
                      <p className="text-sm font-mono font-extrabold text-amber-400">Nominal: Rp {req.amount.toLocaleString()}</p>

                      {req.buktiTransferUrl && (
                        <div className="relative rounded-lg overflow-hidden h-36 bg-slate-950 border border-slate-800 cursor-pointer" onClick={() => setSelectedProofImg(req.buktiTransferUrl)}>
                          <img src={req.buktiTransferUrl} alt="Bukti TF" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-bold">
                            🔍 Perbesar Bukti TF
                          </div>
                        </div>
                      )}
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleRejectTopUp(req)}
                          className="flex-1 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold border border-rose-500/30 cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveTopUp(req)}
                          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shadow-md"
                        >
                          ✓ Setujui (+ Saldo)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* STATS STRIP: 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Total Klien / Brand</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              {stats.total} <span className="text-xs font-normal text-slate-500">Brand</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span>Ultimate: {stats.ultimate}</span>
              <span>·</span>
              <span>Pro: {stats.pro}</span>
              <span>·</span>
              <span>Starter: {stats.starter}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-emerald-400">Lisensi Aktif</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {stats.aktif}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Bebas akses kasir &amp; web profil
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-amber-400">Masa Trial</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-400">
              {stats.trial}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Evaluasi 30 hari pertama
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-rose-400">Kedaluwarsa / Suspended</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-400">
              {stats.suspended}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Perlu perpanjangan langganan
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari brand, slug URL, custom domain, atau no WA..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Hanya Aktif</option>
              <option value="TRIAL">Hanya Trial</option>
              <option value="HAMPIR_HABIS">Hampir Habis (&lt; 7 hari)</option>
              <option value="SUSPENDED">Hanya Suspended</option>
            </select>

            {/* Filter Tier */}
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="ALL">Semua Tier</option>
              <option value="Ultimate">Tier Ultimate</option>
              <option value="Pro">Tier Pro</option>
              <option value="Starter">Tier Starter</option>
            </select>

            {/* Batch Sync to Firebase */}
            <button
              onClick={handleSyncAllToFirestore}
              disabled={isLoading}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Sinkronkan semua data brand ke Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sinkron Cloud</span>
            </button>
          </div>
        </div>

        {/* BRANDS DATA TABLE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Direktori Brand &amp; Lisensi Klien
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                ({filteredBrands.length} dari {brands.length})
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Format Akses Publik: <code className="text-sky-400 font-mono">/nama-brand</code>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Brand &amp; Slug</th>
                  <th className="py-3 px-4">Domain / URL Web</th>
                  <th className="py-3 px-4">Pemilik &amp; Kontak</th>
                  <th className="py-3 px-4">Tier &amp; Kuota</th>
                  <th className="py-3 px-4">Status &amp; Masa Berlaku</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat (1-Klik)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Tidak ada brand yang cocok dengan kata kunci atau filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((b) => {
                    const isExpired = b.expiredAt < Date.now();
                    const daysLeft = Math.ceil((b.expiredAt - Date.now()) / (1000 * 60 * 60 * 24));
                    const statusClass =
                      b.status === 'AKTIF' && !isExpired
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : b.status === 'TRIAL'
                        ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

                    const tierBadgeClass =
                      b.tier === 'Ultimate'
                        ? 'text-purple-300 bg-purple-500/10 border-purple-500/20'
                        : b.tier === 'Pro'
                        ? 'text-sky-300 bg-sky-500/10 border-sky-500/20'
                        : 'text-slate-300 bg-slate-800 border-slate-700';

                    return (
                      <tr key={b.slug} className="hover:bg-slate-800/40 transition-colors">
                        {/* Brand & Slug */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{b.namaBrand}</span>
                          </div>
                          <div className="font-mono text-[11px] text-sky-400 flex items-center gap-1">
                            <span>/{b.slug}</span>
                          </div>
                          {b.catatan && (
                            <div className="text-[10px] text-slate-500 italic truncate max-w-xs">
                              {b.catatan}
                            </div>
                          )}
                        </td>

                        {/* Custom Domain / URL */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-sky-400">
                            <Globe className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{getBrandDomain(b.slug, b.customDomain)}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Booking: {getBrandDomain(b.slug, b.customDomain)}/booking
                          </div>
                        </td>

                        {/* Kontak */}
                        <td className="py-3 px-4">
                          {b.ownerWhatsApp ? (
                            <div className="text-slate-300 font-mono text-[11px]">
                              {b.ownerWhatsApp}
                            </div>
                          ) : (
                            <div className="text-slate-600">-</div>
                          )}
                          {b.ownerEmail && (
                            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                              {b.ownerEmail}
                            </div>
                          )}
                        </td>

                        {/* Tier */}
                        <td className="py-3 px-4">
                          <select
                            value={b.tier}
                            onChange={(e) => handleQuickChangeTier(b, e.target.value as PaketLanggananTier)}
                            className={`inline-block text-[10px] font-mono font-semibold px-2 py-1 rounded border ${tierBadgeClass} bg-slate-950 focus:outline-none focus:border-sky-500 cursor-pointer`}
                            title="Ganti paket tier instan"
                          >
                            <option value="Starter">Starter (75/bln)</option>
                            <option value="Pro">Pro (300/bln)</option>
                            <option value="Ultimate">Ultimate (Unlimited)</option>
                          </select>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Maks {b.maxJadwal && b.maxJadwal > 1000 ? 'Tanpa Batas' : `${b.maxJadwal || 300}/bln`}
                          </div>
                        </td>

                        {/* Status & Masa Berlaku */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${statusClass}`}
                          >
                            {isExpired ? 'KEDALUWARSA' : b.status}
                          </span>
                          <div className={`text-[10px] font-mono mt-1 ${daysLeft <= 7 && daysLeft > 0 ? 'text-amber-400 font-bold' : daysLeft <= 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                            {daysLeft > 0 ? `Sisa ${daysLeft} hari lagi` : 'Masa aktif habis'}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            s/d {formatTanggalIndo(b.expiredAt)}
                          </div>
                        </td>

                        {/* Aksi Cepat */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Perpanjang 30 Hari Cepat */}
                            <button
                              onClick={() => handleExtend30Days(b)}
                              className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Perpanjang masa aktif 30 hari instan"
                            >
                              <Clock className="w-3 h-3" />
                              <span>+30H</span>
                            </button>

                            {/* Buka Web Publik */}
                            <a
                              href={`/profil.html?id=${encodeURIComponent(b.slug)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                              title="Lihat Web Publik"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>

                            {/* Buka Kasir Studio Ini */}
                            <button
                              onClick={() => onSelectBrandForCashier(b)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Buka Kasir & Agenda Studio ini"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>

                            {/* Bagikan Link & Panduan Klien */}
                            <button
                              onClick={() => setShareBrand(b)}
                              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Bagikan Tautan & Kunci Akses Klien"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(b)}
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Edit Lisensi & Domain"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>

                            {/* Hapus */}
                            <button
                              onClick={() => handleDeleteBrand(b)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              title="Hapus Brand"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}
      </main>

      {/* =====================================================================
          MODAL TAMBAH / EDIT BRAND
          ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 mb-1">
              {editingBrand ? `Edit Brand: ${editingBrand.namaBrand}` : 'Daftarkan Brand Klien Baru'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Setiap brand mendapatkan web profil publik terisolasi dan portal kasir sendiri.
            </p>

            <form onSubmit={handleSaveBrand} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Nama Brand / Studio <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formNamaBrand}
                  onChange={(e) => handleNamaBrandChange(e.target.value)}
                  placeholder="Misal: Lensa Abadi Studio"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Slug URL Web <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-950 border border-r-0 border-slate-800 rounded-l-lg px-3 py-2 text-slate-500 font-mono text-xs">
                    /
                  </span>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="lensa-abadi"
                    required
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-r-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  URL akses publik nantinya: <code className="text-sky-400 font-mono">https://{getBrandDomain(formSlug || 'slug', formCustomDomain)}</code>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">WhatsApp Owner</label>
                  <input
                    type="text"
                    value={formWhatsApp}
                    onChange={(e) => setFormWhatsApp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Email Owner</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="owner@studio.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Custom Domain / Subdomain (Opsional)
                </label>
                <input
                  type="text"
                  value={formCustomDomain}
                  onChange={(e) => setFormCustomDomain(e.target.value)}
                  placeholder="Misal: lensaabadi.web.app atau lensaabadi.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Jika klien menghubungkan domain sendiri di Firebase Hosting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Paket Tier</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as PaketLanggananTier)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="Starter">Starter (75/bln)</option>
                    <option value="Pro">Pro (300/bln)</option>
                    <option value="Ultimate">Ultimate (Unlimited)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Status Lisensi</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as BrandStatusType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value="AKTIF">AKTIF</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Masa Aktif</label>
                  <select
                    value={formDurasiBulan}
                    onChange={(e) => setFormDurasiBulan(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <option value={1}>1 Bulan</option>
                    <option value={3}>3 Bulan</option>
                    <option value={6}>6 Bulan</option>
                    <option value={12}>1 Tahun (12 Bln)</option>
                    <option value={36}>3 Tahun</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Catatan Internal Super Admin</label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  placeholder="Catatan pembayaran, instruksi khusus, dll..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBrand ? 'Simpan Perubahan' : 'Daftarkan Brand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL BAGIKAN LINK & PANDUAN KLIEN
          ===================================================================== */}
      {shareBrand && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShareBrand(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Tautan Akses: {shareBrand.namaBrand}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Salin tautan ini untuk diberikan ke klien Anda agar mereka dapat mulai menggunakan web &amp; kasir.
            </p>

            <div className="space-y-4 text-xs">
              {/* 1. Link Web Profil Publik */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    Web Portofolio &amp; Profil Publik
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://${getBrandDomain(shareBrand.slug, shareBrand.customDomain)}`,
                        'webPublik'
                      )
                    }
                    className="text-slate-400 hover:text-sky-400 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copiedKey === 'webPublik' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'webPublik' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div className="font-mono text-sky-400 bg-slate-900 px-2 py-1.5 rounded text-[11px] break-all">
                  https://{getBrandDomain(shareBrand.slug, shareBrand.customDomain)}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Tombol masuk kasir disembunyikan sepenuhnya dari pandangan pengunjung publik.
                </p>
              </div>

              {/* 2. Link Booking Form Publik */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Formulir Booking Online Klien
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://${getBrandDomain(shareBrand.slug, shareBrand.customDomain)}/booking`,
                        'booking'
                      )
                    }
                    className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copiedKey === 'booking' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'booking' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div className="font-mono text-emerald-400 bg-slate-900 px-2 py-1.5 rounded text-[11px] break-all">
                  https://{getBrandDomain(shareBrand.slug, shareBrand.customDomain)}/booking
                </div>
              </div>

              {/* 3. Link Privat Masuk Kasir & Agenda */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Link Privat Kasir &amp; Agenda (Untuk Owner / Kru)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `https://${getBrandDomain(shareBrand.slug, shareBrand.customDomain)}/?app=1`,
                        'kasir'
                      )
                    }
                    className="text-slate-400 hover:text-amber-400 flex items-center gap-1 font-mono text-[11px]"
                  >
                    {copiedKey === 'kasir' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'kasir' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
                <div className="font-mono text-amber-400 bg-slate-900 px-2 py-1.5 rounded text-[11px] break-all">
                  https://{getBrandDomain(shareBrand.slug, shareBrand.customDomain)}/?app=1
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Akses langsung ke kasir, input jadwal, printer Bluetooth, dan keuangan khusus brand ini.
                </p>
              </div>

              {/* Salin Seluruh Template WA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const brandDom = getBrandDomain(shareBrand.slug, shareBrand.customDomain);
                    const text = `Halo Kak dari ${shareBrand.namaBrand}! 👋\n\nSelamat! Sistem Web & Kasir Studio Anda sudah aktif.\n\n🌐 Web Portofolio & Profil Resmi:\nhttps://${brandDom}\n\n📅 Link Booking Calon Klien:\nhttps://${brandDom}/booking\n\n💼 Portal Privat Kasir & Agenda Kru:\nhttps://${brandDom}/?app=1\n\nPaket Lisensi: ${shareBrand.tier}\nStatus: Aktif\n\nTerima kasih dan selamat berkarya!`;
                    copyToClipboard(text, 'semuaWa');
                  }}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Copy className="w-4 h-4 text-sky-400" />
                  <span>
                    {copiedKey === 'semuaWa'
                      ? 'Seluruh Teks Selamat Datang Tersalin!'
                      : 'Salin Teks Lengkap Sambutan WhatsApp Klien'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX BUKTI TRANSFER */}
      {selectedProofImg && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedProofImg(null)}>
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white">Bukti Transfer Top-Up</h4>
              <button type="button" onClick={() => setSelectedProofImg(null)} className="text-slate-400 hover:text-white text-sm cursor-pointer">&times; Tutup</button>
            </div>
            <div className="rounded-xl overflow-hidden max-h-[75vh] bg-slate-950 flex items-center justify-center">
              <img src={selectedProofImg} alt="Bukti Transfer" className="max-w-full max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
