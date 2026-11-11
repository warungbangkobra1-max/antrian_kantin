import React, { useState } from 'react';
import {
  Volume2,
  RotateCcw,
  CheckCircle,
  SkipForward,
  Clock,
  LogOut,
  UserPlus,
  WifiOff,
  User,
  Hash,
  ArrowLeft,
  Smartphone,
  Shield,
  Monitor,
} from 'lucide-react';
import { QueueItem, AuthUser } from '../types';
import { playChime } from '../utils/audio';

interface KasirModeProps {
  user: AuthUser;
  queueList: QueueItem[];
  currentlyCalledItem: QueueItem | null;
  onCall: (item: QueueItem) => void;
  onRecall: (item: QueueItem) => void;
  onComplete: (item: QueueItem) => void;
  onSkip: (item: QueueItem) => void;
  onAddManualQueue: (number: string, name: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => void;
  onSwitchToSantri: () => void;
  onSwitchToAdmin: () => void;
  onSwitchToDisplay: () => void;
  isOnline: boolean;
  isCallingAudio: boolean;
}

export const KasirMode: React.FC<KasirModeProps> = ({
  user,
  queueList,
  currentlyCalledItem,
  onCall,
  onRecall,
  onComplete,
  onSkip,
  onAddManualQueue,
  onLogout,
  onSwitchToSantri,
  onSwitchToAdmin,
  onSwitchToDisplay,
  isOnline,
  isCallingAudio,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualNum, setManualNum] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Waiting queues
  const waitingList = queueList.filter((item) => item.status === 'Menunggu');
  const nextCandidate = waitingList[0] || null;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNum.trim() || !manualName.trim()) {
      setManualError('Isi nomor dan nama santri!');
      return;
    }

    setManualLoading(true);
    setManualError('');

