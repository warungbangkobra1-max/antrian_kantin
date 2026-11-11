import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  User,
  Users,
  Timer,
  ChevronDown,
} from 'lucide-react';
import { QueueItem, QueueStatus, ReportPeriod, ReportSummary } from '../types';
import { exportQueueReportToExcel } from '../utils/excelExport';

interface ReportViewProps {
  queueList: QueueItem[];
}

export const ReportView: React.FC<ReportViewProps> = ({ queueList }) => {
  const [period, setPeriod] = useState<ReportPeriod>('hari_ini');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Filters for the table
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'semua' | QueueStatus>('semua');
  const [operatorFilter, setOperatorFilter] = useState<string>('semua');

  // Compute date boundaries
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];

  const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Filter items by Period
  const periodFilteredItems = useMemo(() => {
    return queueList.filter((item) => {
      const itemDate = item.date || new Date(item.createdAt).toISOString().split('T')[0];

      if (period === 'hari_ini') {
        return itemDate === todayStr;
      }
      if (period === 'kemarin') {
        return itemDate === yesterdayStr;
      }
      if (period === 'minggu_ini') {
        return itemDate >= oneWeekAgoStr && itemDate <= todayStr;
      }
      if (period === 'bulan_ini') {
        return itemDate >= startOfMonthStr && itemDate <= todayStr;
      }
      if (period === 'custom') {
        if (customStartDate && customEndDate) {
          return itemDate >= customStartDate && itemDate <= customEndDate;
        }
        if (customStartDate) {
          return itemDate >= customStartDate;
        }
        if (customEndDate) {
          return itemDate <= customEndDate;
        }
        return true;
      }
      return true;
    });
  }, [queueList, period, todayStr, yesterdayStr, oneWeekAgoStr, startOfMonthStr, customStartDate, customEndDate]);

  // Compute Summary Metrics
  const summary: ReportSummary = useMemo(() => {
    const total = periodFilteredItems.length;
    const completed = periodFilteredItems.filter((i) => i.status === 'Selesai').length;
    const skipped = periodFilteredItems.filter((i) => i.status === 'Dilewati').length;
    const cancelled = periodFilteredItems.filter((i) => i.status === 'Dibatalkan').length;

    // Average waiting time
    const waitTimes = periodFilteredItems
      .filter((i) => typeof i.waitingDurationMinutes === 'number' && i.waitingDurationMinutes > 0)
      .map((i) => i.waitingDurationMinutes as number);
    const avgWaitMinutes =
      waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

    // Average service time
    const serviceTimes = periodFilteredItems
      .filter((i) => typeof i.serviceDurationMinutes === 'number' && i.serviceDurationMinutes > 0)
      .map((i) => i.serviceDurationMinutes as number);
    const avgServiceMinutes =
      serviceTimes.length > 0
        ? Math.round(serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length)
        : 0;

    // Hourly Distribution (06:00 - 18:00)
    const hourCounts: Record<string, number> = {};
    for (let h = 6; h <= 18; h++) {
      const hStr = `${String(h).padStart(2, '0')}:00`;
      hourCounts[hStr] = 0;
    }

    periodFilteredItems.forEach((i) => {
      const jam = i.jamMasuk || '';
      if (jam.includes(':')) {
        const hour = jam.split(':')[0] + ':00';
        if (hourCounts[hour] !== undefined) {
          hourCounts[hour]++;
        } else {
          hourCounts[hour] = 1;
        }
      }
    });

    const hourlyStats = Object.keys(hourCounts)
      .sort()
      .map((hour) => ({ hour, count: hourCounts[hour] }));

    // Daily distribution
    const dailyMap: Record<string, { total: number; completed: number; skipped: number; cancelled: number }> = {};
    periodFilteredItems.forEach((i) => {
      const d = i.date || todayStr;
      if (!dailyMap[d]) {
        dailyMap[d] = { total: 0, completed: 0, skipped: 0, cancelled: 0 };
      }
      dailyMap[d].total++;
      if (i.status === 'Selesai') dailyMap[d].completed++;
      if (i.status === 'Dilewati') dailyMap[d].skipped++;
      if (i.status === 'Dibatalkan') dailyMap[d].cancelled++;
    });

    const dailyStats = Object.keys(dailyMap)
      .sort()
      .map((date) => ({
        date,
        ...dailyMap[date],
      }));

    return {
      total,
      completed,
      skipped,
      cancelled,
      avgWaitMinutes,
      avgServiceMinutes,
      hourlyStats,
      dailyStats,
    };
  }, [periodFilteredItems, todayStr]);

  // Unique operators for dropdown filter
  const operators = useMemo(() => {
    const set = new Set<string>();
    periodFilteredItems.forEach((i) => {
      if (i.operator) set.add(i.operator);
    });
    return Array.from(set);
  }, [periodFilteredItems]);

  // Final table filter
  const tableData = useMemo(() => {
    return periodFilteredItems.filter((item) => {
      const matchSearch =
        item.number.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'semua' || item.status === statusFilter;
      const matchOperator = operatorFilter === 'semua' || item.operator === operatorFilter;
      return matchSearch && matchStatus && matchOperator;
    });
  }, [periodFilteredItems, search, statusFilter, operatorFilter]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'hari_ini':
        return 'Hari Ini';
      case 'kemarin':
        return 'Kemarin';
      case 'minggu_ini':
        return 'Minggu Ini';
      case 'bulan_ini':
        return 'Bulan Ini';
      case 'custom':
        return `${customStartDate || 'Awal'} s/d ${customEndDate || 'Sekarang'}`;
    }
  };

  const handleDownloadExcel = () => {
    exportQueueReportToExcel(tableData, summary, getPeriodLabel());
  };

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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300 line-through">
            <span>⚫</span>
            <span>Dibatalkan</span>
          </span>
        );
    }
  };

  // Find maximum count for hourly bar scaling
  const maxHourlyCount = Math.max(1, ...summary.hourlyStats.map((h) => h.count));

  return (
    <div className="space-y-6">
      {/* Top Header & Period Selector */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>📊 LAPORAN & ANALISIS ANTREAN</span>
            </h2>
            <p className="text-xs text-slate-500">
              Pilih rentang periode tanggal untuk menganalisis data antrean kantin santri
            </p>
          </div>

          {/* GIANT EXCEL DOWNLOAD BUTTON */}
          <button
            onClick={handleDownloadExcel}
            className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2.5 border-t border-emerald-400 cursor-pointer"
          >
            <Download className="w-5 h-5 animate-bounce" />
            <span>📥 UNDUH EXCEL (.XLSX)</span>
          </button>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1">
            Periode:
          </span>
          {(
            [
              { id: 'hari_ini', label: 'Hari ini' },
              { id: 'kemarin', label: 'Kemarin' },
              { id: 'minggu_ini', label: 'Minggu ini' },
              { id: 'bulan_ini', label: 'Bulan ini' },
              { id: 'custom', label: 'Pilih tanggal sendiri' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                period === p.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers (Shown if 'custom' is selected) */}
        {period === 'custom' && (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
            <span className="font-bold text-slate-600">Rentang Tanggal:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-semibold">Dari:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-semibold">Sampai:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Antrean */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-extrabold uppercase">
            <span>Total Antrean</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-mono-num text-3xl sm:text-4xl font-black text-slate-900 my-1">
            {summary.total}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Santri terdaftar di sistem</div>
        </div>

        {/* Selesai Dilayani */}
        <div className="bg-white p-4 rounded-3xl border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-extrabold uppercase">
            <span>Selesai Dilayani</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono-num text-3xl sm:text-4xl font-black text-emerald-600 my-1">
            {summary.completed}
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">
            {summary.total > 0 ? `${Math.round((summary.completed / summary.total) * 100)}% terselesaikan` : '0%'}
          </div>
        </div>

        {/* Dilewati */}
        <div className="bg-white p-4 rounded-3xl border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-extrabold uppercase">
            <span>Dilewati</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="font-mono-num text-3xl sm:text-4xl font-black text-rose-600 my-1">
            {summary.skipped}
          </div>
          <div className="text-[11px] text-rose-700 font-medium">Santri belum hadir saat dipanggil</div>
        </div>

        {/* Dibatalkan */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase">
            <span>Dibatalkan</span>
            <XCircle className="w-4 h-4 text-slate-600" />
          </div>
          <div className="font-mono-num text-3xl sm:text-4xl font-black text-slate-700 my-1">
            {summary.cancelled}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Dibatalkan oleh admin/petugas</div>
        </div>
      </div>

      {/* SERVICE EFFICIENCY & TIMING METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rata-Rata Waktu Tunggu */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Rata-Rata Waktu Tunggu Santri
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-num text-3xl sm:text-4xl font-black text-blue-600">
                {summary.avgWaitMinutes}
              </span>
              <span className="text-sm font-bold text-slate-600">menit</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dihitung dari waktu santri ambil antrean sampai nomor dipanggil kasir
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
        </div>

        {/* Rata-Rata Waktu Pelayanan */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              Rata-Rata Waktu Pelayanan Kasir
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-num text-3xl sm:text-4xl font-black text-teal-600">
                {summary.avgServiceMinutes}
              </span>
              <span className="text-sm font-bold text-slate-600">menit</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Dihitung saat santri maju ke kasir hingga pesanan selesai
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Timer className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* HOURLY BREAKDOWN CHART (JUMLAH ANTREAN PER JAM) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Jumlah Antrean Per Jam (Jam Sibuk Kantin)</span>
          </span>
          <span className="text-xs font-semibold text-slate-400">06:00 - 18:00</span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-13 gap-1.5 items-end pt-4 h-32 sm:h-36 px-2">
          {summary.hourlyStats.map((item) => {
            const heightPercent = item.count > 0 ? Math.max(15, (item.count / maxHourlyCount) * 100) : 6;
            return (
              <div key={item.hour} className="flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                  {item.count}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    item.count > 0 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-100'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 font-semibold truncate w-full text-center">
                  {item.hour.split(':')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* TABEL LAPORAN LENGKAP DENGAN FILTER (PERSIS SESUAI SPESIFIKASI USER) */}
      {/* Kolom: No | Tanggal | Jam | Nomor | Nama Santri | Status | Waktu Tunggu | Operator */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              TABEL RINCIAN ANTREAN ({tableData.length} Data)
            </h3>
            <p className="text-xs text-slate-400">
              Data lengkap hasil pencatatan real-time kantin santri
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor / nama..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'semua' | QueueStatus)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
            >
              <option value="semua">Semua Status</option>
              <option value="Menunggu">🟡 Menunggu</option>
              <option value="Dipanggil">🔵 Dipanggil</option>
              <option value="Selesai">🟢 Selesai</option>
              <option value="Dilewati">🔴 Dilewati</option>
              <option value="Dibatalkan">⚫ Dibatalkan</option>
            </select>

            {/* Operator Filter */}
            {operators.length > 0 && (
              <select
                value={operatorFilter}
                onChange={(e) => setOperatorFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="semua">Semua Operator</option>
                {operators.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {tableData.length > 0 ? (
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Jam</th>
                  <th className="py-2.5 px-3">Nomor</th>
                  <th className="py-2.5 px-3">Nama Santri</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Waktu Tunggu</th>
                  <th className="py-2.5 px-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tableData.map((item, index) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-slate-400 font-mono text-xs">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {item.date || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 font-bold">
                        {item.jamMasuk || '-'}
                      </td>
                      <td className="py-3 px-3 font-mono-num font-black text-emerald-700 text-base">
                        {item.number}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 capitalize">
                        {item.name}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-600">
                        {item.waitingDurationMinutes ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-mono text-xs">
                            {item.waitingDurationMinutes} menit
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs font-semibold">
                        {item.operator || 'Kasir 1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Tidak ada data antrean yang cocok dengan filter yang dipilih.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
