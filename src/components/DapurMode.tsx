import React from 'react';
import {
  Utensils,
  ChefHat,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  Smartphone,
  Shield,
  Monitor,
  LogOut,
  WifiOff,
  ShoppingBag,
} from 'lucide-react';
import { QueueItem, AuthUser } from '../types';

interface DapurModeProps {
  user: AuthUser;
  queueList: QueueItem[];
  onProcess: (item: QueueItem) => void;
  onReady: (item: QueueItem) => void;
  onComplete: (item: QueueItem) => void;
  onLogout: () => void;
  onSwitchToSantri: () => void;
  onSwitchToKasir: () => void;
  onSwitchToAdmin: () => void;
  onSwitchToDisplay: () => void;
  isOnline: boolean;
}

export const DapurMode: React.FC<DapurModeProps> = ({
  user,
  queueList,
  onProcess,
  onReady,
  onComplete,
  onLogout,
  onSwitchToSantri,
  onSwitchToKasir,
  onSwitchToAdmin,
  onSwitchToDisplay,
  isOnline,
}) => {
  // Filter pesanan yang aktif untuk bagian dapur
  const pendingOrders = queueList.filter(
    (item) => item.status === 'Menunggu' || item.status === 'Diproses' || item.status === 'Siap'
  );

  const processingOrders = queueList.filter((item) => item.status === 'Diproses');
  const readyOrders = queueList.filter((item) => item.status === 'Siap');
  const waitingOrders = queueList.filter((item) => item.status === 'Menunggu');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between max-w-4xl mx-auto w-full select-none pb-8">
      {/* HEADER DAPUR KANTIN */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white shadow-lg px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg text-amber-400 tracking-wide">
                  DAPUR KANTIN SANTRI
                </h1>
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
              <p className="text-xs text-slate-400">Petugas Dapur: {user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToSantri}
              className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>Layar Santri</span>
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-lg transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Beralih tampilan:</span>
            <button
              onClick={onSwitchToKasir}
              className="text-blue-400 hover:text-blue-300 font-bold bg-slate-800 px-2 py-0.5 rounded-md"
            >
              Mode Kasir
            </button>
            <button
              onClick={onSwitchToAdmin}
              className="text-purple-400 hover:text-purple-300 font-bold bg-slate-800 px-2 py-0.5 rounded-md"
            >
              Mode Admin
            </button>
            <button
              onClick={onSwitchToDisplay}
              className="text-indigo-400 hover:text-indigo-300 font-bold bg-slate-800 px-2 py-0.5 rounded-md"
            >
              Layar TV
            </button>
          </div>

          <div className="text-amber-400 font-bold">
            Total Antrean Dapur: {pendingOrders.length}
          </div>
        </div>
      </header>

      {/* Main Content Dapur */}
      <div className="p-4 space-y-6 flex-1">
        {/* KANBAN / 3 STATUS COLUMN FOR DAPUR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KOLOM 1: PESANAN MASUK / MENUNGGU */}
          <section className="bg-slate-800/90 rounded-3xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>1. Menunggu Diproses ({waitingOrders.length})</span>
              </span>
            </div>

            {waitingOrders.length > 0 ? (
              <div className="space-y-3">
                {waitingOrders.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 p-4 rounded-2xl border border-slate-700 shadow space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num font-black text-2xl text-amber-400">
                        {item.number}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{item.jamMasuk}</span>
                    </div>

                    <div className="font-bold text-base text-white capitalize">{item.name}</div>
                    {item.classRoom && (
                      <div className="text-xs text-slate-400">{item.classRoom}</div>
                    )}

                    {/* Catatan / Items */}
                    {item.notes && (
                      <div className="text-xs bg-slate-800 text-amber-200 p-2 rounded-xl border border-amber-900/40">
                        📝 Catatan: {item.notes}
                      </div>
                    )}

                    {/* Tombol Mulai Masak / Proses */}
                    <button
                      onClick={() => onProcess(item)}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Mulai Siapkan (Diproses)</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                Tidak ada pesanan menunggu
              </div>
            )}
          </section>

          {/* KOLOM 2: SEDANG DIMASAK / DIPROSES */}
          <section className="bg-slate-800/90 rounded-3xl p-4 border border-blue-900/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 animate-spin" />
                <span>2. Sedang Dimasak ({processingOrders.length})</span>
              </span>
            </div>

            {processingOrders.length > 0 ? (
              <div className="space-y-3">
                {processingOrders.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 p-4 rounded-2xl border-2 border-blue-500/60 shadow space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num font-black text-3xl text-blue-400">
                        {item.number}
                      </span>
                      <span className="text-xs font-bold bg-blue-900/60 text-blue-300 px-2.5 py-0.5 rounded-full animate-pulse">
                        Sedang Dimasak
                      </span>
                    </div>

                    <div className="font-bold text-lg text-white capitalize">{item.name}</div>
                    {item.classRoom && (
                      <div className="text-xs text-slate-400">{item.classRoom}</div>
                    )}

                    {item.notes && (
                      <div className="text-xs bg-slate-800 text-blue-200 p-2 rounded-xl">
                        📝 Catatan: {item.notes}
                      </div>
                    )}

                    {/* Tombol Makanan Siap */}
                    <button
                      onClick={() => onReady(item)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Makanan Siap (Siap Diambil)</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                Tidak ada pesanan sedang dimasak
              </div>
            )}
          </section>

          {/* KOLOM 3: SIAP DIAMBIL / DIPANGGIL KASIR */}
          <section className="bg-slate-800/90 rounded-3xl p-4 border border-emerald-900/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>3. Siap Diambil ({readyOrders.length})</span>
              </span>
            </div>

            {readyOrders.length > 0 ? (
              <div className="space-y-3">
                {readyOrders.map((item) => (
                  <div
                    key={item.id}
                    className="bg-emerald-950/40 p-4 rounded-2xl border-2 border-emerald-500/50 shadow space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num font-black text-3xl text-emerald-400">
                        {item.number}
                      </span>
                      <span className="text-xs font-bold bg-emerald-900 text-emerald-200 px-2.5 py-0.5 rounded-full">
                        Siap Diambil
                      </span>
                    </div>

                    <div className="font-bold text-lg text-white capitalize">{item.name}</div>
                    <div className="text-xs text-emerald-200/80">
                      Santri dapat mengambil makanan di loket.
                    </div>

                    <button
                      onClick={() => onComplete(item)}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Selesaikan Pesanan</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                Tidak ada pesanan di rak pengambilan
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
