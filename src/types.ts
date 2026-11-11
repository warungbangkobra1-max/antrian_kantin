export type QueueStatus = 'Menunggu' | 'Dipanggil' | 'Selesai' | 'Dilewati' | 'Dibatalkan';

export interface QueueItem {
  id: string;
  number: string; // e.g. "A025"
  name: string; // e.g. "Ahmad"
  date: string; // YYYY-MM-DD
  createdAt: number; // epoch ms
  jamMasuk: string; // HH:mm
  calledAt?: number | null;
  jamDipanggil?: string | null; // HH:mm
  completedAt?: number | null;
  jamSelesai?: string | null; // HH:mm
  status: QueueStatus;
  operator?: string; // e.g. "Kasir 1"
  counter?: string; // e.g. "Loket 1"
  callCount: number;
  waitingDurationMinutes?: number;
  serviceDurationMinutes?: number;
}

export type UserRole = 'santri' | 'kasir' | 'admin';

export interface AuthUser {
  username: string;
  role: 'kasir' | 'admin';
  name: string;
  token: string;
}

export interface QueueStats {
  total: number;
  waiting: number;
  called: number;
  completed: number;
  skipped: number;
  cancelled: number;
}

export type ReportPeriod = 'hari_ini' | 'kemarin' | 'minggu_ini' | 'bulan_ini' | 'custom';

export interface ReportSummary {
  total: number;
  completed: number;
  skipped: number;
  cancelled: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  hourlyStats: { hour: string; count: number }[];
  dailyStats: {
    date: string;
    total: number;
    completed: number;
    skipped: number;
    cancelled: number;
  }[];
}

