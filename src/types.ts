export type QueueStatus =
  | 'Menunggu'
  | 'Dipanggil'
  | 'Diproses'
  | 'Siap'
  | 'Selesai'
  | 'Dilewati'
  | 'Dibatalkan';

export interface OrderItemDetail {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
  notes?: string;
}

export interface QueueItem {
  id: string;
  clientId?: string; // Idempotency token for offline sync
  number: string; // e.g. "A025"
  name: string; // e.g. "Ahmad"
  classRoom?: string; // e.g. "Kelas 2A / Kamar Al-Fath"
  date: string; // YYYY-MM-DD
  createdAt: number; // epoch ms
  jamMasuk: string; // HH:mm
  calledAt?: number | null;
  jamDipanggil?: string | null; // HH:mm
  readyAt?: number | null;
  jamSiap?: string | null; // HH:mm
  completedAt?: number | null;
  jamSelesai?: string | null; // HH:mm
  status: QueueStatus;
  operator?: string; // e.g. "Kasir 1"
  counter?: string; // e.g. "Loket 1"
  callCount: number;
  waitingDurationMinutes?: number;
  serviceDurationMinutes?: number;
  items?: OrderItemDetail[];
  totalAmount?: number;
  notes?: string;
  paymentMethod?: 'tunai' | 'saldo_santri' | 'qris';
  paymentStatus?: 'lunas' | 'belum_bayar';
}

export type UserRole = 'santri' | 'kasir' | 'dapur' | 'admin';

export interface AuthUser {
  id?: string;
  email?: string;
  username: string;
  role: 'admin' | 'kasir' | 'dapur' | 'santri';
  name: string;
  token: string;
}

export interface QueueStats {
  total: number;
  waiting: number;
  processing: number; // In preparation / diproses
  ready: number; // Ready for pickup / siap
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
  totalRevenue: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  hourlyStats: { hour: string; count: number }[];
  dailyStats: {
    date: string;
    total: number;
    completed: number;
    skipped: number;
    cancelled: number;
    revenue?: number;
  }[];
  menuStats?: {
    name: string;
    quantity: number;
    totalRevenue: number;
  }[];
}

export interface ProductItem {
  id: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isAvailable: boolean;
  imageUrl?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}
