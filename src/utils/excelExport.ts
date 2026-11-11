import * as XLSX from 'xlsx';
import { QueueItem, ReportSummary } from '../types';

export function exportQueueReportToExcel(
  items: QueueItem[],
  summary: ReportSummary,
  selectedPeriodLabel: string
) {
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Antrean_Kantin_${todayStr}.xlsx`;

  // Create new Workbook
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: DATA ANTREAN
  // ==========================================
  // Header Info Rows
  const sheet1Data: (string | number)[][] = [
    ['LAPORAN ANTREAN KANTIN SANTRI'],
    [`Periode: ${selectedPeriodLabel} (Diunduh pada: ${new Date().toLocaleString('id-ID')})`],
    [], // Blank line
    [
      'No',
      'ID Antrean',
      'Tanggal',
      'Jam Daftar',
      'Nomor Antrean',
      'Nama Santri',
      'Status',
      'Jam Dipanggil',
      'Jam Selesai',
      'Waktu Tunggu',
      'Waktu Pelayanan',
      'Operator',
    ],
  ];

  items.forEach((item, index) => {
    const tungguStr = item.waitingDurationMinutes ? `${item.waitingDurationMinutes} menit` : '-';
    const layaniStr = item.serviceDurationMinutes ? `${item.serviceDurationMinutes} menit` : '-';

    sheet1Data.push([
      index + 1,
      item.id,
      item.date || '-',
      item.jamMasuk || '-',
      item.number,
      item.name,
      item.status,
      item.jamDipanggil || '-',
      item.jamSelesai || '-',
      tungguStr,
      layaniStr,
      item.operator || 'Kasir 1',
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Auto-width columns for Sheet 1
  ws1['!cols'] = [
    { wch: 6 }, // No
    { wch: 22 }, // ID
    { wch: 14 }, // Tanggal
    { wch: 12 }, // Jam Daftar
    { wch: 16 }, // Nomor Antrean
    { wch: 20 }, // Nama Santri
    { wch: 14 }, // Status
    { wch: 14 }, // Jam Dipanggil
    { wch: 14 }, // Jam Selesai
    { wch: 14 }, // Waktu Tunggu
    { wch: 16 }, // Waktu Pelayanan
    { wch: 14 }, // Operator
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Data Antrean');

  // ==========================================
  // SHEET 2: RINGKASAN
  // ==========================================
  const sheet2Data: (string | number)[][] = [
    ['RINGKASAN LAPORAN KANTIN SANTRI'],
    [`Periode Analisis: ${selectedPeriodLabel}`],
    [],
    ['Indikator Metrik', 'Nilai'],
    ['Total Seluruh Antrean', summary.total],
    ['Total Santri Selesai Dilayani', summary.completed],
    ['Total Santri Dilewati', summary.skipped],
    ['Total Antrean Dibatalkan', summary.cancelled],
    ['Persentase Pelayanan Selesai', summary.total > 0 ? `${Math.round((summary.completed / summary.total) * 100)}%` : '0%'],
    ['Rata-Rata Waktu Tunggu Santri', `${summary.avgWaitMinutes} menit`],
    ['Rata-Rata Waktu Pelayanan di Kasir', `${summary.avgServiceMinutes} menit`],
    [],
    ['Catatan Sistem:'],
    ['- Waktu tunggu dihitung dari jam santri mengambil antrean sampai dipanggil kasir.'],
    ['- Waktu pelayanan dihitung dari jam dipanggil sampai kasir menekan tombol SELESAI.'],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

  // ==========================================
  // SHEET 3: STATISTIK HARIAN
  // ==========================================
  const sheet3Data: (string | number)[][] = [
    ['STATISTIK ANTREAN HARIAN'],
    [`Data Riwayat Harian Kantin Santri`],
    [],
    ['No', 'Tanggal', 'Jumlah Antrean', 'Selesai', 'Dilewati', 'Dibatalkan'],
  ];

  if (summary.dailyStats && summary.dailyStats.length > 0) {
    summary.dailyStats.forEach((d, idx) => {
      sheet3Data.push([idx + 1, d.date, d.total, d.completed, d.skipped, d.cancelled]);
    });
  } else {
    sheet3Data.push([1, todayStr, summary.total, summary.completed, summary.skipped, summary.cancelled]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Statistik Harian');

  // Trigger download in browser
  XLSX.writeFile(wb, filename);
}
