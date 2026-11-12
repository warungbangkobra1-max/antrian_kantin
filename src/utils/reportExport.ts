import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { QueueItem, ReportSummary } from '../types';

// ==========================================
// 1. EXCEL (.XLSX) EXPORT
// ==========================================
export function exportQueueReportToExcel(
  items: QueueItem[],
  summary: ReportSummary,
  selectedPeriodLabel: string
) {
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Antrean_Kantin_${todayStr}.xlsx`;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Data Antrean
  const sheet1Data: (string | number)[][] = [
    ['LAPORAN ANTREAN KANTIN SANTRI'],
    [`Periode: ${selectedPeriodLabel} (Diunduh: ${new Date().toLocaleString('id-ID')})`],
    [],
    [
      'No',
      'ID Antrean',
      'Tanggal',
      'Jam Daftar',
      'Nomor Antrean',
      'Nama Santri',
      'Kelas/Kamar',
      'Status',
      'Total Pesanan',
      'Jam Dipanggil',
      'Jam Selesai',
      'Waktu Tunggu',
      'Waktu Pelayanan',
      'Operator',
    ],
  ];

  items.forEach((item, index) => {
    const tungguStr = item.waitingDurationMinutes ? `${item.waitingDurationMinutes} mnt` : '-';
    const layaniStr = item.serviceDurationMinutes ? `${item.serviceDurationMinutes} mnt` : '-';
    const totalPesananStr = item.totalAmount ? `Rp ${item.totalAmount.toLocaleString('id-ID')}` : '-';

    sheet1Data.push([
      index + 1,
      item.id,
      item.date || '-',
      item.jamMasuk || '-',
      item.number,
      item.name,
      item.classRoom || '-',
      item.status,
      totalPesananStr,
      item.jamDipanggil || '-',
      item.jamSelesai || '-',
      tungguStr,
      layaniStr,
      item.operator || 'Kasir 1',
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Data Antrean');

  // Sheet 2: Ringkasan & Omzet
  const sheet2Data: (string | number)[][] = [
    ['RINGKASAN & OMZET KANTIN SANTRI'],
    [`Periode Analisis: ${selectedPeriodLabel}`],
    [],
    ['Indikator Metrik', 'Nilai'],
    ['Total Seluruh Antrean', summary.total],
    ['Total Santri Selesai Dilayani', summary.completed],
    ['Total Santri Dilewati', summary.skipped],
    ['Total Antrean Dibatalkan', summary.cancelled],
    ['Persentase Pelayanan Selesai', summary.total > 0 ? `${Math.round((summary.completed / summary.total) * 100)}%` : '0%'],
    ['Total Omzet / Penjualan', `Rp ${(summary.totalRevenue || 0).toLocaleString('id-ID')}`],
    ['Rata-Rata Waktu Tunggu Santri', `${summary.avgWaitMinutes} menit`],
    ['Rata-Rata Waktu Pelayanan di Kasir', `${summary.avgServiceMinutes} menit`],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan & Omzet');

  XLSX.writeFile(wb, filename);
}

// ==========================================
// 2. CSV EXPORT
// ==========================================
export function exportQueueReportToCSV(
  items: QueueItem[],
  selectedPeriodLabel: string
) {
  const todayStr = new Date().toISOString().split('T')[0];
  const filename = `Laporan_Antrean_Kantin_${todayStr}.csv`;

  const headers = [
    'No',
    'Tanggal',
    'Jam Daftar',
    'Nomor Antrean',
    'Nama Santri',
    'Kelas/Kamar',
    'Status',
    'Total Harga',
    'Waktu Tunggu (Menit)',
    'Operator',
  ];

  const rows = items.map((item, idx) => [
    idx + 1,
    `"${item.date || '-'}"`,
    `"${item.jamMasuk || '-'}"`,
    `"${item.number}"`,
    `"${item.name.replace(/"/g, '""')}"`,
    `"${(item.classRoom || '-').replace(/"/g, '""')}"`,
    `"${item.status}"`,
    item.totalAmount || 0,
    item.waitingDurationMinutes || 0,
    `"${item.operator || 'Kasir 1'}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// 3. PDF EXPORT
// ==========================================
export function exportQueueReportToPDF(
  items: QueueItem[],
  summary: ReportSummary,
  selectedPeriodLabel: string
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN ANTREAN KANTIN SANTRI', 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode: ${selectedPeriodLabel}  |  Tanggal Cetak: ${todayStr}`, 14, 27);

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 31, 196, 31);

  // Ringkasan Metrics
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Statistik:', 14, 38);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Total Antrean: ${summary.total}`, 16, 44);
  doc.text(`• Selesai Terlayani: ${summary.completed}`, 70, 44);
  doc.text(`• Dilewati / Batal: ${summary.skipped + summary.cancelled}`, 130, 44);

  doc.text(`• Rata-rata Tunggu: ${summary.avgWaitMinutes} menit`, 16, 50);
  doc.text(`• Rata-rata Pelayanan: ${summary.avgServiceMinutes} menit`, 70, 50);
  doc.text(`• Total Omzet: Rp ${(summary.totalRevenue || 0).toLocaleString('id-ID')}`, 130, 50);

  doc.line(14, 55, 196, 55);

  // Table Header
  let y = 62;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('No', 14, y);
  doc.text('Nomor', 24, y);
  doc.text('Nama Santri', 45, y);
  doc.text('Kelas/Kamar', 85, y);
  doc.text('Jam', 120, y);
  doc.text('Status', 140, y);
  doc.text('Total (Rp)', 170, y);

  doc.setLineWidth(0.3);
  doc.line(14, y + 2, 196, y + 2);
  y += 7;

  // Table Body (Max items that fit)
  doc.setFont('helvetica', 'normal');
  items.slice(0, 32).forEach((item, index) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(index + 1), 14, y);
    doc.text(item.number, 24, y);
    doc.text(item.name.substring(0, 20), 45, y);
    doc.text((item.classRoom || '-').substring(0, 16), 85, y);
    doc.text(item.jamMasuk || '-', 120, y);
    doc.text(item.status, 140, y);
    doc.text(item.totalAmount ? item.totalAmount.toLocaleString('id-ID') : '0', 170, y);
    y += 6.5;
  });

  // Footer Note
  if (items.length > 32) {
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`* Menampilkan 32 dari total ${items.length} data. Unduh Excel (.xlsx) untuk data lengkap tanpa batas.`, 14, 287);
  }

  doc.save(`Laporan_Antrean_${new Date().toISOString().split('T')[0]}.pdf`);
}