    try {
      let formatted = manualNum.trim().toUpperCase();
      if (/^\d+$/.test(formatted)) {
        formatted = 'A' + formatted.padStart(3, '0');
      }

      const res = await onAddManualQueue(formatted, manualName.trim());
      if (res.success) {
        setShowAddModal(false);
        setManualNum('');
        setManualName('');
      } else {
        setManualError(res.error || 'Gagal menambahkan antrean');
      }
    } catch (err: unknown) {
      setManualError((err as Error).message || 'Terjadi kesalahan');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between max-w-xl mx-auto w-full select-none pb-8">
      {/* HEADER HP KASIR / OPERATOR */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow">
              KSR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-white">MODE OPERATOR</h1>
                {isOnline ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    🟢 ONLINE
                  </span>
                ) : (
                  <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    🔴 OFFLINE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Kasir: {user.name}</p>
            </div>
          </div>

          {/* Tombol Utama: Kembali ke Meja Santri */}
          <button
            onClick={onSwitchToSantri}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition"
            title="Kunci dan kembalikan HP ke meja santri"
          >
            <Smartphone className="w-4 h-4" />
            <span>Layar Santri</span>
          </button>
        </div>

        {/* Secondary Sub-Bar for Quick View Navigation */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Beralih tampilan:</span>
            <button
              onClick={onSwitchToAdmin}
              className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-800/50"
            >
              <Shield className="w-3 h-3" />
              <span>HP Admin</span>
            </button>
            <button
              onClick={onSwitchToDisplay}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-800/50"
            >
              <Monitor className="w-3 h-3" />
              <span>Layar TV</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-rose-400 flex items-center gap-1 font-semibold"
          >
            <LogOut className="w-3 h-3" />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Audio Announcement Pulse */}
      {isCallingAudio && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow animate-pulse">
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>Suara panggilan sedang disuarakan di speaker HP...</span>
        </div>
      )}

      {/* Offline Notice */}
      {!isOnline && (
        <div className="bg-rose-600 text-white px-4 py-1.5 text-center text-xs font-bold flex items-center justify-center gap-1.5">
          <WifiOff className="w-4 h-4" />
          <span>Terputus dari database pusat. Perubahan akan disinkronkan saat online.</span>
        </div>
      )}

      <div className="p-4 space-y-4 flex-1">
        {/* SECTION 1: SEDANG DILAYANI (Persis sesuai permintaan user) */}
        <section className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
              SEDANG DILAYANI
            </span>

            {currentlyCalledItem && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                Dipanggil ({currentlyCalledItem.callCount}x)
              </span>
            )}
          </div>

          {currentlyCalledItem ? (
            /* AGAR TIDAK RICUH: TAMPILAN BESAR */
            <div className="space-y-4 text-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl p-4 border border-blue-200 shadow-inner">
                <div className="font-mono-num text-5xl sm:text-6xl font-black text-blue-700 tracking-tight">
                  {currentlyCalledItem.number}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-wide mt-1">
                  {currentlyCalledItem.name}
                </div>
                <div className="inline-block mt-2 px-4 py-1 rounded-full bg-blue-600 text-white font-extrabold text-xs sm:text-sm tracking-widest shadow-xs">
                  SILAKAN MAJU
                </div>
              </div>

              {/* OPERATOR CONTROL BUTTONS SESUAI FORMAT USER */}
              {/* [ 🔊 PANGGIL ] [ 🔁 PANGGIL ULANG ] [ ✅ SELESAI ] [ ⏭️ LEWATI ] */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {/* 🔁 PANGGIL ULANG */}
                <button
                  onClick={() => onRecall(currentlyCalledItem)}
                  className="py-3.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>🔁 PANGGIL ULANG</span>
                </button>

                {/* ✅ SELESAI */}
                <button
                  onClick={() => onComplete(currentlyCalledItem)}
                  className="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>✅ SELESAI</span>
                </button>

                {/* ⏭️ LEWATI */}
                <button
                  onClick={() => onSkip(currentlyCalledItem)}
                  className="py-3 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl border border-slate-300 active:scale-95 transition flex items-center justify-center gap-1.5 col-span-2"
                >
                  <SkipForward className="w-4 h-4" />
                  <span>⏭️ LEWATI (Santri Belum Hadir)</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-2 font-medium">
                🔒 Selesaikan atau lewati antrean {currentlyCalledItem.number} sebelum memanggil santri berikutnya.
              </div>
            </div>
          ) : nextCandidate ? (
            /* SIAP MEMANGGIL ANTREAN MENUNGGU PERTAMA */
            <div className="space-y-4 text-center">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Urutan Berikutnya
                </span>
                <div className="font-mono-num text-4xl sm:text-5xl font-black text-slate-700 tracking-tight">
                  {nextCandidate.number}
                </div>
                <div className="text-xl sm:text-2xl font-extrabold text-slate-800 mt-1 capitalize">
                  {nextCandidate.name}
                </div>
              </div>

              {/* 🔊 PANGGIL BUTTON */}
              <button
                onClick={() => onCall(nextCandidate)}
                className="w-full py-4.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 border-t border-blue-400 cursor-pointer"
              >
                <Volume2 className="w-6 h-6 animate-pulse" />
                <span>🔊 PANGGIL ({nextCandidate.number} – {nextCandidate.name})</span>
              </button>
            </div>
          ) : (
            /* TIDAK ADA ANTREAN MENUNGGU */
            <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2 text-xl">
                ☕
              </div>
              <h3 className="font-bold text-slate-700 text-base">Tidak Ada Antrean Menunggu</h3>
              <p className="text-xs text-slate-500 mt-1">
                Santri yang mengisi di Layar Santri akan otomatis muncul di sini secara real-time.
              </p>
              <button
                onClick={onSwitchToSantri}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition inline-flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Beralih ke Layar Santri</span>
              </button>
            </div>
          )}
        </section>

        {/* SECTION 2: ANTREAN MENUNGGU */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>ANTREAN MENUNGGU ({waitingList.length})</span>
            </span>

            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl flex items-center gap-1 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Input Santri</span>
            </button>
          </div>

          {waitingList.length > 0 ? (
            <div className="space-y-2">
              {waitingList.map((item, idx) => {
                const isFirst = idx === 0 && !currentlyCalledItem;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                      isFirst
                        ? 'bg-blue-50/80 border-blue-300 font-bold'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">
                        #{idx + 1}
                      </span>
                      <span className="font-mono-num font-black text-slate-900 text-lg">
                        {item.number}
                      </span>
                      <span className="font-bold text-slate-700 text-sm capitalize">
                        {item.name}
                      </span>
                    </div>

                    {!currentlyCalledItem && idx === 0 ? (
                      <button
                        onClick={() => onCall(item)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        Panggil
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                        Menunggu
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-4 italic">
              Semua santri telah dilayani.
            </div>
          )}
        </section>

        {/* Test Chime Sound */}
        <div className="text-center pt-1">
          <button
            onClick={() => playChime()}
            className="text-xs text-slate-500 hover:text-slate-700 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Tes Bel Speaker Kasir</span>
          </button>
        </div>
      </div>

      {/* MODAL INPUT MANUAL OLEH KASIR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-slate-100">
            <h3 className="font-extrabold text-base text-slate-800 mb-1">
              Input Antrean Kasir
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Untuk santri yang dibantu input oleh kasir.
            </p>

            {manualError && (
              <div className="mb-3 p-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {manualError}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Nomor Antrean
                </label>
                <input
                  type="text"
                  value={manualNum}
                  onChange={(e) => setManualNum(e.target.value)}
                  placeholder="Contoh: 029 atau A029"
                  className="w-full text-center font-mono-num font-bold text-xl py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Nama Santri
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nama santri"
                  className="w-full text-center font-bold text-base py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={manualLoading}
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  {manualLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
