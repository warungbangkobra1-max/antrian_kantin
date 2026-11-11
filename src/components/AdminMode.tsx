import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  Ban,
  RotateCcw,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  Volume2,
  AlertTriangle,
  Smartphone,
  Shield,
  Monitor,
} from 'lucide-react';
import { QueueItem, QueueStats, QueueStatus, AuthUser } from '../types';
import { ReportView } from './ReportView';
import { playChime } from '../utils/audio';

type AdminTab = 'dashboard' | 'antrean' | 'laporan' | 'pengaturan';

interface AdminModeProps {
  user: AuthUser;
  queueList: QueueItem[];
  stats: QueueStats;
  currentlyCalledItem: QueueItem | null;
  onCall: (item: QueueItem) => void;
  onRecall: (item: QueueItem) => void;
  onComplete: (item: QueueItem) => void;
  onSkip: (item: QueueItem) => void;
  onCancel: (item: QueueItem) => void;
  onDelete: (id: string) => void;
  onResetToday: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  onSwitchToSantri: () => void;
  onSwitchToKasir: () => void;
  onSwitchToDisplay: () => void;
  isOnline: boolean;
}

export const AdminMode: React.FC<AdminModeProps> = ({
  user,
  queueList,
  stats,
  currentlyCalledItem,
  onCall,
  onRecall,
  onComplete,
  onSkip,
  onCancel,
  onDelete,
  onResetToday,
  onRefresh,
  onLogout,
  onSwitchToSantri,
  onSwitchToKasir,
  onSwitchToDisplay,
  isOnline,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [filter, setFilter] = useState<'semua' | QueueStatus>('semua');
  const [search, setSearch] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [cancelTargetItem, setCancelTargetItem] = useState<QueueItem | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Filter and search for the Antrean tab
  const filteredList = queueList.filter((item) => {
    const matchFilter = filter === 'semua' || item.status === filter;
    const matchSearch =
      item.number.toLowerCase().includes(search.toLowerCase()) ||
      item.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getStatusBadge = (status: QueueStatus) => {
    switch (status) {
      case 'Menunggu':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span>🟡</span>
            <span>Menunggu</span>
          </span>
        );
      case 'Dipanggil':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
            <span>🔵</span>
            <span>Dipanggil</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span>🟢</span>
            <span>Selesai</span>
          </span>
        );
      case 'Dilewati':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span>🔴</span>
            <span>Dilewati</span>
          </span>
        );
      case 'Dibatalkan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-100 border border-slate-700">
            <span>⚫</span>
            <span>Dibatalkan</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between max-w-5xl mx-auto w-full select-none pb-8">
      {/* HEADER HP ADMIN */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow">
              ADM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-white">HP ADMIN</h1>
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
              <p className="text-[11px] text-slate-400">Dashboard Pengawas Kantin Santri</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              title="Sinkronkan Ulang"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onSwitchToSantri}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Layar Santri</span>
            </button>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 MENU ADMIN UTAMA SESUAI PERMINTAAN USER: */}
        {/* 🏠 Dashboard | 👥 Antrean | 📊 Laporan | ⚙️ Pengaturan */}
        <div className="px-4 pb-2 pt-1 flex items-center gap-1 overflow-x-auto border-t border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>🏠 Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('antrean')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'antrean'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Antrean ({queueList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'laporan'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pengaturan'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ Pengaturan</span>
          </button>

          <div className="ml-auto flex items-center gap-2 pl-3">
            <button
              onClick={onSwitchToKasir}
              className="text-[11px] text-blue-400 hover:text-blue-300 font-bold px-2 py-1 rounded bg-slate-800 border border-slate-700 whitespace-nowrap"
            >
              Mode Kasir
            </button>
            <button
              onClick={onSwitchToDisplay}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded bg-slate-800 border border-slate-700 whitespace-nowrap"
            >
              Layar TV
            </button>
          </div>
        </div>
      </header>

      {/* MAIN TAB CONTENT */}
      <div className="p-4 space-y-4 flex-1">
        {/* ========================================================= */}
        {/* TAB 1: 🏠 DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* STATS OVERVIEW CARDS */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Sedang Dipanggil */}
              <div className="bg-white p-4 rounded-3xl border border-blue-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
                  <span>Sedang Dipanggil</span>
                  <Volume2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="mt-1 font-mono-num font-black text-2xl text-blue-600">
                  {currentlyCalledItem ? currentlyCalledItem.number : '-'}
                </div>
                <div className="text-xs text-slate-700 font-bold truncate">
                  {currentlyCalledItem ? currentlyCalledItem.name : 'Tidak ada'}
                </div>
              </div>

              {/* Menunggu */}
              <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
                  <span>Menunggu</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-1 font-mono-num font-black text-2xl text-amber-600">
                  {stats.waiting}
                </div>
                <div className="text-xs text-slate-400 font-medium">Santri dalam antrean</div>
              </div>

              {/* Selesai */}
              <div className="bg-white p-4 rounded-3xl border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
                  <span>Selesai</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-1 font-mono-num font-black text-2xl text-emerald-600">
                  {stats.completed}
                </div>
                <div className="text-xs text-slate-400 font-medium">Santri terlayani</div>
              </div>

              {/* Dilewati / Dibatalkan */}
              <div className="bg-white p-4 rounded-3xl border border-rose-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
                  <span>Dilewati / Batal</span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-1 font-mono-num font-black text-2xl text-rose-600">
                  {stats.skipped + stats.cancelled}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {stats.skipped} dilewati, {stats.cancelled} dibatalkan
                </div>
              </div>
            </section>

            {/* ACTIVE CALL CARD */}
            {currentlyCalledItem && (
              <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 rounded-3xl shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-300 animate-ping" />
                    Sedang Dipanggil di Meja Kasir
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20">
                    Panggilan ke-{currentlyCalledItem.callCount}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mt-1">
                  <div>
                    <span className="font-mono-num text-4xl sm:text-5xl font-black">
                      {currentlyCalledItem.number}
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold ml-3">
                      {currentlyCalledItem.name}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRecall(currentlyCalledItem)}
                      className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition"
                    >
                      Panggil Ulang
                    </button>
                    <button
                      onClick={() => onComplete(currentlyCalledItem)}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow transition"
                    >
                      Selesaikan
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* UPCOMING MENUNGGU FEED */}
            <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>ANTREAN MENUNGGU SAAT INI ({stats.waiting})</span>
                </span>
                <button
                  onClick={() => setActiveTab('antrean')}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700"
                >
                  Kelola Semua Antrean ➔
                </button>
              </div>

              {queueList.filter((q) => q.status === 'Menunggu').length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {queueList
                    .filter((q) => q.status === 'Menunggu')
                    .slice(0, 6)
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>
                          <span className="font-mono-num font-black text-slate-900 text-base">
                            {item.number}
                          </span>
                          <span className="font-bold text-slate-700 text-sm capitalize">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          {item.jamMasuk || 'Menunggu'}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Tidak ada santri yang sedang menunggu antrean.
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 👥 ANTREAN (KELOLA SEMUA ANTREAN) */}
        {/* ========================================================= */}
        {activeTab === 'antrean' && (
          <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>MANAJEMEN SEMUA ANTREAN ({queueList.length})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Tersinkronisasi real-time dengan HP Kasir dan Layar Santri
                </p>
              </div>

              {/* Search Input */}
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nomor / nama..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'semua', label: 'Semua', count: stats.total },
                  { id: 'Menunggu', label: 'Menunggu', count: stats.waiting },
                  { id: 'Dipanggil', label: 'Dipanggil', count: stats.called },
                  { id: 'Selesai', label: 'Selesai', count: stats.completed },
                  { id: 'Dilewati', label: 'Dilewati', count: stats.skipped },
                  { id: 'Dibatalkan', label: 'Dibatalkan', count: stats.cancelled },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                    filter === t.id
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label} ({t.count})
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {filteredList.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Santri</th>
                      <th className="py-2.5 px-3">Waktu</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredList.map((item) => {
                      const isCurrent = currentlyCalledItem?.id === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 transition ${
                            isCurrent ? 'bg-blue-50/60 font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono-num font-bold text-slate-900">
                            {item.number}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800 capitalize">
                            {item.name}
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-500 font-mono">
                            {item.jamMasuk || '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {getStatusBadge(item.status)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Panggil / Recall */}
                              {item.status === 'Menunggu' && !currentlyCalledItem && (
                                <button
                                  onClick={() => onCall(item)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition"
                                  title="Panggil"
                                >
                                  Panggil
                                </button>
                              )}

                              {item.status === 'Dilewati' && !currentlyCalledItem && (
                                <button
                                  onClick={() => onCall(item)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition"
                                  title="Panggil Kembali"
                                >
                                  Panggil Lagi
                                </button>
                              )}

                              {/* Batalkan Antrean */}
                              {item.status !== 'Selesai' && item.status !== 'Dibatalkan' && (
                                <button
                                  onClick={() => setCancelTargetItem(item)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                  title="Batalkan Antrean"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}

                              {/* Hapus Antrean Yang Salah */}
                              <button
                                onClick={() => setDeleteTargetId(item.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Hapus Antrean yang Salah"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                  Tidak ada data antrean yang cocok.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 📊 LAPORAN & UNDUH EXCEL */}
        {/* ========================================================= */}
        {activeTab === 'laporan' && (
          <ReportView queueList={queueList} />
        )}

        {/* ========================================================= */}
        {/* TAB 4: ⚙️ PENGATURAN & RESET HARIAN */}
        {/* ========================================================= */}
        {activeTab === 'pengaturan' && (
          <div className="space-y-4">
            {/* Audio Settings */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Suara Bel Panggilan</span>
              </h3>
              <p className="text-xs text-slate-500">
                Uji coba bel denting kasir (*crystal chime*) dan suara synthesizer Bahasa Indonesia.
              </p>
              <button
                onClick={() => playChime()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Tes Bel Denting Kantin</span>
              </button>
            </div>

            {/* Reset Antrean Harian */}
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-extrabold">Reset Antrean Harian Kantin</h3>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Menghapus seluruh antrean yang sedang aktif hari ini untuk memulai giliran santri hari berikutnya.
                Pastikan Anda sudah mengunduh laporan Excel sebelum melakukan reset jika data ingin diarsipkan.
              </p>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                RESET ANTREAN HARI INI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL KONFIRMASI HAPUS ANTREAN YANG SALAH */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800 mb-1">
              Hapus Antrean?
            </h3>
            <p className="text-xs text-slate-500 mb-5 font-medium">
              Yakin menghapus antrean yang salah ini dari database pusat? Data tidak dapat dikembalikan.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                BATAL
              </button>
              <button
                onClick={() => {
                  onDelete(deleteTargetId);
                  setDeleteTargetId(null);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
              >
                HAPUS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI BATALKAN ANTREAN */}
      {cancelTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800 mb-1">
              Batalkan Antrean?
            </h3>
            <p className="text-xs text-slate-500 mb-5 font-medium">
              Tandai antrean <span className="font-bold">{cancelTargetItem.number} ({cancelTargetItem.name})</span> sebagai DIBATALKAN?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setCancelTargetItem(null)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                BATAL
              </button>
              <button
                onClick={() => {
                  onCancel(cancelTargetItem);
                  setCancelTargetItem(null);
                }}
                className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow"
              >
                YA, BATALKAN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET HARIAN */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800 mb-2">
              Konfirmasi Reset Harian
            </h3>
            <p className="text-xs text-slate-500 mb-5 font-medium">
              Yakin menghapus semua antrean hari ini dari database terpusat?
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                BATAL
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  onResetToday();
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow"
              >
                RESET
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
