import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, Hash, User, WifiOff, AlertTriangle, ArrowRight } from 'lucide-react';
import { QueueItem } from '../types';

interface SantriModeProps {
  onAddQueue: (number: string, name: string) => Promise<{ success: boolean; error?: string }>;
  nextSuggestedNumber: string;
  onOpenOperatorPin: () => void;
  isOnline: boolean;
}

export const SantriMode: React.FC<SantriModeProps> = ({
  onAddQueue,
  nextSuggestedNumber,
  onOpenOperatorPin,
  isOnline,
}) => {
  const [queueNum, setQueueNum] = useState<string>(nextSuggestedNumber);
  const [name, setName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<{ number: string; name: string } | null>(null);
  const [countdown, setCountdown] = useState<number>(4);
  const [errorMsg, setErrorMsg] = useState<string>('');

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
    setCountdown(4);
    setErrorMsg('');
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

    if (!isOnline) {
      setErrorMsg('Koneksi terputus (🔴 OFFLINE). Data belum dapat disimpan ke server.');
      return;
    }

    // Format standard e.g. "025" or "25" -> "A025"
    let formattedNum = cleanNum.toUpperCase();
    if (/^\d+$/.test(formattedNum)) {
      formattedNum = 'A' + formattedNum.padStart(3, '0');
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const result = await onAddQueue(formattedNum, cleanName);
      if (result.success) {
        setSubmittedData({
          number: formattedNum,
          name: cleanName,
        });
        setCountdown(4);
      } else {
        // e.g. "Nomor antrean A025 sudah digunakan."
        setErrorMsg(result.error || 'Gagal menambahkan antrean');
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  // SCREEN 1: SUCCESS CONFIRMATION (Persis sesuai permintaan user)
  // ✅ ANTREAN BERHASIL
  // A025
  // Ahmad
  // Silakan menunggu sampai nomor dipanggil.
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
        <div className="my-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-xs rounded-full shadow-inner ring-8 ring-white/10 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase flex items-center justify-center gap-2">
              <span>✅</span>
              <span>ANTREAN BERHASIL</span>
            </h1>
          </div>

          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-emerald-300 transform transition">
            <div className="font-mono-num text-5xl sm:text-6xl font-black text-emerald-600 tracking-tight my-2">
              {submittedData.number}
            </div>
            <div className="w-16 h-1 bg-emerald-100 mx-auto rounded-full my-3" />
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800 capitalize">
              {submittedData.name}
            </div>
          </div>

          <p className="text-base sm:text-lg text-emerald-100 font-semibold px-4">
            Silakan menunggu sampai nomor dipanggil.
          </p>
        </div>

        {/* Bottom Progress Bar & Instant Next Button */}
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between text-xs text-emerald-200 font-semibold px-1">
            <span>Kembali otomatis untuk santri berikutnya</span>
            <span className="bg-emerald-900/50 px-2 py-0.5 rounded-md font-mono">{countdown}s</span>
          </div>

          <div className="w-full h-2.5 bg-emerald-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-300 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdown / 4) * 100}%` }}
            />
          </div>

          <button
            onClick={handleResetForNextSantri}
            className="w-full py-4 bg-white text-emerald-800 hover:bg-emerald-50 active:scale-98 font-black text-base sm:text-lg rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Santri Berikutnya</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2: MAIN SANTRI FORM (Super Sederhana, Hanya Nomor + Nama + Tombol Besar)
  // 🏫 ANTREAN KANTIN
  // Masukkan Nomor Antrean [________]
  // Masukkan Nama [________]
  // 🟢 [ AMBIL ANTREAN ]
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900 p-5 sm:p-7 max-w-md mx-auto w-full select-none">
      {/* Top Header: Clean & Sederhana */}
      <header className="flex justify-between items-center pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md text-2xl">
            🏫
          </div>
          <div>
            <h1 className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight leading-tight">
              ANTREAN KANTIN
            </h1>
            <p className="text-xs font-bold text-emerald-700">Meja Kasir Santri Mandiri</p>
          </div>
        </div>

        {/* Discreet Operator Lock Button */}
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              🟢 ONLINE
            </span>
          ) : (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
              🔴 OFFLINE
            </span>
          )}

          <button
            onClick={onOpenOperatorPin}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition ml-1"
            title="Mode Operator (PIN)"
            aria-label="Mode Operator"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Offline Alert (Jika Internet Terputus) */}
      {!isOnline && (
        <div className="mt-3 bg-rose-50 border-2 border-rose-300 text-rose-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
          <WifiOff className="w-5 h-5 shrink-0 text-rose-600" />
          <div>
            <div>Koneksi Internet Terputus (🔴 OFFLINE)</div>
            <div className="text-[11px] font-normal text-rose-700">
              Data belum dapat disimpan ke server. Mohon tunggu koneksi kembali.
            </div>
          </div>
        </div>
      )}

      {/* Main Form: Hanya Nomor Antrean, Nama, dan Tombol Ambil Antrean */}
      <main className="my-auto py-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Message: e.g. "Nomor antrean A025 sudah digunakan." */}
          {errorMsg && (
            <div className="bg-rose-50 border-2 border-rose-400 text-rose-800 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm animate-shake">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Input 1: Masukkan Nomor Antrean */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200/90 shadow-sm space-y-2">
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
              className="w-full text-center font-mono-num text-4xl sm:text-5xl font-black text-emerald-700 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl py-3 px-4 outline-none transition shadow-inner"
            />
            <p className="text-[11px] text-slate-400 text-center font-medium">
              Sesuai urutan atau kupon fisik (Contoh: 025 atau A025)
            </p>
          </div>

          {/* Input 2: Masukkan Nama */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200/90 shadow-sm space-y-2">
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
              className="w-full text-center text-2xl sm:text-3xl font-extrabold text-slate-900 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl py-3.5 px-4 outline-none transition shadow-inner placeholder:text-slate-300"
            />
          </div>

          {/* Tombol Besar: 🟢 AMBIL ANTREAN */}
          <button
            type="submit"
            disabled={submitting || !isOnline}
            className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 active:scale-98 text-white font-black text-xl sm:text-2xl rounded-3xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 border-t-2 border-emerald-400 disabled:opacity-50 cursor-pointer"
          >
            <span className="text-2xl">🟢</span>
            <span>{submitting ? 'MENYIMPAN...' : 'AMBIL ANTREAN'}</span>
          </button>
        </form>
      </main>

      {/* Footer Info Ringkas */}
      <footer className="pt-2 pb-1 text-center">
        <p className="text-xs font-medium text-slate-400">
          Isi nomor dan nama, lalu tekan tombol hijau di atas.
        </p>
      </footer>
    </div>
  );
};
