import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Lock,
  Hash,
  User,
  Wifi,
  WifiOff,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Utensils,
  Plus,
  Minus,
  Search,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ProductItem, QueueItem } from '../types';
import { api } from '../services/api';

interface SantriModeProps {
  onAddQueue: (payload: {
    number: string;
    name: string;
    classRoom?: string;
    items?: any[];
    totalAmount?: number;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; offlineQueued?: boolean }>;
  nextSuggestedNumber: string;
  onOpenOperatorPin: () => void;
  isOnline: boolean;
  isCloudDb: boolean;
  supabaseConfigured: boolean;
  currentQueues?: QueueItem[];
}

export const SantriMode: React.FC<SantriModeProps> = ({
  onAddQueue,
  nextSuggestedNumber,
  onOpenOperatorPin,
  isOnline,
  isCloudDb,
  supabaseConfigured,
  currentQueues = [],
}) => {
  const [queueNum, setQueueNum] = useState<string>(nextSuggestedNumber);
  const [name, setName] = useState<string>('');
  const [classRoom, setClassRoom] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<{
    number: string;
    name: string;
    classRoom?: string;
    totalAmount?: number;
    isOffline?: boolean;
  } | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Mode View: 'ambil_antrean' | 'lihat_menu' | 'status_antrean'
  const [santriTab, setSantriTab] = useState<'ambil_antrean' | 'lihat_menu' | 'status_antrean'>('ambil_antrean');

  // Menu Items & Cart
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [cart, setCart] = useState<{ product: ProductItem; quantity: number }[]>([]);

  useEffect(() => {
    api
      .getProducts()
      .then((prods) => {
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat produk menu:', err);
      });
  }, []);

  useEffect(() => {
    if (!submittedData) {
      setQueueNum(nextSuggestedNumber);
    }
  }, [nextSuggestedNumber, submittedData]);

  // Countdown timer on success screen
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submittedData) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown((prev) => prev - 1);
        }, 1000);
      } else {
        handleResetForNextSantri();
      }
    }
    return () => clearTimeout(timer);
  }, [submittedData, countdown]);

  const handleResetForNextSantri = () => {
    setSubmittedData(null);
    setName('');
    setClassRoom('');
    setNotes('');
    setCart([]);
    setCountdown(5);
    setErrorMsg('');
  };

  const calculateCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  const handleAddToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.product.id !== productId);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = queueNum.trim();
    const cleanName = name.trim();

    if (!cleanNum) {
      setErrorMsg('Masukkan nomor antrean!');
      return;
    }

    if (!cleanName) {
      setErrorMsg('Masukkan nama santri!');
      return;
    }

    // Format standard e.g. "025" or "25" -> "A025"
    let formattedNum = cleanNum.toUpperCase();
    if (/^\d+$/.test(formattedNum)) {
      formattedNum = 'A' + formattedNum.padStart(3, '0');
    }

    setSubmitting(true);
    setErrorMsg('');

    const cartTotal = calculateCartTotal();
    const orderItems = cart.map((c) => ({
      productId: c.product.id,
      name: c.product.name,
      quantity: c.quantity,
      price: c.product.price,
      subtotal: c.product.price * c.quantity,
    }));

    try {
      const result = await onAddQueue({
        number: formattedNum,
        name: cleanName,
        classRoom: classRoom.trim() || undefined,
        items: orderItems,
        totalAmount: cartTotal,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        setSubmittedData({
          number: formattedNum,
          name: cleanName,
          classRoom: classRoom.trim(),
          totalAmount: cartTotal,
          isOffline: !isOnline,
        });
        setCountdown(5);
      } else {
        setErrorMsg(result.error || 'Gagal menambahkan antrean');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  // SCREEN 1: SUCCESS CONFIRMATION
  if (submittedData) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-emerald-600 to-emerald-800 text-white p-6 max-w-md mx-auto w-full select-none">
        {/* Subtle discreet header */}
        <div className="flex justify-between items-center pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏫</span>
            <span className="font-extrabold tracking-wide uppercase text-xs text-emerald-100">
              ANTREAN KANTIN SANTRI
            </span>
          </div>
          <button
            onClick={onOpenOperatorPin}
            className="p-2 text-emerald-200/60 hover:text-white rounded-full transition"
            title="Mode Operator"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Success Card */}
        <div className="my-auto text-center space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xs rounded-full shadow-inner ring-8 ring-white/10 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase flex items-center justify-center gap-2">
              <span>✅</span>
              <span>ANTREAN BERHASIL</span>
            </h1>
            {submittedData.isOffline && (
              <span className="inline-block mt-1 text-[11px] bg-amber-400 text-slate-950 font-bold px-3 py-0.5 rounded-full shadow">
                Disimpan Offline (Akan Otomatis Sinkron)
              </span>
            )}
          </div>

          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border-4 border-emerald-300 transform transition">
            <div className="font-mono-num text-5xl sm:text-6xl font-black text-emerald-600 tracking-tight my-1">
              {submittedData.number}
            </div>
            <div className="w-16 h-1 bg-emerald-100 mx-auto rounded-full my-2" />
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 capitalize">
              {submittedData.name}
            </div>
            {submittedData.classRoom && (
              <div className="text-xs font-bold text-slate-500 mt-1">
                {submittedData.classRoom}
              </div>
            )}
            {submittedData.totalAmount && submittedData.totalAmount > 0 ? (
              <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-emerald-700">
                Total Pesanan: Rp {submittedData.totalAmount.toLocaleString('id-ID')}
              </div>
            ) : null}
          </div>

          <p className="text-base sm:text-lg text-emerald-100 font-semibold px-4">
            Silakan menunggu sampai nomor dipanggil di loket kasir.
          </p>
        </div>

        {/* Bottom Progress Bar & Instant Next Button */}
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between text-xs text-emerald-200 font-semibold px-1">
            <span>Kembali otomatis untuk santri berikutnya</span>
            <span className="bg-emerald-900/50 px-2 py-0.5 rounded-md font-mono">{countdown}s</span>
          </div>

          <div className="w-full h-2 bg-emerald-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-300 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 5) * 100}%` }}
            />
          </div>

          <button
            onClick={handleResetForNextSantri}
            className="w-full py-4 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-98 font-black text-base sm:text-lg rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Santri Berikutnya</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2: MAIN SANTRI FORM
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 p-4 sm:p-6 max-w-md mx-auto w-full select-none">
      {/* Top Header */}
      <header className="pb-3 border-b border-slate-200/80 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md text-2xl">
              🏫
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900 tracking-tight leading-tight">
                ANTREAN KANTIN
              </h1>
              <p className="text-xs font-bold text-emerald-700">Meja Kasir Santri Mandiri</p>
            </div>
          </div>

          {/* Status Badges & Discreet Lock Button */}
          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                ONLINE
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                <WifiOff className="w-3 h-3 text-amber-700" />
                OFFLINE
              </span>
            )}

            <button
              onClick={onOpenOperatorPin}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition ml-1 cursor-pointer"
              title="Mode Operator (PIN)"
              aria-label="Mode Operator"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Santri Quick Mode Navigation: [ Ambil Antrean ] [ Menu Kantin ] [ Cek Status ] */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setSantriTab('ambil_antrean')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              santriTab === 'ambil_antrean' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Ambil Antrean</span>
          </button>
          <button
            onClick={() => setSantriTab('lihat_menu')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              santriTab === 'lihat_menu' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Menu Kantin</span>
            {cart.length > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSantriTab('status_antrean')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              santriTab === 'status_antrean' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Cek Status</span>
          </button>
        </div>
      </header>

      {/* Supabase Not Configured Friendly Notice (Only if not configured yet) */}
      {!supabaseConfigured && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2 shadow-xs">
          <span className="text-base shrink-0">ℹ️</span>
          <div>
            <div className="font-bold">Mode Penyimpanan Lokal Aktif</div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              Aplikasi dapat digunakan langsung. Untuk sinkronisasi cloud permanen, isi <span className="font-mono font-bold">NEXT_PUBLIC_SUPABASE_URL</span> dan <span className="font-mono font-bold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> di Vercel.
            </div>
          </div>
        </div>
      )}

      {/* Offline Notice (Still functional!) */}
      {!isOnline && (
        <div className="mt-3 bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <WifiOff className="w-5 h-5 shrink-0 text-amber-600" />
          <div>
            <div>Koneksi Internet Sedang Terputus (OFFLINE)</div>
            <div className="text-[11px] font-normal text-amber-800">
              Santri tetap dapat mengambil antrean. Data tersimpan aman di browser dan otomatis tersinkron saat internet kembali.
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: FORM AMBIL ANTREAN (DEFAULT) */}
      {santriTab === 'ambil_antrean' && (
        <main className="my-auto py-3">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border-2 border-rose-400 text-rose-800 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input 1: Nomor Antrean */}
            <div className="bg-white p-4.5 rounded-3xl border-2 border-slate-200/90 shadow-xs space-y-1.5">
              <label
                htmlFor="queueNumInput"
                className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
              >
                <Hash className="w-4 h-4 text-emerald-600" />
                <span>Masukkan Nomor Antrean</span>
              </label>

              <input
                id="queueNumInput"
                type="text"
                value={queueNum}
                onChange={(e) => setQueueNum(e.target.value)}
                placeholder="025"
                className="w-full text-center font-mono-num text-4xl sm:text-5xl font-black text-emerald-700 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl py-2.5 px-4 outline-none transition shadow-inner"
              />
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Sesuai urutan atau kupon meja (Contoh: 025 atau A025)
              </p>
            </div>

            {/* Input 2: Nama Santri */}
            <div className="bg-white p-4.5 rounded-3xl border-2 border-slate-200/90 shadow-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="nameInput"
                  className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Masukkan Nama</span>
                </label>
                {name && (
                  <button
                    type="button"
                    onClick={() => setName('')}
                    className="text-xs text-slate-400 hover:text-rose-500 font-semibold"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <input
                id="nameInput"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Ahmad"
                autoFocus
                className="w-full text-center text-2xl sm:text-3xl font-extrabold text-slate-900 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl py-3 px-4 outline-none transition shadow-inner placeholder:text-slate-300"
              />
            </div>

            {/* Input Tambahan Opsi: Kelas / Kamar */}
            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={classRoom}
                onChange={(e) => setClassRoom(e.target.value)}
                placeholder="Kelas / Kamar (Opsional, cth: 3A)"
                className="w-full text-xs font-bold text-slate-700 bg-transparent outline-none"
              />
            </div>

            {/* Total Pesanan jika ada barang dipilih */}
            {cart.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-emerald-800">
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <span>{cart.length} Menu Terpilih:</span>
                </div>
                <div className="font-mono text-sm font-black">
                  Rp {calculateCartTotal().toLocaleString('id-ID')}
                </div>
              </div>
            )}

            {/* Tombol Besar: 🟢 AMBIL ANTREAN */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-98 text-white font-black text-xl sm:text-2xl rounded-3xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 border-t-2 border-emerald-400 disabled:opacity-50 cursor-pointer"
            >
              <span className="text-2xl">🟢</span>
              <span>{submitting ? 'MENYIMPAN...' : 'AMBIL ANTREAN'}</span>
            </button>
          </form>
        </main>
      )}

      {/* TAB 2: MENU KANTIN (SANTRI MELIHAT MENU & PESAN) */}
      {santriTab === 'lihat_menu' && (
        <main className="my-auto py-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 px-1">
            <span>DAFTAR MENU KANTIN SANTRI</span>
            <span className="text-emerald-700">Pilih untuk dipesan</span>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {products.map((prod) => {
              const inCart = cart.find((c) => c.product.id === prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-slate-800">{prod.name}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{prod.description}</div>
                    <div className="text-xs font-mono font-black text-emerald-700">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {inCart ? (
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(prod.id)}
                          className="w-7 h-7 rounded-lg bg-white text-slate-700 font-bold flex items-center justify-center shadow-xs"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs font-mono">
                          {inCart.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(prod)}
                          className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(prod)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pesan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setSantriTab('ambil_antrean')}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow transition flex items-center justify-center gap-2"
          >
            <span>Lanjut Ambil Nomor Antrean</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </main>
      )}

      {/* TAB 3: STATUS ANTREAN SAAT INI (REALTIME MONITOR) */}
      {santriTab === 'status_antrean' && (
        <main className="my-auto py-2 space-y-3">
          <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wide px-1">
            STATUS ANTREAN AKTIF HARI INI
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {currentQueues.length > 0 ? (
              currentQueues
                .filter((q) => q.status !== 'Selesai' && q.status !== 'Dibatalkan')
                .map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      q.status === 'Dipanggil'
                        ? 'bg-blue-50 border-blue-400 font-bold'
                        : q.status === 'Siap'
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-num font-black text-lg text-slate-900">
                        {q.number}
                      </span>
                      <span className="font-bold text-sm text-slate-800 capitalize">
                        {q.name}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                        q.status === 'Dipanggil'
                          ? 'bg-blue-600 text-white animate-pulse'
                          : q.status === 'Siap'
                          ? 'bg-emerald-600 text-white'
                          : q.status === 'Diproses'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 italic">
                Belum ada antrean aktif.
              </div>
            )}
          </div>

          <button
            onClick={() => setSantriTab('ambil_antrean')}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
          >
            Kembali ke Ambil Antrean
          </button>
        </main>
      )}

      {/* Footer Info Ringkas */}
      <footer className="pt-2 pb-1 text-center border-t border-slate-200/80">
        <p className="text-xs font-medium text-slate-400">
          Isi nomor dan nama, lalu tekan tombol hijau di atas.
        </p>
      </footer>
    </div>
  );
};
