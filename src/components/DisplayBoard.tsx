import React from 'react';
import { Volume2, ArrowLeft, Clock, Utensils, Wifi, WifiOff } from 'lucide-react';
import { QueueItem, QueueStats } from '../types';

interface DisplayBoardProps {
  currentlyCalledItem: QueueItem | null;
  waitingList: QueueItem[];
  stats: QueueStats;
  isOnline: boolean;
  onExit: () => void;
  isCallingAudio: boolean;
}

export const DisplayBoard: React.FC<DisplayBoardProps> = ({
  currentlyCalledItem,
  waitingList,
  stats,
  isOnline,
  onExit,
  isCallingAudio,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/30">
            🏫
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">
              PAPAN ANTREAN KANTIN SANTRI
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-400">
              Pondok Pesantren • Terpusat Real-Time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              🟢 ONLINE SINKRON
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              🔴 OFFLINE
            </span>
          )}

          <button
            onClick={onExit}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      {/* Main Board Grid */}
      <main className="my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Big Calling Display */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className={`p-8 sm:p-12 rounded-3xl border-2 text-center transition-all duration-300 shadow-2xl relative overflow-hidden ${
            currentlyCalledItem
              ? isCallingAudio
                ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 border-amber-300 scale-[1.01]'
                : 'bg-gradient-to-b from-blue-900/90 to-indigo-950 text-white border-blue-500'
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}>
            <span className="text-sm sm:text-base font-extrabold uppercase tracking-widest block mb-2 opacity-80">
              {currentlyCalledItem ? 'ANTREAN SEKARANG DIPANGGIL' : 'STATUS MEJA KANTIN'}
            </span>

            {currentlyCalledItem ? (
              <>
                <div className="font-mono-num text-7xl sm:text-9xl font-black tracking-tight my-2 text-white drop-shadow-md">
                  {currentlyCalledItem.number}
                </div>
                <div className="text-3xl sm:text-5xl font-extrabold uppercase tracking-wide my-2 truncate">
                  {currentlyCalledItem.name}
                </div>
                <div className="inline-block mt-4 px-6 py-2 rounded-full bg-emerald-500 text-slate-950 font-black text-lg sm:text-xl tracking-wider shadow-lg animate-pulse">
                  SILAKAN MAJU KE KASIR
                </div>
              </>
            ) : (
              <div className="py-12">
                <Utensils className="w-16 h-16 mx-auto mb-3 text-slate-600" />
                <div className="text-2xl font-bold text-slate-300">
                  Menunggu Panggilan Kasir
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  Santri dapat mengambil nomor di HP Santri
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Upcoming List */}
        <div className="lg:col-span-5 bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Berikutnya Menunggu</span>
              </span>
              <span className="text-xs font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                {waitingList.length} Santri
              </span>
            </div>

            {waitingList.length > 0 ? (
              <div className="space-y-2.5">
                {waitingList.slice(0, 6).map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-500 w-5">
                        #{idx + 1}
                      </span>
                      <span className="font-mono-num font-black text-2xl text-emerald-400">
                        {item.number}
                      </span>
                      <span className="font-bold text-lg text-slate-200 capitalize">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                      Menunggu
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-sm">
                Belum ada antrean berikutnya yang menunggu.
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-center">
            <div className="p-2 rounded-xl bg-slate-800/50">
              <div className="text-xs text-slate-400">Total</div>
              <div className="font-mono-num font-bold text-lg text-white">{stats.total}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/50">
              <div className="text-xs text-slate-400">Selesai</div>
              <div className="font-mono-num font-bold text-lg text-emerald-400">{stats.completed}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/50">
              <div className="text-xs text-slate-400">Menunggu</div>
              <div className="font-mono-num font-bold text-lg text-amber-400">{stats.waiting}</div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="text-center pt-2 text-xs text-slate-500">
        Sistem Antrean Kantin Terpusat • Sinkronisasi Otomatis Antar Perangkat
      </footer>
    </div>
  );
};
